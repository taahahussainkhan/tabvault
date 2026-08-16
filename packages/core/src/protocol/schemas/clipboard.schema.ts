import { z } from 'zod';

export const ClipboardContentTypeSchema = z.enum(['text/plain', 'text/html', 'text/uri-list']);

export const ClipboardItemPayloadSchema = z.object({
  id: z.string().min(1),
  senderDeviceId: z.string().min(1),
  senderDeviceName: z.string().min(1),
  senderPlatform: z.string(),
  contentType: ClipboardContentTypeSchema,
  encryptedContent: z.string().min(1),
  iv: z.string().min(1),
  timestamp: z.number().int().positive(),
  previewObfuscated: z.string().optional(),
});

export type ClipboardContentType = z.infer<typeof ClipboardContentTypeSchema>;
export type ClipboardItemPayload = z.infer<typeof ClipboardItemPayloadSchema>;
