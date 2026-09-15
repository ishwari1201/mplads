import dotenv from 'dotenv';

dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'mplads_super_secret_jwt_key_2026',
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  UPLOAD_DIR: process.env.UPLOAD_DIR || '../storage/uploads',
  DOCS_DIR: process.env.DOCS_DIR || '../storage/docs',
};
