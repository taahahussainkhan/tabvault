/**
 * Wire protocol message types for WebSocket signaling and WebRTC DataChannels.
 */

import { DeviceInfo, PairingPayload } from './device.types.js';

export type SignalingMessageType =
  | 'presence:join'
  | 'presence:leave'
  | 'presence:state'
  | 'pair:request'
  | 'pair:accept'
  | 'pair:reject'
  | 'webrtc:offer'
  | 'webrtc:answer'
  | 'webrtc:ice-candidate'
  | 'relay:clipboard'
  | 'relay:file-notify'
  | 'ping'
  | 'pong';

export interface SignalingMessage<T = unknown> {
  type: SignalingMessageType;
  vaultId: string;
  senderDeviceId: string;
  targetDeviceId?: string; // Optional (undefined means broadcast to room)
  payload: T;
  timestamp: number;
}

export interface WebRtcOfferPayload {
  sdp: RTCSessionDescriptionInit;
}

export interface WebRtcAnswerPayload {
  sdp: RTCSessionDescriptionInit;
}

export interface WebRtcIceCandidatePayload {
  candidate: RTCIceCandidateInit;
}

export interface PresenceJoinPayload {
  device: DeviceInfo;
}

export interface PresenceStatePayload {
  devices: DeviceInfo[];
}

export interface ClipboardItemPayload {
  id: string;
  senderDeviceId: string;
  senderDeviceName: string;
  senderPlatform: string;
  contentType: 'text/plain' | 'text/html' | 'text/uri-list';
  encryptedContent: string; // Base64
  iv: string;              // Base64
  timestamp: number;
  previewObfuscated?: string;
}
