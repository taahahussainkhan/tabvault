/**
 * SHA-256 Hash and Checksum utilities using standard WebCrypto.
 */

import { getSubtleCrypto } from './key-exchange.js';

/**
 * Computes a hex-encoded SHA-256 hash of an ArrayBuffer or Uint8Array.
 */
export async function computeSha256(data: ArrayBuffer | Uint8Array): Promise<string> {
  const subtle = getSubtleCrypto();
  const bufferSource = (data instanceof Uint8Array ? data : new Uint8Array(data)) as unknown as BufferSource;
  const hashBuffer = await subtle.digest('SHA-256', bufferSource);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates that an ArrayBuffer matches the expected SHA-256 hash.
 */
export async function verifySha256(data: ArrayBuffer | Uint8Array, expectedHexHash: string): Promise<boolean> {
  const computedHash = await computeSha256(data);
  return computedHash.toLowerCase() === expectedHexHash.toLowerCase();
}
