# CLAUDE.md - BlockFlip Project Guidelines

## Project Context
BlockFlip is a Web3 RWA (Real World Assets) protocol on Solana for the **Colosseum Hackathon 2026**.

**Core Primitive**: Skin-in-the-game on-chain — operators deposit 5% of funding goal in a PDA before the pool accepts investor capital.

**Stack**:
- **Blockchain**: Anchor 0.30.1, Solana devnet
- **Frontend**: Next.js 15 App Router, Tailwind v4, shadcn/ui
- **i18n**: next-intl (pt-BR, en-US, es-ES)
- **Program ID**: `8HJ9DeCCPsvadP45ironJLS2uq7WVa6wfrBLf3VxAE5T` (devnet)

## Build & Test Commands
```bash
# Anchor program
anchor build
anchor test
anchor deploy --provider.cluster devnet

# Frontend
npm run build    # Runs type-check + lint + next build
npm run dev      # Development server
npm run lint     # ESLint with --max-warnings=0
```

## Code Style

### Anchor Program
- Use Anchor 0.30+ standards
- Safety: Always use `require!` for validations
- Types: `u64` for amounts, `i64` for timestamps
- Security: Never skip account validation, use checked arithmetic

### Frontend
- Use TypeScript strict mode
- Components: Prefer server components, mark with `'use client'` when needed
- Translations: All user-facing text via `useTranslations()` from next-intl
- Icons: Use lucide-react
- Styling: Tailwind utility classes, no inline styles

## Brand Guidelines
- **Colors**: Solana green `#14F195` for accents, off-white `#F0EDE5` for logo
- **Logo**: SVG system in `public/brand/` (symbol, horizontal variants)
- **Tone**: Professional, institutional DeFi — not meme coin/casino
- **Positioning**: Web2.5 (crypto-native backend, "Dona Maria" frontend)

## Security Checklist
- [ ] No XSS vectors (sanitize user inputs, use `rel="noopener noreferrer"`)
- [ ] No hardcoded secrets (use env vars)
- [ ] Image URLs validated via `isAllowedImageUrl()` before DB persist
- [ ] All external links use `target="_blank" rel="noopener noreferrer"`
- [ ] Server actions validated and error-handled

## Git Workflow
- **Branch naming**: `<type>/<scope>-<description>-<DD-MM-YYYY>`
- **Commit style**: Conventional commits (`feat:`, `fix:`, `chore:`)
- **Pre-commit**: Type-check + lint must pass (enforced by npm run build)

---

## Extended Solana Configuration

This project also includes **solana-claude** configuration with:
- 15 specialized agents (token-engineer, solana-architect, defi-engineer, etc.)
- 25 workflow commands (/audit-solana, /profile-cu, /quick-commit, etc.)
- MCP server integrations (Helius, Trail of Bits, Solana Foundation docs)

See `CLAUDE-solana.md` for full Solana development guidelines and available tools.

### Key Commands for BlockFlip
- `/audit-solana` — Security audit with Trail of Bits rules
- `/profile-cu` — Optimize compute units per instruction
- `/quick-commit` — Automated conventional commits
- `/build-program` — Build Anchor program with validation

### Key Agents
- `token-engineer` — Token-2022 extensions, RWA tokenization
- `solana-architect` — PDA design, custody logic, system architecture
- `defi-engineer` — DeFi integrations (Jupiter, Drift, etc.)
- `solana-qa-engineer` — Testing, CU profiling, quality assurance
