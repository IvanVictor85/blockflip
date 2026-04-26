<div align="center">
  <h1>🏗️ BlockFlip</h1>
  <p><strong>High-potential real estate. Real returns.</strong></p>
  <p><i>Submission for the Solana Colosseum Hackathon 2026</i></p>

  <img src="https://img.shields.io/badge/Solana-Devnet-14F195?style=flat-square&logo=solana&logoColor=black" alt="Solana Devnet" />
  <img src="https://img.shields.io/badge/Anchor-0.30.1-blue?style=flat-square" alt="Anchor" />
  <img src="https://img.shields.io/badge/Next.js-15_App_Router-black?style=flat-square&logo=next.js" alt="Next.js" />

  <br /><br />

  <code>Program ID (Devnet): 8HJ9DeCCPsvadP45ironJLS2uq7WVa6wfrBLf3VxAE5T</code>
</div>

---

## 📖 Overview

BlockFlip enforces builder accountability on-chain. No pool goes live until the operator puts skin in the game — 5% of the funding goal locked in a PDA. That's the protocol's core primitive.

Beyond that mechanic, BlockFlip is an RWA protocol that tokenizes the full lifecycle of property flipping. We connect experienced builders with global USDC liquidity. Investors fund renovation projects, track construction milestones on-chain, and receive their share of the sale profit in cycles of under 6 months.

## ✨ Key Features & Innovation

* **On-Chain Skin-in-the-Game:** A newly created pool stays `Pending` until the builder deposits a mandatory 5% guarantee from their own capital. The Anchor program enforces this state transition — the pool cannot accept investor capital before the operator commits.
* **Trustless Capital Formation:** Funds are locked in PDAs and only accessible based on hardcoded milestone execution. No multisig, no admin key.
* **Frictionless UX:** USDC investments abstracted through a Next.js frontend, localized for three regions (English, Spanish, Portuguese).
* **Real-Time ROI Simulation:** Instantaneous calculation of Conservative, Base, and Optimistic return scenarios based on funding goal and target sale price.
* **Hybrid Data Fetching:** React 18 frontend using `useMemo` and lazy-initialized state to read on-chain and local data without hydration mismatches or infinite re-render loops.

## 🏗️ Protocol Architecture (The Lifecycle)

1. **Pool Creation** — An authorized Specialist creates a property pool via the `/specialist` dashboard. The `create_pool` instruction records metadata and financial targets on-chain.
2. **Skin-in-the-Game Deposit** — The operator calls `deposit_skin_in_game`, transferring the required token amount to the Pool Vault. Pool state transitions `Pending → Funding`.
3. **Global Funding** — The pool is visible in the Dynamic Marketplace. Investors call the `invest` instruction to allocate capital directly to the vault.
4. **Renovation** — Off-chain execution with on-chain milestone updates visible in the Proof of Build view.
5. **Liquidation & Payout** — The property is sold and returns are distributed proportionally to token holders via the protocol.

## 💻 Tech Stack

### Smart Contracts (Solana/Anchor)
* **Framework:** Anchor v0.30.1
* **Language:** Rust
* **Key Programs:** SPL Token, System Program

### Frontend (Web3 Client)
* **Framework:** Next.js 15 (App Router)
* **Styling:** Tailwind CSS v4, shadcn/ui
* **Web3 Integration:** `@solana/web3.js`, `@solana/spl-token`, `@solana/wallet-adapter-react`
* **i18n:** `next-intl` (pt-BR, en-US, es-ES)

## ⚠️ Known Limitations (Devnet Scope)

This submission represents a working prototype of the core protocol primitives. The following are intentionally out of scope for this hackathon build:

* **Liquidation & Payout** — The final distribution instruction is not yet implemented on-chain. ROI distribution is currently simulated in the frontend.
* **KYC / Operator Authorization** — The specialist access control is UI-gated, not enforced by the program. Any wallet can technically call `create_pool`.
* **Milestone Verification** — Proof of Build milestones are recorded off-chain and displayed in the UI; on-chain attestation is a planned next step.

## 🎥 Pitch & Demo

* **Pitch Deck:** [Link to Presentation]
* **Video Demo (3 mins):** [Link to YouTube/Vimeo]
* **Live App (Devnet):** [Link to Vercel/Production URL]

## ⚖️ License

This project is licensed under the MIT License.
