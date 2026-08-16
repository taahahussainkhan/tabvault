/**
 * Wire protocol message types for WebSocket signaling and WebRTC DataChannels.
 */

import { DeviceInfo } from '../protocol/schemas/device.schema.js';

export * from '../protocol/schemas/signaling.schema.js';
export * from '../protocol/schemas/clipboard.schema.js';

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
