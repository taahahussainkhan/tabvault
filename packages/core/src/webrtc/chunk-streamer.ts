/**
 * WebRTC DataChannel chunk streamer.
 * Slices files, encrypts chunks on-the-fly with AES-256-GCM, and streams binary frames.
 */

import { CHUNK_SIZE_BYTES, encryptChunk, decryptChunk } from '../crypto/ciphers.js';
import { encodeBinaryPacket, decodeBinaryPacket, PacketType } from '../protocol/packet.js';
import { DataChannelWrapper } from './data-channel.js';

export interface ChunkStreamProgress {
  chunksCompleted: number;
  totalChunks: number;
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
}

export class ChunkStreamer {
  /**
   * Streams a binary file/buffer across a WebRTC DataChannel with AES-256-GCM chunk encryption.
   */
  public static async sendFileStream(
    fileBuffer: ArrayBuffer,
    dataChannel: DataChannelWrapper,
    sessionKey: CryptoKey,
    baseIv: Uint8Array,
    onProgress?: (progress: ChunkStreamProgress) => void
  ): Promise<void> {
    const totalBytes = fileBuffer.byteLength;
    const totalChunks = Math.ceil(totalBytes / CHUNK_SIZE_BYTES) || 1;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE_BYTES;
      const end = Math.min(start + CHUNK_SIZE_BYTES, totalBytes);
      const rawChunk = fileBuffer.slice(start, end);

      // 1. Encrypt chunk
      const { encryptedChunk } = await encryptChunk(rawChunk, sessionKey, baseIv, chunkIndex);

      // 2. Binary wire packet encode
      const packet = encodeBinaryPacket(PacketType.FILE_CHUNK, chunkIndex, totalChunks, encryptedChunk);

      // 3. Send over DataChannel with backpressure flow control
      await dataChannel.sendSafe(packet);

      // 4. Report progress
      if (onProgress) {
        onProgress({
          chunksCompleted: chunkIndex + 1,
          totalChunks,
          bytesTransferred: end,
          totalBytes,
          percentage: Math.round((end / totalBytes) * 100),
        });
      }
    }
  }

  /**
   * Receives and decrypts a binary packet from a DataChannel message.
   */
  public static async receiveChunk(
    packetBuffer: ArrayBuffer,
    sessionKey: CryptoKey,
    baseIv: Uint8Array
  ): Promise<{ chunkIndex: number; totalChunks: number; decryptedData: ArrayBuffer }> {
    const parsedPacket = decodeBinaryPacket(packetBuffer);

    if (parsedPacket.type !== PacketType.FILE_CHUNK) {
      throw new Error(`Unexpected packet type received: ${parsedPacket.type}`);
    }

    const decryptedData = await decryptChunk(
      parsedPacket.payload,
      sessionKey,
      baseIv,
      parsedPacket.chunkIndex
    );

    return {
      chunkIndex: parsedPacket.chunkIndex,
      totalChunks: parsedPacket.totalChunks,
      decryptedData,
    };
  }
}
