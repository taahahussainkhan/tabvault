import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { env } from './config/env.config.js';
import { DatabaseClient } from './database/mongo.client.js';
import { registerApiRoutes } from './routes/api.routes.js';

async function bootstrap() {
  const fastify = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
    bodyLimit: 50 * 1024 * 1024, // 50MB body limit
  });

  // Enable CORS
  await fastify.register(cors, {
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Enable WebSockets
  await fastify.register(websocket, {
    options: {
      maxPayload: 10 * 1024 * 1024, // 10MB per WS frame
    },
  });

  // Connect to Database
  await DatabaseClient.connect();

  // Register API and WebSocket routes
  await fastify.register(registerApiRoutes);

  // Graceful Shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) {
    process.on(signal, async () => {
      console.log(`\n🛑 Received ${signal}. Closing TabVault server...`);
      await fastify.close();
      await DatabaseClient.disconnect();
      process.exit(0);
    });
  }

  // Start HTTP & WS Server
  try {
    const address = await fastify.listen({
      port: env.PORT,
      host: env.HOST,
    });
    console.log(`
  ⚡ TabVault Signaling & Relay Hub running at:
  👉 REST API: ${address}
  👉 WebSockets: ${address.replace(/^http/, 'ws')}/ws
  👉 Healthcheck: ${address}/health
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

bootstrap();
