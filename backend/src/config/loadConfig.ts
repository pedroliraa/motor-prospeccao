import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const raw = fs.readFileSync(path.resolve('config.json'), 'utf-8');
export const config = JSON.parse(raw);

export const env = {
  brasilIoToken: process.env.BRASIL_IO_TOKEN!,
  anthropicKey:  process.env.ANTHROPIC_API_KEY!,
  googleKey:     process.env.GOOGLE_PLACES_API_KEY ?? '',
  redisUrl:      process.env.REDIS_URL ?? 'redis://localhost:6379',
  databaseUrl:   process.env.DATABASE_URL!,
};