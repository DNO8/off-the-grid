---
trunk: dev
featureBase: dev
deployTrigger: dev
promotionChain:
  - dev
---

# Git flow for this repo

**Model**: custom

**Promotion chain**: `dev`

- **featureBase** (`dev`) — new feature PRs (the output of `/ship-ticket`) target this branch.
- **deployTrigger** (`dev`) — when a PR merges into this branch, the GitHub Action scaffolded by `/setup-merge-hook` acts on any linked Tickets: transitioning them from `QA` to `DONE`, ticking their scope's feature requirements as met, or both.

GitHub's default branch is `main`. Detection found no `develop`, `staging`, `release`, `qa`, `uat`, or `preprod` branch, which would record a trunk-based chain of `main`. The live base for this demo is `dev` (sozu-offline PR 2 merged there). The chain is the single node `dev`.

One ticket, one branch, one PR. One action, one commit.

## How skills use this file

- `/ship-ticket` reads `featureBase` to set the base branch of new PRs.
- `/setup-merge-hook` reads `deployTrigger` to set the `on.pull_request.branches` filter for the GitHub Action.
- The Action scans **Rollup PRs** (PRs that promote work between chain nodes) for child PR references in commit messages so Tickets linked to feature PRs are still promoted when their work reaches the deployTrigger through the chain.
