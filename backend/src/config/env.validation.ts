import { DEFAULT_PORT } from '../common/constants/app.constants.js';

const ALLOWED_ENVIRONMENTS = new Set(['development', 'test', 'production']);

export interface EnvironmentVariables {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  [key: string]: unknown;
}

export function validateEnvironment(
  configuration: Record<string, unknown>,
): EnvironmentVariables {
  const nodeEnvironment = String(configuration['NODE_ENV'] ?? 'development');
  if (!ALLOWED_ENVIRONMENTS.has(nodeEnvironment)) {
    throw new Error('NODE_ENV must be development, test or production.');
  }

  const port = Number(configuration['PORT'] ?? DEFAULT_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  const databaseUrl = configuration['DATABASE_URL'];
  if (typeof databaseUrl !== 'string' || databaseUrl.trim() === '') {
    throw new Error('DATABASE_URL is required.');
  }

  let parsedDatabaseUrl: URL;
  try {
    parsedDatabaseUrl = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL URL.');
  }

  if (!['postgresql:', 'postgres:'].includes(parsedDatabaseUrl.protocol)) {
    throw new Error('DATABASE_URL must use the postgresql protocol.');
  }

  return {
    ...configuration,
    NODE_ENV: nodeEnvironment,
    PORT: port,
    DATABASE_URL: databaseUrl,
  };
}
