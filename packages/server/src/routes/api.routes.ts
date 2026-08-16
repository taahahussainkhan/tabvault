import { FastifyInstance } from 'fastify';
import { HealthController } from '../controllers/health.controller.js';
import { PairingController } from '../controllers/pairing.controller.js';
import { RelayController } from '../controllers/relay.controller.js';
import { WebSocketHandler } from '../ws/ws.handler.js';

export async function registerApiRoutes(fastify: FastifyInstance): Promise<void> {
  // Healthcheck
  fastify.get('/health', HealthController.getHealth);
  fastify.get('/api/health', HealthController.getHealth);

  // Device Pairing
  fastify.post('/api/pair/sync-code', PairingController.createSyncCode);
  fastify.get('/api/pair/sync-code/:code', PairingController.resolveSyncCode);

  // AWS S3 / Cloudflare R2 Presigned Relay Endpoints
  fastify.post('/api/relay/presign', RelayController.getPresignedUpload);
  fastify.get('/api/relay/download', RelayController.getPresignedDownload);

  // Real-time WebSocket Signaling Hub
  fastify.get('/ws', { websocket: true }, (connection: any, req) => {
    const wsSocket = connection.socket || connection;
    WebSocketHandler.handleConnection(wsSocket, req);
  });
}
