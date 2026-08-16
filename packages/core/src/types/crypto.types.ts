/**
 * Cryptographic type definitions for TabVault.
 * Built on native Web Crypto API (SubtleCrypto) standards.
 */

export interface KeyPairJson {
  publicKeyJwk: JsonWebKey;
  privateKeyJwk?: JsonWebKey;
  publicKeyBase64: string;
}

export interface EncryptedPayload {
  ciphertext: string; // Base64 encoded
  iv: string;         // Base64 encoded 96-bit (12-byte) IV / Nonce
  tag?: string;       // Optional explicit Base64 auth tag (WebCrypto appends to ciphertext by default)
  checksum?: string;  // SHA-256 integrity hash
}

export interface ChunkEncryptionResult {
  chunkIndex: number;
  encryptedChunk: ArrayBuffer;
  iv: Uint8Array;
  chunkChecksum: string;
}

export interface SessionKeyContext {
  vaultId: string;
  senderDeviceId: string;
  recipientDeviceId: string;
  derivedKey: CryptoKey;
  createdAt: number;
}
