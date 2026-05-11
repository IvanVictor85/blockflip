import { PublicKey } from '@solana/web3.js';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const BlockflipIDL = require('./blockflip.json');

export const PROGRAM_ID = new PublicKey('9rrdPS31RMz51oLDMLrHc2uRZ5kr19qwafdeR7zETvDN');

export { BlockflipIDL };

// Seed constants — mirror the on-chain constants in lib.rs
export const PROTOCOL_SEED   = Buffer.from('blockflip_v1');
export const SPECIALIST_SEED = Buffer.from('specialist');
export const POOL_SEED       = Buffer.from('pool');
export const VAULT_SEED      = Buffer.from('vault');
export const POSITION_SEED   = Buffer.from('position');

// Token precision — 0 for mock SPL (devnet test token); change to 6 for real USDC
export const TOKEN_DECIMALS = 0;
