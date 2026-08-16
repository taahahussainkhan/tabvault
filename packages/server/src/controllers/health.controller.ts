import { FastifyRequest, FastifyReply } from 'fastify';
import { DatabaseClient } from '../database/mongo.client.js';

export class HealthController {
  public static async getHealth(_req: FastifyRequest, reply: FastifyReply): Promise<void> {
    return reply.send({
      status: 'ok',
      timestamp: Date.now(),
      uptime: process.uptime(),
      database: DatabaseClient.connected ? 'connected' : 'in-memory-fallback',
      service: 'tabvault-signaling-hub',
    });
  }
}
