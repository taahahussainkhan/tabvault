import { z } from 'zod';
import { PlatformTypeSchema } from './device.schema.js';

export const PairingPayloadSchema = z.object({
  version: z.literal(1),
  vaultId: z.string().min(4).max(64),
  deviceId: z.string().min(3).max(64),
  deviceName: z.string().min(1).max(64),
  platform: PlatformTypeSchema,
  publicKeyBase64: z.string().min(10),
  relayRoomId: z.string().min(4).max(64),
  syncCode: z.string().length(6).optional(),
  timestamp: z.number().int().positive(),
});

export type PairingPayload = z.infer<typeof PairingPayloadSchema>;
