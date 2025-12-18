/**
 * Node modules
 */
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';

/**
 * Custom modules
 */
import config from '@/config';
import limiter from '@/lib/express_rate_limit';
import { connectToDatabase, disconnectFromDatabase } from '@/lib/mongooes';
import { logger } from './lib/winston';

/**
 * Router
 */
import v1Router from '@/routes/v1';

/**
 * Types
 */
import type { CorsOptions } from 'cors';

const app = express();

/**
 * Allow all requests if:
 * - The environment is development
 * - OR the request has no origin (like curl or same-origin requests)
 * - OR the origin is included in the whitelist
 */
const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (
      config.NODE_ENV === 'development' ||
      !origin ||
      config.WHITELIST_ORIGINS.includes(origin)
    ) {
      callback(null, true);
    } else {
      callback(
        new Error(`CORS error: ${origin} is not allowed by CORS`),
        false,
      );
      logger.warn(`CORS error: ${origin} is not allowed by CORS`);
    }
  },
};

const port = config.PORT;

// Apply CORS middleware
app.use(cors(corsOptions));

// Enable JSON request body parsing
app.use(express.json());

// Enable URL-encoded request body parsing with extended mode
app.use(express.urlencoded({ extended: true }));

// Parse cookies attached to the client request object
app.use(cookieParser());

/**
 * Enable gzip/deflate compression for responses
 * This reduces response size and improves performance
 * Only compress responses larger than 1KB
 */
app.use(
  compression({
    threshold: 1024, // Only compress response larger than 1KB
  }),
);

/**
 * Secure the app by setting various HTTP headers
 * Helps protect against well-known web vulnerabilitiess
 */
app.use(helmet());

/**
 * Apply rate limiting middleware
 * Limits the number of requests from the same client/IP
 * Helps protect against brute-force attacks or DDoS
 */
app.use(limiter);

(async () => {
  try {
    await connectToDatabase(); // Connect to MongoDB

    app.use('/api/v1', v1Router);

    app.listen(port, () => {
      logger.info(`Server running: http://localhost:${port}`);
    });
  } catch (err) {
    logger.error('Failed to start the server', err);

    if (config.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
})();

// Gracefully handle server shutdown (close DB connection and exit)
const handleServerShutdown = async () => {
  try {
    await disconnectFromDatabase(); // Disconnect from MongoDB

    logger.info('Server SHUTDOWN');
    process.exit(0);
  } catch (err) {
    logger.error('Error during server shutdown', err);
  }
};

process.on('SIGTERM', handleServerShutdown);
process.on('SIGINT', handleServerShutdown);
