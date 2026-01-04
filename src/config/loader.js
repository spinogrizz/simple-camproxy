import fs from 'fs/promises';
import yaml from 'js-yaml';
import path from 'path';
import { validateCamerasConfig, validateAccessConfig } from './schemas.js';
import { logger } from '../utils/logger.js';

export async function loadConfig() {
  const configPath = process.env.CONFIG_PATH || './config';

  try {
    logger.info(`Loading configuration from ${configPath}`);

    // Load cameras.yaml
    const camerasYaml = await fs.readFile(
      path.join(configPath, 'cameras.yaml'),
      'utf8'
    );
    const cameras = yaml.load(camerasYaml);

    // Load access.yaml
    const accessYaml = await fs.readFile(
      path.join(configPath, 'access.yaml'),
      'utf8'
    );
    const access = yaml.load(accessYaml);

    // Validation
    validateCamerasConfig(cameras);
    validateAccessConfig(access);

    logger.info(`Configuration loaded successfully: ${cameras.cameras.length} cameras, ${access.users.length} users`);

    return { cameras, access };
  } catch (error) {
    logger.error('Failed to load configuration:', error.message);
    process.exit(1);
  }
}
