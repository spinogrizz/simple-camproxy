import axios from 'axios';
import { BaseCamera } from '../base.js';
import { logger } from '../../utils/logger.js';

export default class IptronicCamera extends BaseCamera {
  static validate(camera, config) {
    BaseCamera.validate(camera, config, 'iptronic');
  }

  async fetchSnapshot() {
    try {
      const { username, password } = this.getCredentials('iptronic');

      if (!username || !password) {
        throw new Error('IPtronic credentials not configured');
      }

      const url = `http://${username}:${password}@${this.camera.host}/snap.jpg`;

      logger.debug(`Fetching IPtronic snapshot from ${this.camera.host}`);

      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 10000
      });

      logger.debug(`IPtronic snapshot fetched: ${response.data.length} bytes`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch IPtronic snapshot for camera ${this.camera.id}:`, error.message);
      throw new Error(`Camera unavailable: ${error.message}`);
    }
  }
}
