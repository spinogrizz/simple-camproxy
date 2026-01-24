import axios from 'axios';
import { logger } from '../utils/logger.js';

export async function fetchIptronicSnapshot(config, camera) {
  try {
    const username = camera.username || config.iptronic?.username;
    const password = camera.password || config.iptronic?.password;

    if (!username || !password) {
      throw new Error('IPtronic credentials not configured');
    }

    const url = `http://${username}:${password}@${camera.host}/snap.jpg`;

    logger.debug(`Fetching IPtronic snapshot from ${camera.host}`);

    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000
    });

    logger.debug(`IPtronic snapshot fetched: ${response.data.length} bytes`);
    return response.data;
  } catch (error) {
    logger.error(`Failed to fetch IPtronic snapshot for camera ${camera.id}:`, error.message);
    throw new Error(`Camera unavailable: ${error.message}`);
  }
}
