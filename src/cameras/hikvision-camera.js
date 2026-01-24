import axios from 'axios';
import { logger } from '../utils/logger.js';

export async function fetchHikvisionSnapshot(config, camera) {
  try {
    const username = camera.username || config.hikvision?.username;
    const password = camera.password || config.hikvision?.password;
    const channel = camera.channel || 101;

    if (!username || !password) {
      throw new Error('Hikvision credentials not configured');
    }

    const url = `http://${camera.host}/ISAPI/Streaming/channels/${channel}/picture`;

    logger.debug(`Fetching Hikvision snapshot from ${camera.host}`);

    const response = await axios.get(url, {
      auth: {
        username,
        password
      },
      responseType: 'arraybuffer',
      timeout: 10000
    });

    logger.debug(`Hikvision snapshot fetched: ${response.data.length} bytes`);
    return response.data;
  } catch (error) {
    logger.error(`Failed to fetch Hikvision snapshot for camera ${camera.id}:`, error.message);
    throw new Error(`Camera unavailable: ${error.message}`);
  }
}
