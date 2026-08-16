/**
 * Binary Packet Framing for WebRTC DataChannel chunk streaming.
 *
 * Binary Frame Format:
 * +-------------------+--------------------+--------------------+--------------------+
 * | Magic (4 bytes)   | Packet Type (1B)   | Chunk Index (4B)   | Total Chunks (4B)  |
 * | 'T' 'B' 'V' 'T'   | 0x01 = FileChunk   | Uint32 BE          | Uint32 BE          |
 * +-------------------+--------------------+--------------------+--------------------+
 * | Payload Len (4B)  | Encrypted Payload (up to 64KB AES-GCM)                        |
 * | Uint32 BE         | ArrayBuffer                                                |
 * +-------------------+--------------------------------------------------------------+
 */

export const PACKET_MAGIC = new Uint8Array([0x54, 0x42, 0x56, 0x54]); // "TBVT"
export const PACKET_HEADER_SIZE_BYTES = 17; // 4 + 1 + 4 + 4 + 4

export enum PacketType {
  FILE_HEADER = 0x00,
  FILE_CHUNK = 0x01,
  FILE_ACK = 0x02,
  FILE_CANCEL = 0x03,
  PING = 0x08,
  PONG = 0x09,
}

export interface ParsedPacket {
  type: PacketType;
  chunkIndex: number;
  totalChunks: number;
  payloadLength: number;
  payload: ArrayBuffer;
}

/**
 * Encodes a binary packet frame into an ArrayBuffer ready for DataChannel.send().
 */
export function encodeBinaryPacket(
  type: PacketType,
  chunkIndex: number,
  totalChunks: number,
  payload: ArrayBuffer
): ArrayBuffer {
  const payloadLength = payload.byteLength;
  const totalLength = PACKET_HEADER_SIZE_BYTES + payloadLength;
  const buffer = new ArrayBuffer(totalLength);
  const uint8View = new Uint8Array(buffer);
  const dataView = new DataView(buffer);

  // 1. Magic bytes (4B)
  uint8View.set(PACKET_MAGIC, 0);

  // 2. Packet Type (1B)
  dataView.setUint8(4, type);

  // 3. Chunk Index (4B Big-Endian)
  dataView.setUint32(5, chunkIndex, false);

  // 4. Total Chunks (4B Big-Endian)
  dataView.setUint32(9, totalChunks, false);

  // 5. Payload Length (4B Big-Endian)
  dataView.setUint32(13, payloadLength, false);

  // 6. Payload Body
  uint8View.set(new Uint8Array(payload), PACKET_HEADER_SIZE_BYTES);

  return buffer;
}

/**
 * Decodes a binary packet frame from an incoming DataChannel ArrayBuffer.
 */
export function decodeBinaryPacket(buffer: ArrayBuffer): ParsedPacket {
  if (buffer.byteLength < PACKET_HEADER_SIZE_BYTES) {
    throw new Error(`Packet too small: ${buffer.byteLength} bytes (minimum ${PACKET_HEADER_SIZE_BYTES})`);
  }

  const uint8View = new Uint8Array(buffer);
  const dataView = new DataView(buffer);

  // Validate Magic
  for (let i = 0; i < 4; i++) {
    if (uint8View[i] !== PACKET_MAGIC[i]) {
      throw new Error('Invalid packet magic header: not a TabVault binary frame');
    }
  }

  const type = dataView.getUint8(4) as PacketType;
  const chunkIndex = dataView.getUint32(5, false);
  const totalChunks = dataView.getUint32(9, false);
  const payloadLength = dataView.getUint32(13, false);

  const payload = buffer.slice(PACKET_HEADER_SIZE_BYTES, PACKET_HEADER_SIZE_BYTES + payloadLength);

  return {
    type,
    chunkIndex,
    totalChunks,
    payloadLength,
    payload,
  };
}
