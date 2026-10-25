import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  Address, BASE_FEE, Contract, Keypair, Networks, TransactionBuilder,
  rpc, scValToNative, xdr,
} from "@stellar/stellar-sdk";
import { openCheque } from "../protocol/cheque.mjs";
import { unframe } from "../protocol/frame.mjs";
import { inspectWitnessCheque, recordWitnessChainOutcome } from "../protocol/mesh.mjs";
import { loadWitnessState, saveWitnessState } from "./witness-state.mjs";

export const TESTNET_VAULT = "CDSCQSVWKTYR7EUJK5EQXIFI4L2C4LCPQOIUYP6PMG6KW4O2BZGCRLLV";
export const TESTNET_RPC = "https://soroban-testnet.stellar.org";

// `submit` must return a finalized on-chain result; simulation alone is insufficient.
export async function uploadWitnessCheque({ witness, chequeFrame, submit }) {
  const inspection = inspectWitnessCheque(witness, chequeFrame);
  if (!inspection.ok) return { ...inspection, local: true };
  const wire = unframe(chequeFrame, "SOZU1:");
  const outcome = await submit(wire);
  recordWitnessChainOutcome(witness, chequeFrame, outcome);
  return outcome;
}

export async function submitTestnetCheque({ wire, signer, contractId = TESTNET_VAULT, rpcUrl = TESTNET_RPC }) {
  const server = new rpc.Server(rpcUrl);
  const account = await server.getAccount(signer.publicKey());
  const contract = new Contract(contractId);
  const transaction = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(contract.call(
      "settle",
      xdr.ScVal.scvBytes(wire),
      Address.fromString(signer.publicKey()).toScVal(),
    ))
    .setTimeout(30)
    .build();
  const prepared = await server.prepareTransaction(transaction);
  prepared.sign(signer);
  const sent = await server.sendTransaction(prepared);
  if (sent.status !== "PENDING") throw new Error(`sendTransaction: ${sent.status}`);
  const finalized = await server.pollTransaction(sent.hash, { attempts: 20, sleepStrategy: () => 1000 });
  if (finalized.status !== "SUCCESS") throw new Error(`transaction ${sent.hash}: ${finalized.status}`);
  const value = scValToNative(finalized.returnValue);
  return {
    ok: value.ok,
    reason: value.reason ?? null,
    fee: BigInt(value.fee),
    txHash: sent.hash,
    explorerUrl: `https://stellar.expert/explorer/testnet/tx/${sent.hash}`,
  };
}

async function main() {
  const argumentsByName = Object.fromEntries(process.argv.slice(2).reduce((rows, value, index, all) => {
    if (value.startsWith("--") && !all[index + 1]?.startsWith("--")) rows.push([value.slice(2), all[index + 1]]);
    return rows;
  }, []));
  const { "wire-json": wireJson, "wire-field": wireField, state } = argumentsByName;
  if (!wireJson || !wireField || !state) {
    throw new Error("Usage: node scripts/witness-upload.mjs --wire-json <file> --wire-field <key> --state <file> [--ephemeral-testnet yes]");
  }
  const data = JSON.parse(readFileSync(wireJson, "utf8"));
  const wireHex = data[wireField];
  if (!/^[a-f0-9]{486}$/i.test(wireHex ?? "")) throw new Error("wire must be 243 bytes of hex");
  const wire = Buffer.from(wireHex, "hex");
  const cheque = openCheque(wire);
  if (!cheque.ok) throw new Error(`Invalid cheque: ${cheque.reason}`);
  const frame = `SOZU1:${wire.toString("base64url")}`;
  const witness = loadWitnessState(state, { network: cheque.network, vault: cheque.vault });
  const secret = process.env.SOZU_TESTNET_SECRET;
  if (!secret && argumentsByName["ephemeral-testnet"] !== "yes") {
    throw new Error("Set SOZU_TESTNET_SECRET or pass --ephemeral-testnet yes for a funded throwaway testnet settler");
  }
  const outcome = await uploadWitnessCheque({
    witness, chequeFrame: frame,
    submit: async (packet) => {
      const signer = secret ? Keypair.fromSecret(secret) : Keypair.random();
      if (!secret) await new rpc.Server(TESTNET_RPC).fundAddress(signer.publicKey());
      return submitTestnetCheque({ wire: packet, signer });
    },
  });
  if (!outcome.local) saveWitnessState(state, witness);
  console.log(JSON.stringify({ ...outcome, fee: outcome.fee?.toString() }, null, 2));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
