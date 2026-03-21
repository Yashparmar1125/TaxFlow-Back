import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import env from './config/env.config';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

const app: Application = express();

// Set security HTTP headers
app.use(helmet());

// Parse json request body
app.use(express.json());

// Parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors());

// HTTP request logger middleware for development
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// v1 API routes
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
