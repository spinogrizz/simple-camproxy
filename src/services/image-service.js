import sharp from 'sharp';
import { logger } from '../utils/logger.js';

export class ImageService {
  constructor(qualityPresets) {
    this.qualityPresets = qualityPresets;
    logger.info('Image service initialized');
  }

  async processImage(imageBuffer, quality) {
    // High quality = возвращаем как есть
    if (quality === 'high') {
      logger.debug('Quality: high (as is, no processing)');
      return imageBuffer;
    }

    // Получаем пресет для low/medium
    const preset = this.qualityPresets[quality];
    if (!preset) {
      throw new Error(`Invalid quality preset: ${quality}`);
    }

    try {
      logger.debug(`Processing image with quality: ${quality} (${preset.maxWidth}x${preset.maxHeight}, q:${preset.quality})`);

      const processed = await sharp(imageBuffer)
        .resize(preset.maxWidth, preset.maxHeight, {
          fit: 'inside',  // Сохраняем пропорции
          withoutEnlargement: true  // Не увеличиваем меньшие изображения
        })
        .jpeg({
          quality: preset.quality,
          progressive: true,
          mozjpeg: true  // Лучшее сжатие
        })
        .toBuffer();

      logger.debug(`Image processed: ${imageBuffer.length} -> ${processed.length} bytes (${Math.round((1 - processed.length / imageBuffer.length) * 100)}% reduction)`);

      return processed;
    } catch (error) {
      logger.error('Failed to process image:', error.message);
      throw new Error('Image processing failed');
    }
  }

  async getMetadata(imageBuffer) {
    try {
      return await sharp(imageBuffer).metadata();
    } catch (error) {
      logger.error('Failed to get image metadata:', error.message);
      throw new Error('Invalid image');
    }
  }
}
