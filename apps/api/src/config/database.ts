require('dotenv').config({
  path: require('node:path').resolve(__dirname, '../../../../.env'),
});
require('node:dns').setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose') as typeof import('mongoose');

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
