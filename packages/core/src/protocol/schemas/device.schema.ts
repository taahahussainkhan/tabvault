import { z } from 'zod';

export const PlatformTypeSchema = z.enum(['macos', 'windows', 'linux', 'ios', 'android', 'web']);

export const DeviceStatusSchema = z.enum(['online_local', 'online_relay', 'idle', 'offline']);

export const DeviceInfoSchema = z.object({
  deviceId: z.string().min(3).max(64),
  deviceName: z.string().min(1).max(64),
  platform: PlatformTypeSchema,
  browser: z.string().optional(),
  publicKeyBase64: z.string().min(10),
  status: DeviceStatusSchema,
  lastSeen: z.number().int().positive(),
  localIps: z.array(z.string()).optional(),
  batteryLevel: z.number().min(0).max(100).optional(),
});

export type PlatformType = z.infer<typeof PlatformTypeSchema>;
export type DeviceStatus = z.infer<typeof DeviceStatusSchema>;
export type DeviceInfo = z.infer<typeof DeviceInfoSchema>;
