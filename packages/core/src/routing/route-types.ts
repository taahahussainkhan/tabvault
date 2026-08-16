export type ActiveRouteType = 'webrtc_lan' | 's3_relay_fallback';

export interface RouteNegotiationOptions {
  webrtcTimeoutMs?: number; // Default 1500ms
  forceRelay?: boolean;
}

export interface RouteNegotiationResult {
  route: ActiveRouteType;
  latencyMs: number;
  reason: string;
}
