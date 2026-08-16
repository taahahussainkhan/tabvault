import { z } from 'zod';

export const TransferRouteSchema = z.enum(['webrtc_lan', 's3_relay_fallback']);

export const TransferStateSchema = z.enum([
  'queued',
  'negotiating_route',
  'encrypting',
  'transferring',
  'decrypting',
  'completed',
  'failed',
  'cancelled',
]);

export const FileMetadataSchema = z.object({
  transferId: z.string().min(1),
  vaultId: z.string().min(1),
  fileName: z.string().min(1),
  fileSize: z.number().int().nonnegative(),
  mimeType: z.string().min(1),
  totalChunks: z.number().int().positive(),
  chunkSize: z.number().int().positive(),
  fileChecksum: z.string().min(10),
  createdAt: z.number().int().positive(),
});

export const EncryptedFileHeaderSchema = z.object({
  transferId: z.string().min(1),
  encryptedMetadata: z.string().min(1),
  metadataIv: z.string().min(1),
  fileSize: z.number().int().nonnegative(),
  totalChunks: z.number().int().positive(),
  chunkSize: z.number().int().positive(),
  fileChecksum: z.string().min(10),
  senderDeviceId: z.string().min(1),
  targetDeviceId: z.string().min(1),
});

export type TransferRoute = z.infer<typeof TransferRouteSchema>;
export type TransferState = z.infer<typeof TransferStateSchema>;
export type FileMetadata = z.infer<typeof FileMetadataSchema>;
export type EncryptedFileHeader = z.infer<typeof EncryptedFileHeaderSchema>;
