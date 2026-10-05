import dotenv from 'dotenv';
import dns from 'node:dns';
import path from 'node:path';
import mongoose from 'mongoose';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dns.setServers(['8.8.8.8', '8.8.4.4']);

export const connectDB = async (): Promise<void> => {
  try {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB_NAME;

    if (!uri || !dbName) {
      throw new Error('MONGODB_URI and MONGODB_DB_NAME are required');
    }

    await mongoose.connect(uri, {
      dbName,
      serverSelectionTimeoutMS: 5_000,
    });

    const host = new URL(uri).host;
    console.info(`✅ MongoDB conectado: ${host}`);
  } catch (error) {
    console.error('❌ Error de conexión a MongoDB:', error);
    process.exit(1);
    throw error;
  }
};

export const connectDatabase = connectDB;

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
};
