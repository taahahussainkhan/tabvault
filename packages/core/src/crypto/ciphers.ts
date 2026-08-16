/**
 * AES-256-GCM Encryption and Decryption engine.
 * Supports streaming 64KB chunks with deterministic, authenticated nonces.
 */

import { getSubtleCrypto, arrayBufferToBase64, base64ToArrayBuffer } from './key-exchange.js';
import { EncryptedPayload, ChunkEncryptionResult } from '../types/crypto.types.js';

export const AES_GCM_IV_LENGTH_BYTES = 12; // 96 bits standard for GCM
export const CHUNK_SIZE_BYTES = 64 * 1024; // 64 KB per WebRTC frame

/**
 * Generates a cryptographically random 12-byte IV.
 */
export function generateRandomIv(): Uint8Array {
  const iv = new Uint8Array(AES_GCM_IV_LENGTH_BYTES);
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    globalThis.crypto.getRandomValues(iv);
  } else {
    throw new Error('crypto.getRandomValues is unavailable.');
  }
  return iv;
}

/**
 * Derives a deterministic 12-byte IV for a specific chunk index based on a base IV.
 * Prevents IV collision in chunked file transfers without transmitting 12 new bytes per chunk.
 */
export function deriveChunkIv(baseIv: Uint8Array, chunkIndex: number): Uint8Array {
  const chunkIv = new Uint8Array(baseIv);
  const view = new DataView(chunkIv.buffer, chunkIv.byteOffset, chunkIv.byteLength);
  // Modify the last 4 bytes with the chunkIndex (big-endian)
  const currentCounter = view.getUint32(8, false);
  view.setUint32(8, currentCounter ^ chunkIndex, false);
  return chunkIv;
}

/**
 * Encrypts a string (e.g., clipboard text or JSON metadata) with AES-256-GCM.
 */
export async function encryptText(text: string, key: CryptoKey): Promise<EncryptedPayload> {
  const subtle = getSubtleCrypto();
  const encoder = new TextEncoder();
  const plaintextBuffer = encoder.encode(text);
  const iv = generateRandomIv();

  const ciphertextBuffer = await subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    plaintextBuffer
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertextBuffer),
    iv: arrayBufferToBase64(iv.buffer),
  };
}

/**
 * Decrypts an EncryptedPayload back into plaintext string.
 */
export async function decryptText(payload: EncryptedPayload, key: CryptoKey): Promise<string> {
  const subtle = getSubtleCrypto();
  const ciphertextBuffer = base64ToArrayBuffer(payload.ciphertext);
  const ivBuffer = base64ToArrayBuffer(payload.iv);

  const decryptedBuffer = await subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(ivBuffer),
    },
    key,
    ciphertextBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

/**
 * Encrypts a single binary chunk (ArrayBuffer) using AES-256-GCM.
 */
export async function encryptChunk(
  chunkBuffer: ArrayBuffer,
  key: CryptoKey,
  baseIv: Uint8Array,
  chunkIndex: number
): Promise<ChunkEncryptionResult> {
  const subtle = getSubtleCrypto();
  const chunkIv = deriveChunkIv(baseIv, chunkIndex);

  const encryptedChunk = await subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: chunkIv,
    },
    key,
    chunkBuffer
  );

  return {
    chunkIndex,
    encryptedChunk,
    iv: chunkIv,
    chunkChecksum: '', // Optional per-chunk checksum
  };
}

/**
 * Decrypts a single binary chunk (ArrayBuffer) using AES-256-GCM.
 */
export async function decryptChunk(
  encryptedChunk: ArrayBuffer,
  key: CryptoKey,
  baseIv: Uint8Array,
  chunkIndex: number
): Promise<ArrayBuffer> {
  const subtle = getSubtleCrypto();
  const chunkIv = deriveChunkIv(baseIv, chunkIndex);

  return await subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: chunkIv,
    },
    key,
    encryptedChunk
  );
}
