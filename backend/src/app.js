import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env.js';
import ApiError from './utils/ApiError.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';
import apiRouter from './routes/index.js';

const app = express();

const allowedOrigins = env.clientUrl.split(',').map((origin) => origin.trim());

app.disable('x-powered-by');
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new ApiError(403, 'Origin not allowed by CORS'));
    },
    credentials: true
  })
);
app.use(helmet());
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Smart Classroom API is running',
    data: {
      environment: env.nodeEnv
    }
  });
});

app.use(apiRouter);
app.use(notFound);
app.use(errorHandler);

export default app;
