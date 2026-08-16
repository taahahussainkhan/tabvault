/**
 * Hybrid Route Decision Engine.
 * Attempts direct local WebRTC P2P first, falling back to Cloud Relay if timeout or offline.
 */

import { ActiveRouteType, RouteNegotiationOptions, RouteNegotiationResult } from './route-types.js';

export class RouteDecisionEngine {
  private defaultTimeoutMs: number = 1500;

  constructor(options?: RouteNegotiationOptions) {
    if (options?.webrtcTimeoutMs) {
      this.defaultTimeoutMs = options.webrtcTimeoutMs;
    }
  }

  /**
   * Decides whether to use WebRTC Local P2P or Cloud Relay based on connection probe.
   */
  public async negotiateRoute(
    probeP2P: () => Promise<boolean>,
    options?: RouteNegotiationOptions
  ): Promise<RouteNegotiationResult> {
    const startTime = Date.now();
    const timeoutMs = options?.webrtcTimeoutMs || this.defaultTimeoutMs;

    if (options?.forceRelay) {
      return {
        route: 's3_relay_fallback',
        latencyMs: 0,
        reason: 'Forced cloud relay by user or network policy',
      };
    }

    try {
      // Race the WebRTC P2P probe against a strict timeout
      const p2pSuccess = await Promise.race([
        probeP2P(),
        new Promise<boolean>((resolve) => setTimeout(() => resolve(false), timeoutMs)),
      ]);

      const elapsed = Date.now() - startTime;

      if (p2pSuccess) {
        return {
          route: 'webrtc_lan',
          latencyMs: elapsed,
          reason: `Direct local WebRTC P2P channel established in ${elapsed}ms`,
        };
      } else {
        return {
          route: 's3_relay_fallback',
          latencyMs: elapsed,
          reason: `WebRTC P2P timed out after ${timeoutMs}ms or peer is remote; falling back to Cloud Relay`,
        };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        route: 's3_relay_fallback',
        latencyMs: Date.now() - startTime,
        reason: `P2P probe failed with error: ${message}; fallback engaged`,
      };
    }
  }
}
