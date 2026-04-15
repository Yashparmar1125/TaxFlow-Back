import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import env from './config/env.config';
import routes from './routes';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.config';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { helmetConfig } from './config/helmet.config';
import { authLimiter, globalLimiter } from './config/rateLimit.config';
import { corsConfig } from './config/cors.config';

const app: Application = express();

// Trust proxy for Nginx
app.set('trust proxy', 1);

// Parse cookies
app.use(cookieParser());

// Set security HTTP headers
app.use(helmetConfig);

// Apply global rate limiting
app.use(globalLimiter);

// Parse json request body
app.use(express.json());

// Parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors(corsConfig));

// HTTP request logger middleware (Verbosity enabled for all environments)
app.use(morgan('dev'));

// Swagger Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// v1 API routes (Apply authLimiter exclusively to auth routes)
app.use('/api/v1/auth', authLimiter);
app.use('/api/v1', routes);

// Base route for health check
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Welcome to the API', status: 'OK' });
});

// Send 404 error for any unknown API request
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
