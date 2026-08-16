import mongoose, { Schema, Document } from 'mongoose';

export interface IVault extends Document {
  vaultId: string;
  vaultName: string;
  createdAt: Date;
  updatedAt: Date;
}

const VaultSchema = new Schema<IVault>(
  {
    vaultId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    vaultName: {
      type: String,
      required: true,
      default: 'My Vault',
    },
  },
  {
    timestamps: true,
  }
);

export const VaultModel = mongoose.models.Vault || mongoose.model<IVault>('Vault', VaultSchema);
