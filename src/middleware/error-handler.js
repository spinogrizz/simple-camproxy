import { logger } from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
  logger.error('Error:', err.message);
  logger.debug('Error stack:', err.stack);

  // Determine error type and corresponding HTTP code
  if (err.message.includes('unavailable')) {
    return res.status(503).json({
      error: 'Camera unavailable',
      message: err.message
    });
  }

  if (err.message.includes('not found') || err.message.includes('Camera not found')) {
    return res.status(404).json({
      error: 'Not found',
      message: err.message
    });
  }

  if (err.message.includes('Invalid quality') || err.message.includes('Invalid')) {
    return res.status(400).json({
      error: 'Bad request',
      message: err.message
    });
  }

  if (err.message.includes('Unauthorized') || err.message.includes('No access')) {
    return res.status(403).json({
      error: 'Forbidden',
      message: err.message
    });
  }

  // Generic server error
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production'
      ? 'Something went wrong'
      : err.message
  });
}
