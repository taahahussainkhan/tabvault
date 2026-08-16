/**
 * File transfer and streaming definitions.
 */

import { EncryptedFileHeader, TransferRoute, TransferState } from '../protocol/schemas/transfer.schema.js';

export * from '../protocol/schemas/transfer.schema.js';

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
