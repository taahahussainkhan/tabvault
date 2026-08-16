import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.config.js';
import { SERVER_CONSTANTS } from '../config/constants.js';

export interface PresignedUploadResult {
  uploadUrl: string;
  downloadUrl: string;
  s3Key: string;
  expiresInSeconds: number;
}

export class S3RelayService {
  private static s3Client?: S3Client;

  private static getClient(): S3Client | undefined {
    if (!this.s3Client && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY) {
      this.s3Client = new S3Client({
        region: env.AWS_REGION,
        endpoint: env.S3_ENDPOINT || undefined,
        credentials: {
          accessKeyId: env.S3_ACCESS_KEY_ID,
          secretAccessKey: env.S3_SECRET_ACCESS_KEY,
        },
      });
    }
    return this.s3Client;
  }

  /**
   * Generates a presigned S3 PUT URL for client-side encrypted upload and a GET URL for download.
   */
  public static async createPresignedDrop(
    vaultId: string,
    transferId: string
  ): Promise<PresignedUploadResult> {
    const s3Key = `vaults/${vaultId}/transfers/${transferId}.enc`;
    const client = this.getClient();

    if (client) {
      const putCommand = new PutObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: s3Key,
        ContentType: 'application/octet-stream',
      });

      const getCommand = new GetObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: s3Key,
      });

      const uploadUrl = await getSignedUrl(client, putCommand, {
        expiresIn: SERVER_CONSTANTS.S3_PRESIGNED_PUT_EXPIRES_SECONDS,
      });

      const downloadUrl = await getSignedUrl(client, getCommand, {
        expiresIn: SERVER_CONSTANTS.S3_PRESIGNED_GET_EXPIRES_SECONDS,
      });

      return {
        uploadUrl,
        downloadUrl,
        s3Key,
        expiresInSeconds: SERVER_CONSTANTS.S3_PRESIGNED_PUT_EXPIRES_SECONDS,
      };
    } else {
      // Local development mock URL fallback
      const mockBase = `http://${env.HOST === '0.0.0.0' ? 'localhost' : env.HOST}:${env.PORT}/api/relay/mock-storage`;
      return {
        uploadUrl: `${mockBase}/upload?key=${encodeURIComponent(s3Key)}`,
        downloadUrl: `${mockBase}/download?key=${encodeURIComponent(s3Key)}`,
        s3Key,
        expiresInSeconds: SERVER_CONSTANTS.S3_PRESIGNED_PUT_EXPIRES_SECONDS,
      };
    }
  }

  /**
   * Generates a fresh presigned GET download URL for an existing S3 object key.
   */
  public static async getPresignedDownloadUrl(s3Key: string): Promise<string> {
    const client = this.getClient();
    if (client) {
      const getCommand = new GetObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: s3Key,
      });
      return await getSignedUrl(client, getCommand, {
        expiresIn: SERVER_CONSTANTS.S3_PRESIGNED_GET_EXPIRES_SECONDS,
      });
    } else {
      return `http://${env.HOST === '0.0.0.0' ? 'localhost' : env.HOST}:${env.PORT}/api/relay/mock-storage/download?key=${encodeURIComponent(s3Key)}`;
    }
  }
}
