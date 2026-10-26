import { createPrivateKey, randomBytes, randomInt } from "node:crypto";
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { BASE_FEE, Contract, Keypair, Networks, StrKey, TransactionBuilder, contract, nativeToScVal, rpc, scValToNative, xdr } from "@stellar/stellar-sdk";
import { DEMO_FEE, issueCheque, NETWORK_TESTNET, openCheque } from "../protocol/cheque.mjs";
import { acceptPayment, createPhone } from "../protocol/mesh.mjs";
import { generateIdentity } from "../protocol/p256.mjs";
import { submitTestnetCheque, TESTNET_RPC, TESTNET_VAULT, uploadWitnessCheque } from "./witness-upload.mjs";
import { loadWitnessState, saveWitnessState } from "./witness-state.mjs";

// Claim JSON files are deliberately outside Git. Never log wallet.secret.
const walletFiles = process.env.SOZU_VINI_WALLET_FILES?.split(";").filter(Boolean) ?? [];
if (walletFiles.length < 3) throw new Error("Set SOZU_VINI_WALLET_FILES to three local faucet claim JSON paths");
const wallets = walletFiles.map((path, index) => {
  const claim = JSON.parse(readFileSync(path, "utf8"));
  if (!claim.wallet?.secret || (!claim.success && !(index >= 3 && claim.wallet.funded && claim.wallet.trustline))) {
    throw new Error(`Unusable faucet wallet: ${path}`);
  }
  return Keypair.fromSecret(claim.wallet.secret);
});
const owners = wallets.slice(0, 3);
const server = new rpc.Server(TESTNET_RPC);
const horizon = "https://horizon-testnet.stellar.org";
const asset = "USDC";
const issuer = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
const logPath = process.env.SOZU_VINI_LOG;
if (!logPath) throw new Error("Set SOZU_VINI_LOG to a local path outside Git");
const keyPath = process.env.SOZU_VINI_KEYS;
if (!keyPath) throw new Error("Set SOZU_VINI_KEYS to a local path outside Git");
const statePath = process.env.SOZU_VINI_STATE;
if (!statePath) throw new Error("Set SOZU_VINI_STATE to a local path outside Git");
const log = (row) => appendFileSync(logPath, `${JSON.stringify({ at: new Date().toISOString(), ...row })}\n`);

async function usdcBalance(account) {
  const response = await fetch(`${horizon}/accounts/${account}`);
  if (!response.ok) throw new Error(`Horizon account ${response.status}`);
  const data = await response.json();
  const balance = data.balances.find((row) => row.asset_code === asset && row.asset_issuer === issuer);
  if (!balance) throw new Error("Circle testnet USDC trustline missing");
  return BigInt(Math.round(Number(balance.balance) * 10_000_000));
}

async function invoke(signer, method, ...args) {
  const account = await server.getAccount(signer.publicKey());
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(new Contract(TESTNET_VAULT).call(method, ...args)).setTimeout(30).build();
  const prepared = await server.prepareTransaction(tx);
  prepared.sign(signer);
  const sent = await server.sendTransaction(prepared);
  if (sent.status !== "PENDING") throw new Error(`${method}: ${sent.status}`);
  const final = await server.pollTransaction(sent.hash, { attempts: 30, sleepStrategy: () => 1000 });
  if (final.status !== "SUCCESS") throw new Error(`${method}: ${sent.hash} ${final.status}`);
  return sent.hash;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const command = process.argv[2];
let identities;
if (existsSync(keyPath)) {
  const saved = JSON.parse(readFileSync(keyPath, "utf8"));
  identities = saved.map((row) => ({
    privateKey: createPrivateKey(row.privateKey),
    compressed: Buffer.from(row.compressed, "hex"),
  }));
} else {
  identities = owners.map(() => generateIdentity());
  writeFileSync(keyPath, JSON.stringify(identities.map((row) => ({
    privateKey: row.privateKey.export({ type: "pkcs8", format: "pem" }),
    compressed: row.compressed.toString("hex"),
  }))), { flag: "wx", mode: 0o600 });
}
if (identities.length !== owners.length) throw new Error("Device key count mismatch");
// The deployed contract's constructor uses the frozen 32-byte protocol vault ID,
// which is distinct from its Stellar C-address.
const vaultBytes = Buffer.alloc(32, 1);
const witness = loadWitnessState(statePath, { network: NETWORK_TESTNET, vault: vaultBytes });
const channelClients = new Map();

async function submitViaChannelOnce(wire, source, settler) {
  if (!channelClients.has(source.publicKey())) {
    const { signTransaction } = contract.basicNodeSigner(source, Networks.TESTNET);
    channelClients.set(source.publicKey(), contract.Client.from({ contractId: TESTNET_VAULT,
      rpcUrl: TESTNET_RPC, networkPassphrase: Networks.TESTNET,
      publicKey: source.publicKey(), signTransaction }));
  }
  const client = await channelClients.get(source.publicKey());
  const tx = await client.settle({ wire, settler: settler.publicKey() });
  if (source.publicKey() !== settler.publicKey()) {
    const { signAuthEntry } = contract.basicNodeSigner(settler, Networks.TESTNET);
    await tx.signAuthEntries({ address: settler.publicKey(), signAuthEntry });
  }
  const result = await tx.signAndSend();
  const finalized = result.getTransactionResponse;
  if (finalized?.status !== "SUCCESS") throw new Error(`channel transaction: ${finalized?.status}`);
  const value = scValToNative(finalized.returnValue);
  const hash = result.sendTransactionResponse.hash;
  return { ok: value.ok, reason: value.reason ?? null, fee: BigInt(value.fee), txHash: hash,
    explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}` };
}

async function submitViaChannel(wire, source, settler) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await submitViaChannelOnce(wire, source, settler);
    } catch (error) {
      if (!String(error.message).includes("tx_bad_seq") || attempt === 2) throw error;
      await sleep(1000 + attempt * 1000);
    }
  }
}

if (command === "deposit") {
  const collateral = BigInt(process.argv[3] ?? "100000000");
  const expiry = Math.floor(Date.now() / 1000) + 3 * 24 * 3600;
  for (let i = 0; i < owners.length; i++) {
    const balance = await usdcBalance(wallets[i].publicKey());
    if (balance < collateral) throw new Error(`wallet ${i + 1} insufficient balance`);
    const hash = await invoke(wallets[i], "deposit",
      xdr.ScVal.scvBytes(StrKey.decodeEd25519PublicKey(wallets[i].publicKey())),
      xdr.ScVal.scvBytes(identities[i].compressed),
      nativeToScVal(collateral, { type: "i128" }),
      nativeToScVal(BigInt(expiry), { type: "u64" }),
    );
    log({ type: "deposit", owner: wallets[i].publicKey(), collateral: collateral.toString(), deviceKey: identities[i].compressed.toString("hex"), hash });
    console.log(`deposit ${i + 1}: https://stellar.expert/explorer/testnet/tx/${hash}`);
  }
} else if (command === "channel-one") {
  const noteId = randomBytes(16);
  const owner = wallets[0];
  const settler = wallets[1];
  const source = wallets[2];
  const amount = 10_000n;
  const cheque = issueCheque({ network: NETWORK_TESTNET, vault: vaultBytes,
    noteId, amount, fee: DEMO_FEE, cap: amount + DEMO_FEE,
    expiry: BigInt(Math.floor(Date.now() / 1000) + 24 * 3600),
    owner: StrKey.decodeEd25519PublicKey(owner.publicKey()),
    payee: StrKey.decodeEd25519PublicKey(source.publicKey()),
  }, identities[0].privateKey, identities[0].compressed);
  const result = await submitViaChannel(cheque.wire, source, settler);
  log({ type: "settle", noteId: noteId.toString("hex"), owner: owner.publicKey(),
    settler: settler.publicKey(), source: source.publicKey(), ok: result.ok,
    reason: result.reason, fee: String(result.fee), hash: result.txHash });
  console.log(`channel: ${result.ok ? "ok" : result.reason} ${result.explorerUrl}`);
} else if (command === "duplicate") {
  const rows = readFileSync(logPath, "utf8").trim().split("\n").map((line) => JSON.parse(line));
  const prior = [...rows].reverse().find((row) => row.type === "settle" && row.ok);
  if (!prior) throw new Error("No successful settle in local event log");
  const ownerIndex = owners.findIndex((wallet) => wallet.publicKey() === prior.owner);
  if (ownerIndex < 0) throw new Error("Original owner not present");
  const settler = owners[randomInt(owners.length)];
  const amount = 10_000n;
  const duplicate = issueCheque({ network: NETWORK_TESTNET, vault: vaultBytes,
    noteId: Buffer.from(prior.noteId, "hex"), amount, fee: DEMO_FEE, cap: amount + DEMO_FEE,
    expiry: BigInt(Math.floor(Date.now() / 1000) + 24 * 3600),
    owner: StrKey.decodeEd25519PublicKey(wallets[ownerIndex].publicKey()),
    payee: StrKey.decodeEd25519PublicKey(wallets[(ownerIndex + 2) % owners.length].publicKey()),
  }, identities[ownerIndex].privateKey, identities[ownerIndex].compressed);
  const outcome = await submitTestnetCheque({ wire: duplicate.wire, signer: settler });
  log({ type: "duplicate", noteId: prior.noteId, owner: prior.owner,
    settler: settler.publicKey(), ok: outcome.ok, reason: outcome.reason, fee: String(outcome.fee), hash: outcome.txHash });
  console.log(`duplicate: ${outcome.reason}, fee ${outcome.fee}, ${outcome.explorerUrl}`);
  if (outcome.ok || outcome.reason !== "note-used" || outcome.fee !== 0n) throw new Error("Unexpected duplicate outcome");
} else if (command === "run") {
  const count = Number(process.argv[3] ?? "1");
  const settlerIndex = randomInt(owners.length);
  const settler = wallets[settlerIndex];
  const expiry = BigInt(Math.floor(Date.now() / 1000) + 24 * 3600);
  const amount = 10_000n; // 0.001 USDC. Each settle consumes 0.011 incl. DEMO_FEE.
  const perOwner = Array(owners.length).fill(0n);
  for (let n = 0; n < count; n++) {
    const ownerIndex = n % owners.length;
    perOwner[ownerIndex] += amount + DEMO_FEE;
  }
  for (let i = 0; i < owners.length; i++) {
    if (perOwner[i] > 100_000_000n) throw new Error(`wallet ${i + 1}: amount + fee exceeds 10 USDC deposit`);
  }
  console.log(`settler: ${settler.publicKey()}, planned ${count} calls`);
  for (let n = 0; n < count; n++) {
    const i = n % owners.length;
    const noteId = randomBytes(16);
    const cheque = issueCheque({ network: NETWORK_TESTNET, vault: vaultBytes, noteId,
      amount, fee: DEMO_FEE, cap: amount + DEMO_FEE, expiry,
      owner: StrKey.decodeEd25519PublicKey(wallets[i].publicKey()),
      payee: StrKey.decodeEd25519PublicKey(wallets[(i + 1) % owners.length].publicKey()),
    }, identities[i].privateKey, identities[i].compressed);
    if (cheque.body.length !== 179 || cheque.signature.length !== 64 || cheque.wire.length !== 243 || !cheque.frame.startsWith("SOZU1:") || !openCheque(cheque.wire).ok) {
      throw new Error("Frozen cheque wire validation failed");
    }
    const relay = createPhone({ id: `faucet-phone-${i + 1}`, network: NETWORK_TESTNET,
      vault: vaultBytes, identity: identities[i], account: StrKey.decodeEd25519PublicKey(wallets[i].publicKey()) });
    const received = acceptPayment(relay, cheque.frame, Math.floor(Date.now() / 1000));
    if (!received.ok || received.status !== "pending") throw new Error(`Phone relay rejected cheque: ${received.reason}`);
    const outcome = await uploadWitnessCheque({ witness, chequeFrame: cheque.frame,
      submit: (wire) => submitTestnetCheque({ wire, signer: settler }) });
    if (!outcome.local) saveWitnessState(statePath, witness);
    log({ type: "settle", noteId: noteId.toString("hex"), owner: wallets[i].publicKey(),
      settler: settler.publicKey(), ok: outcome.ok, reason: outcome.reason, fee: String(outcome.fee), hash: outcome.txHash });
    console.log(`${n + 1}/${count}: ${outcome.ok ? "ok" : outcome.reason} ${outcome.explorerUrl}`);
    if (!outcome.ok) throw new Error(`settle rejected: ${outcome.reason}`);
    await sleep(randomInt(300, 1500));
  }
} else if (command === "window") {
  const minutes = Number(process.argv[3]);
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 16) throw new Error("window minutes must be 1..16");
  const targets = [];
  for (let minute = 0; minute < minutes; minute++) {
    let target;
    do { target = randomInt(29, 36); } while (target === targets[minute - 1]);
    targets.push(target);
  }
  const count = targets.reduce((sum, value) => sum + value, 0);
  const prior = readFileSync(logPath, "utf8").trim().split("\n").map((line) => JSON.parse(line));
  const settler = owners[randomInt(owners.length)];
  const startOwner = randomInt(owners.length);
  const plannedByOwner = owners.map((wallet, i) => {
    const already = prior.filter((row) => row.type === "settle" && row.ok && row.owner === wallet.publicKey()).length + (i === 0 ? 3 : 0);
    const planned = Array.from({ length: count }, (_, n) => (n + startOwner) % owners.length === i ? 1 : 0)
      .reduce((sum, value) => sum + value, 0);
    return BigInt(already + planned) * (10_000n + DEMO_FEE);
  });
  for (let i = 0; i < owners.length; i++) {
    if (plannedByOwner[i] > 90_000_000n) throw new Error(`wallet ${i + 1}: amount + fee exceeds reserved new collateral`);
  }
  log({ type: "window-start", minutes, targets, count, settler: settler.publicKey() });
  console.log(`window ${minutes} min, target counts ${targets.join(",")}, settler ${settler.publicKey()}`);
  const chains = wallets.map(() => Promise.resolve());
  const results = [];
  const failures = [];
  const started = Date.now();
  let globalIndex = 0;
  for (let minute = 0; minute < minutes; minute++) {
    const offsets = Array.from({ length: targets[minute] }, (_, n) =>
      (n + Math.random() * 0.7) * 60_000 / targets[minute]).sort((a, b) => a - b);
    for (const offset of offsets) {
      const due = started + minute * 60_000 + offset;
      await sleep(Math.max(0, due - Date.now()));
      const n = globalIndex++;
      const ownerIndex = (n + startOwner) % owners.length;
      const sourceIndex = n % wallets.length;
      const noteId = randomBytes(16);
      const amount = 10_000n;
      const cheque = issueCheque({ network: NETWORK_TESTNET, vault: vaultBytes, noteId,
        amount, fee: DEMO_FEE, cap: amount + DEMO_FEE,
        expiry: BigInt(Math.floor(Date.now() / 1000) + 24 * 3600),
        owner: StrKey.decodeEd25519PublicKey(wallets[ownerIndex].publicKey()),
        payee: StrKey.decodeEd25519PublicKey(wallets[(ownerIndex + 1) % owners.length].publicKey()),
      }, identities[ownerIndex].privateKey, identities[ownerIndex].compressed);
      if (cheque.body.length !== 179 || cheque.signature.length !== 64 || cheque.wire.length !== 243 || !openCheque(cheque.wire).ok) {
        throw new Error("Frozen cheque wire validation failed");
      }
      const relay = createPhone({ id: `faucet-phone-${ownerIndex + 1}`, network: NETWORK_TESTNET,
        vault: vaultBytes, identity: identities[ownerIndex], account: StrKey.decodeEd25519PublicKey(wallets[ownerIndex].publicKey()) });
      const received = acceptPayment(relay, cheque.frame, Math.floor(Date.now() / 1000));
      if (!received.ok) throw new Error(`Phone relay rejected cheque: ${received.reason}`);
      chains[sourceIndex] = chains[sourceIndex].then(async () => {
        const outcome = await uploadWitnessCheque({ witness, chequeFrame: cheque.frame,
          submit: (wire) => submitViaChannel(wire, wallets[sourceIndex], settler) });
        if (!outcome.local) saveWitnessState(statePath, witness);
        log({ type: "settle", windowMinutes: minutes, noteId: noteId.toString("hex"),
          owner: wallets[ownerIndex].publicKey(), settler: settler.publicKey(),
          source: wallets[sourceIndex].publicKey(), ok: outcome.ok, reason: outcome.reason,
          fee: String(outcome.fee), hash: outcome.txHash });
        results.push({ at: Date.now(), ok: outcome.ok, hash: outcome.txHash });
        if (!outcome.ok) throw new Error(`settle rejected: ${outcome.reason}`);
      }).catch((error) => {
        failures.push(error.message);
        log({ type: "submit-error", windowMinutes: minutes, noteId: noteId.toString("hex"), error: error.message });
      });
    }
  }
  await Promise.all(chains);
  const durationMs = Date.now() - started;
  const actual = Array.from({ length: Math.ceil(durationMs / 60_000) }, () => 0);
  for (const row of results) actual[Math.floor((row.at - started) / 60_000)]++;
  log({ type: "window-end", minutes, durationMs, attempted: count, settled: results.length, actual });
  console.log(`window complete: ${results.length} settled, ${actual.join(",")} per minute, ${(results.length * 60_000 / durationMs).toFixed(1)}/min`);
  if (failures.length) throw new Error(`${failures.length} submit failures, first: ${failures[0]}`);
} else {
  throw new Error("Usage: deposit <minor units> | run <count> | duplicate | window <minutes>");
}
