import mongoose from 'mongoose';
import { env } from '../config/env.config.js';

export class DatabaseClient {
  private static isConnected: boolean = false;

  public static async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      mongoose.set('strictQuery', true);
      await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      this.isConnected = true;
      console.log('📦 Connected successfully to MongoDB Atlas / Local Database.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`⚠️ MongoDB connection warning: ${message}. Operating with ephemeral in-memory state fallback.`);
    }

    mongoose.connection.on('disconnected', () => {
      this.isConnected = false;
      console.warn('⚠️ MongoDB disconnected.');
    });

    mongoose.connection.on('reconnected', () => {
      this.isConnected = true;
      console.log('📦 MongoDB reconnected.');
    });
  }

  public static async disconnect(): Promise<void> {
    if (!this.isConnected) return;
    await mongoose.disconnect();
    this.isConnected = false;
    console.log('📦 Disconnected from MongoDB.');
  }

  public static get connected(): boolean {
    return this.isConnected;
  }
}
