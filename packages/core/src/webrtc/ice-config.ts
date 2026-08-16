/**
 * WebRTC ICE Server configuration and candidate classification.
 */

export const DEFAULT_RTC_CONFIGURATION: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
};

export type IceCandidateType = 'host' | 'srflx' | 'prflx' | 'relay';

/**
 * Classifies an ICE candidate string to determine if it's a local LAN host candidate or STUN/relay.
 */
export function getCandidateType(candidateStr: string): IceCandidateType {
  if (candidateStr.includes(' typ host ')) return 'host';
  if (candidateStr.includes(' typ srflx ')) return 'srflx';
  if (candidateStr.includes(' typ prflx ')) return 'prflx';
  if (candidateStr.includes(' typ relay ')) return 'relay';
  return 'host';
}

/**
 * Checks if candidate is on a private RFC1918 IPv4 or local network address.
 */
export function isLocalLanCandidate(candidateStr: string): boolean {
  return (
    candidateStr.includes('192.168.') ||
    candidateStr.includes('10.') ||
    candidateStr.includes('172.16.') ||
    candidateStr.includes('.local')
  );
}
