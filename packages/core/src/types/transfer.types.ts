/**
 * File transfer and streaming definitions.
 */

export type TransferRoute = 'webrtc_lan' | 's3_relay_fallback';

export type TransferState =
  | 'queued'
  | 'negotiating_route'
  | 'encrypting'
  | 'transferring'
  | 'decrypting'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface FileMetadata {
  transferId: string;
  vaultId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  totalChunks: number;
  chunkSize: number;
  fileChecksum: string; // SHA-256
  createdAt: number;
}

export interface EncryptedFileHeader {
  transferId: string;
  encryptedMetadata: string; // Base64 (fileName, mimeType encrypted)
  metadataIv: string;
  fileSize: number;
  totalChunks: number;
  chunkSize: number;
  fileChecksum: string;
  senderDeviceId: string;
  targetDeviceId: string;
}

export interface TransferProgress {
  transferId: string;
  fileName: string;
  fileSize: number;
  bytesTransferred: number;
  chunksCompleted: number;
  totalChunks: number;
  speedBytesPerSec: number;
  estimatedSecondsRemaining: number;
  state: TransferState;
  route: TransferRoute;
  error?: string;
}

export interface S3RelayDropMetadata {
  transferId: string;
  vaultId: string;
  senderDeviceId: string;
  targetDeviceId: string;
  fileSize: number;
  s3Key: string;
  presignedDownloadUrl?: string;
  encryptedHeader: EncryptedFileHeader;
  expiresAt: number;
}
