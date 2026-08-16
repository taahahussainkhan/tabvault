import { z } from 'zod';

export const SignalingMessageTypeSchema = z.enum([
  'presence:join',
  'presence:leave',
  'presence:state',
  'pair:request',
  'pair:accept',
  'pair:reject',
  'webrtc:offer',
  'webrtc:answer',
  'webrtc:ice-candidate',
  'relay:clipboard',
  'relay:file-notify',
  'ping',
  'pong',
]);

export const SignalingMessageSchema = z.object({
  type: SignalingMessageTypeSchema,
  vaultId: z.string().min(1),
  senderDeviceId: z.string().min(1),
  targetDeviceId: z.string().optional(),
  payload: z.unknown(),
  timestamp: z.number().int().positive(),
});

export type SignalingMessageType = z.infer<typeof SignalingMessageTypeSchema>;
export type SignalingMessage<T = unknown> = Omit<z.infer<typeof SignalingMessageSchema>, 'payload'> & {
  payload: T;
};
