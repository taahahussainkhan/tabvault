export const SERVER_CONSTANTS = {
  DEFAULT_WS_PING_INTERVAL_MS: 30000,
  DEFAULT_WS_PONG_TIMEOUT_MS: 10000,
  S3_PRESIGNED_PUT_EXPIRES_SECONDS: 900,  // 15 minutes for upload
  S3_PRESIGNED_GET_EXPIRES_SECONDS: 3600, // 1 hour for download
  RELAY_DROP_TTL_HOURS: 24,               // 24 hours lifecycle auto-deletion
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024 * 1024, // 5 GB limit per drop
};
