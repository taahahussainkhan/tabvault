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

export class RelayController {
  /**
   * Generates real presigned S3/R2 PUT URL for remote encrypted file drops.
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
   * Generates a presigned download URL for a recipient device.
   */
  public static async getPresignedDownload(
    req: FastifyRequest<{ Querystring: { s3Key: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    const { s3Key } = req.query;
    if (!s3Key) {
      return reply.status(400).send({ error: 'Missing s3Key parameter' });
    }

    try {
      const downloadUrl = await S3RelayService.getPresignedDownloadUrl(s3Key);
      return reply.send({ success: true, downloadUrl });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return reply.status(500).send({ error: 'Could not generate download URL', details: message });
    }
  }
}
