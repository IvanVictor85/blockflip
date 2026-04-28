// OWASP: Injection — Input sanitization utilities

/**
 * Truncates a blockchain address for display.
 * Never show raw full addresses in UI without truncation.
 */
export function truncateAddress(address: string, chars = 4): string {
  if (!address || address.length < chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Validates a Solana public key format (base58, 32-44 chars).
 * Use before any on-chain interaction.
 */
export function isValidSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

/**
 * Sanitizes a string for safe display in the DOM.
 * Prevents XSS by stripping HTML tags.
 */
export function sanitizeString(input: string): string {
  return input.replace(/[<>"'&]/g, (char) => {
    const map: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;',
    };
    return map[char] ?? char;
  });
}

/**
 * OWASP: SSRF — Validates that a URL belongs to the allowed whitelist.
 * Use before making any external requests.
 */
const ALLOWED_DOMAINS = [
  'explorer.solana.com',
  'api.mainnet-beta.solana.com',
  'api.devnet.solana.com',
  'ipfs.io',
];

export function isAllowedExternalUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

/**
 * OWASP: SSRF / A10 — Validates image URLs against a strict allowlist.
 * Prevents tracking pixels, internal network probing, and data: URI injection.
 * Must be called before rendering any <img src> from user-supplied data.
 */
const ALLOWED_IMAGE_DOMAINS = [
  'images.unsplash.com',
  'ipfs.io',
  'nftstorage.link',
  'arweave.net',
  'cloudflare-ipfs.com',
];

export function isAllowedImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const { protocol, hostname } = new URL(url);
    // Block data:, blob:, javascript:, and http: (insecure)
    if (protocol !== 'https:') return false;
    return ALLOWED_IMAGE_DOMAINS.some(
      (d) => hostname === d || hostname.endsWith(`.${d}`)
    );
  } catch {
    return false;
  }
}

/**
 * Generates a Solana Explorer URL for an address.
 * Only uses the whitelisted explorer domain.
 */
export function getSolanaExplorerUrl(
  address: string,
  cluster: 'mainnet' | 'devnet' = 'mainnet'
): string {
  const clusterParam = cluster === 'devnet' ? '?cluster=devnet' : '';
  return `https://explorer.solana.com/address/${address}${clusterParam}`;
}
