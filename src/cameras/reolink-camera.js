import axios from 'axios';
import { logger } from '../utils/logger.js';

export async function fetchReolinkSnapshot(config, camera) {
  try {
    // Используем локальные credentials или глобальные
    const username = camera.username || config.reolink?.username;
    const password = camera.password || config.reolink?.password;

    if (!username || !password) {
      throw new Error('Reolink credentials not configured');
    }

    const url = `http://${camera.host}/cgi-bin/api.cgi?cmd=Snap&channel=0&user=${username}&password=${password}`;

    logger.debug(`Fetching Reolink snapshot from ${camera.host}`);

    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000
    });

    logger.debug(`Reolink snapshot fetched: ${response.data.length} bytes`);
    return response.data;
  } catch (error) {
    logger.error(`Failed to fetch Reolink snapshot for camera ${camera.id}:`, error.message);
    throw new Error(`Camera unavailable: ${error.message}`);
  }
}
