import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { S3RelayService } from '../services/s3-relay.service.js';
import { TransferModel } from '../database/models/transfer.model.js';
import { DatabaseClient } from '../database/mongo.client.js';

const PresignRequestSchema = z.object({
  vaultId: z.string().min(1),
  transferId: z.string().min(1),
  senderDeviceId: z.string().min(1),
  targetDeviceId: z.string().min(1),
  fileSize: z.number().nonnegative(),
});

// In-memory mock storage for local testing when AWS credentials are not set
const localMockStorage = new Map<string, Buffer>();

export class RelayController {
  /**
   * Generates a presigned S3/R2 PUT URL for remote file drops.
   */
  public static async getPresignedUpload(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const parseResult = PresignRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Invalid presign request parameters',
        details: parseResult.error.format(),
      });
    }

    const { vaultId, transferId, senderDeviceId, targetDeviceId, fileSize } = parseResult.data;
    const result = await S3RelayService.createPresignedDrop(vaultId, transferId);

    // Save transfer log to MongoDB with 24-hour expiration TTL
    if (DatabaseClient.connected) {
      try {
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await TransferModel.create({
          transferId,
          vaultId,
          senderDeviceId,
          targetDeviceId,
          fileSize,
          s3Key: result.s3Key,
          route: 's3_relay_fallback',
          status: 'pending',
          expiresAt,
        });
      } catch (err) {
        console.warn('Could not record transfer in MongoDB:', err);
      }
    }

    return reply.send({
      success: true,
      ...result,
    });
  }

  /**
   * Local development mock upload endpoint.
   */
  public static async mockUpload(
    req: FastifyRequest<{ Querystring: { key: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    const { key } = req.query;
    if (!key) return reply.status(400).send({ error: 'Missing key parameter' });

    const buffer = await req.body;
    localMockStorage.set(key, buffer as Buffer);
    return reply.send({ success: true, message: 'Uploaded to mock storage' });
  }

  /**
   * Local development mock download endpoint.
   */
  public static async mockDownload(
    req: FastifyRequest<{ Querystring: { key: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    const { key } = req.query;
    if (!key || !localMockStorage.has(key)) {
      return reply.status(404).send({ error: 'File not found in mock storage' });
    }

    const buffer = localMockStorage.get(key)!;
    reply.header('Content-Type', 'application/octet-stream');
    return reply.send(buffer);
  }
}
