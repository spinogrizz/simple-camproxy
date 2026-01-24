import axios from 'axios';
import { BaseCamera } from '../base.js';
import { logger } from '../../utils/logger.js';

export default class HikvisionCamera extends BaseCamera {
  static validate(camera, config) {
    BaseCamera.validate(camera, config, 'hikvision');
  }

  async fetchSnapshot() {
    try {
      const { username, password } = this.getCredentials('hikvision');

      if (!username || !password) {
        throw new Error('Hikvision credentials not configured');
      }

      const channel = this.camera.channel || 101;
      const url = `http://${this.camera.host}/ISAPI/Streaming/channels/${channel}/picture`;

      logger.debug(`Fetching Hikvision snapshot from ${this.camera.host}`);

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
      logger.error(`Failed to fetch Hikvision snapshot for camera ${this.camera.id}:`, error.message);
      throw new Error(`Camera unavailable: ${error.message}`);
    }
  }
}
