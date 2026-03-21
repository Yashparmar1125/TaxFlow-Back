import env from './env.config';

export const corsConfig = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // If ALLOWED_ORIGINS is set to *, allow all. 
    // Otherwise, check if origin is in the allowed list or if it's undefined (e.g. server-to-server or Postman).
    if (env.ALLOWED_ORIGINS === '*') {
      return callback(null, true);
    }
    
    const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
