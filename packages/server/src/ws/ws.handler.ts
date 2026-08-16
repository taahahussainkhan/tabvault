import { WebSocket } from 'ws';
import { FastifyRequest } from 'fastify';
import { SignalingMessageSchema, DeviceInfoSchema } from '@tabvault/core';
import { SignalingService } from '../services/signaling.service.js';
import { ExtendedWebSocket } from './ws.types.js';
import { SERVER_CONSTANTS } from '../config/constants.js';

export class WebSocketHandler {
  /**
   * Initializes WebSocket connection and message routing.
   */
  public static handleConnection(socket: WebSocket, req: FastifyRequest): void {
    const extSocket = socket as ExtendedWebSocket;
    extSocket.isAlive = true;

    extSocket.on('pong', () => {
      extSocket.isAlive = true;
    });

    extSocket.on('message', (rawBuffer: Buffer) => {
      try {
        const text = rawBuffer.toString('utf-8');
        const json = JSON.parse(text);
        const parseResult = SignalingMessageSchema.safeParse(json);

        if (!parseResult.success) {
          console.warn('Malformed signaling frame received:', parseResult.error.format());
          return;
        }

        const message = parseResult.data;

        // Handle Presence Join
        if (message.type === 'presence:join') {
          const deviceParse = DeviceInfoSchema.safeParse(message.payload);
          if (deviceParse.success) {
            extSocket.vaultId = message.vaultId;
            extSocket.deviceId = message.senderDeviceId;

            SignalingService.registerPeer({
              ws: extSocket,
              vaultId: message.vaultId,
              deviceId: message.senderDeviceId,
              deviceInfo: deviceParse.data,
              isAlive: true,
              connectedAt: Date.now(),
            });
            console.log(`🔌 [Presence] Device "${deviceParse.data.deviceName}" (${message.senderDeviceId}) joined Vault "${message.vaultId}"`);
          }
          return;
        }

        // Handle Heartbeat Ping
        if (message.type === 'ping') {
          if (extSocket.readyState === WebSocket.OPEN) {
            extSocket.send(JSON.stringify({
              type: 'pong',
              vaultId: message.vaultId,
              senderDeviceId: 'server',
              timestamp: Date.now(),
              payload: {},
            }));
          }
          return;
        }

        // Route WebRTC SDP/ICE candidates & Instant Clipboard broadcasts
        SignalingService.relayMessage(
          message.vaultId,
          message.senderDeviceId,
          message.targetDeviceId,
          text
        );
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });

    extSocket.on('close', () => {
      if (extSocket.vaultId && extSocket.deviceId) {
        console.log(`🔌 [Presence] Device "${extSocket.deviceId}" disconnected from Vault "${extSocket.vaultId}"`);
        SignalingService.unregisterPeer(extSocket.vaultId, extSocket.deviceId);
      }
    });

    extSocket.on('error', (err) => {
      console.warn(`WebSocket error for device "${extSocket.deviceId}":`, err.message);
    });
  }

  /**
   * Starts periodic heartbeat to prune dead sockets.
   */
  public static startHeartbeat(intervalMs: number = SERVER_CONSTANTS.DEFAULT_WS_PING_INTERVAL_MS): NodeJS.Timeout {
    return setInterval(() => {
      // In production, loop over connected sockets and send ping
    }, intervalMs);
  }
}
