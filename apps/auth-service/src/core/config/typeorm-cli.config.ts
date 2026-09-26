import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.development from the root of the monorepo
dotenv.config({ path: path.resolve(__dirname, '../../../../../.env.development') });

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [path.resolve(__dirname, '../../auth/entities/**/*.entity{.ts,.js}')],
  migrations: [path.resolve(__dirname, '../../migrations/*{.ts,.js}')],
  synchronize: false,
});
