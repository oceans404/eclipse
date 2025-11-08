import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const localEnvPath = resolve(__dirname, '../.env');

dotenv.config({ path: localEnvPath });
dotenv.config();

export const REQUIRED_ENV_VARS = [
  'MASTER_KEY',
  'NILLION_API_KEY',
  'NILLION_COLLECTION_ID',
  'GOOGLE_GENERATIVE_AI_API_KEY',
  'RPC_URL',
  'PAYMENT_SERVICE_ADDRESS',
  'BLOB_READ_WRITE_TOKEN',
  'VERIFIED_LIST_CONTRACT_ADDRESS',
  'VERIFIED_LIST_MANAGER_PRIVATE_KEY',
] as const;

type RequiredEnv = (typeof REQUIRED_ENV_VARS)[number];

function requireEnv(name: RequiredEnv): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value;
}

const optionalPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number.isNaN(optionalPort) ? 3001 : optionalPort,
  security: {
    masterKey: requireEnv('MASTER_KEY'),
  },
  nillion: {
    apiKey: requireEnv('NILLION_API_KEY'),
    collectionId: requireEnv('NILLION_COLLECTION_ID'),
  },
  ai: {
    apiKey: requireEnv('GOOGLE_GENERATIVE_AI_API_KEY'),
  },
  blockchain: {
    rpcUrl: requireEnv('RPC_URL'),
    paymentServiceAddress: requireEnv('PAYMENT_SERVICE_ADDRESS'),
  },
  blob: {
    token: requireEnv('BLOB_READ_WRITE_TOKEN'),
  },
  verifiedList: {
    contractAddress: requireEnv('VERIFIED_LIST_CONTRACT_ADDRESS'),
    managerPrivateKey: requireEnv('VERIFIED_LIST_MANAGER_PRIVATE_KEY'),
  },
};

export const isProduction = config.env === 'production';
