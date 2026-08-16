/**
 * ECDH Key Exchange & HKDF Key Derivation using standard Web Crypto API.
 * Universally compatible with modern browsers, Node.js 20+, and Mobile Hermes.
 */

// Cross-environment SubtleCrypto getter
export function getSubtleCrypto(): SubtleCrypto {
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
    return globalThis.crypto.subtle;
  }
  throw new Error('WebCrypto subtle is not available in the current runtime environment.');
}

/**
 * Generates an ECDH (P-256) Identity KeyPair.
 */
export async function generateIdentityKeyPair(): Promise<CryptoKeyPair> {
  const subtle = getSubtleCrypto();
  return await subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true, // extractable
    ['deriveKey', 'deriveBits']
  );
}

/**
 * Exports a Public CryptoKey to a URL-safe Base64 string (SPKI format).
 */
export async function exportPublicKeyBase64(publicKey: CryptoKey): Promise<string> {
  const subtle = getSubtleCrypto();
  const exported = await subtle.exportKey('spki', publicKey);
  return arrayBufferToBase64(exported);
}

/**
 * Imports a Base64-encoded SPKI public key into a CryptoKey for ECDH.
 */
export async function importPublicKeyBase64(base64Key: string): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  const buffer = base64ToArrayBuffer(base64Key);
  return await subtle.importKey(
    'spki',
    buffer,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    []
  );
}

/**
 * Derives an AES-256-GCM Session Key from a local private key and remote public key using HKDF-SHA256.
 */
export async function deriveSessionKey(
  localPrivateKey: CryptoKey,
  remotePublicKey: CryptoKey,
  vaultId: string
): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();

  // 1. Derive shared raw secret bits via ECDH
  const sharedSecret = await subtle.deriveBits(
    {
      name: 'ECDH',
      public: remotePublicKey,
    },
    localPrivateKey,
    256 // 256 bits
  );

  // 2. Import raw bits into HKDF key
  const hkdfKey = await subtle.importKey(
    'raw',
    sharedSecret,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );

  // 3. Derive AES-GCM 256-bit encryption key with vaultId salt
  const textEncoder = new TextEncoder();
  const salt = textEncoder.encode(`tabvault-salt-${vaultId}`);
  const info = textEncoder.encode('tabvault-v1-session-key');

  return await subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt,
      info,
    },
    hkdfKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false, // non-extractable session key for security
    ['encrypt', 'decrypt']
  );
}

/**
 * Utility: Convert ArrayBuffer to Base64
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Utility: Convert Base64 to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
