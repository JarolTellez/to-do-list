const winston = require('winston');

const logger = winston.createLogger({
  level: 'error',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
  ],
});

const logError = (message, error) => {
  logger.error(message, { error: error.message, stack: error.stack });
};

module.exports = { logError };