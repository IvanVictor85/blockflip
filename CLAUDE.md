# CLAUDE.md - BlockFlip Guidelines
## Build & Test Commands
- Build: anchor build
- Test: anchor test
- Deploy: anchor deploy --provider.cluster devnet

## Code Style
- Use Anchor 0.30+ standards
- Safety: Always use require! for validations
- Types: u64 for amounts, i64 for timestamps
