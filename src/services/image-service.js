import sharp from 'sharp';
import { logger } from '../utils/logger.js';

export class ImageService {
  constructor(qualityPresets) {
    this.qualityPresets = qualityPresets;
    logger.info('Image service initialized');
  }

  async processImage(imageBuffer, quality, options = {}) {
    const { crop, rotate } = options;
    const image = sharp(imageBuffer);

    // Rotate first (before crop) - fills corners with black
    if (rotate !== null && rotate !== undefined) {
      logger.debug(`Rotating image by ${rotate} degrees`);
      image.rotate(rotate, { background: { r: 0, g: 0, b: 0 } });
    }

    if (crop) {
      // Need fresh metadata after rotation
      const rotatedBuffer = rotate !== null && rotate !== undefined
        ? await image.toBuffer()
        : imageBuffer;
      const rotatedImage = rotate !== null && rotate !== undefined
        ? sharp(rotatedBuffer)
        : image;

      const metadata = await rotatedImage.metadata();
      if (!metadata.width || !metadata.height) {
        throw new Error('Invalid image');
      }

      const { left, top, width, height } = crop;
      if (left + width > metadata.width || top + height > metadata.height) {
        throw new Error('Invalid crop parameter: out of bounds');
      }

      rotatedImage.extract({ left, top, width, height });

      // High quality with crop/rotate
      if (quality === 'high') {
        logger.debug('Quality: high with transformations');
        return rotatedImage.toBuffer();
      }

      // Continue with resize using the cropped image
      return this._resizeAndCompress(rotatedImage, quality);
    }

    // High quality = return as is (no crop, no rotate)
    if (quality === 'high') {
      if (rotate === null || rotate === undefined) {
        logger.debug('Quality: high (as is, no processing)');
        return imageBuffer;
      }

      logger.debug('Quality: high with rotation only');
      return image.toBuffer();
    }

    return this._resizeAndCompress(image, quality);
  }

  async _resizeAndCompress(image, quality) {
    const preset = this.qualityPresets[quality];
    if (!preset) {
      throw new Error(`Invalid quality preset: ${quality}`);
    }

    try {
      logger.debug(`Processing image with quality: ${quality} (${preset.maxWidth}x${preset.maxHeight}, q:${preset.quality})`);

      const processed = await image
        .resize(preset.maxWidth, preset.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({
          quality: preset.quality,
          progressive: true,
          mozjpeg: true
        })
        .toBuffer();

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
