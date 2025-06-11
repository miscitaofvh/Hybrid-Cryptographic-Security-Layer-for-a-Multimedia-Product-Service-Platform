import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';  
import trackRoutes from './routes/trackRoutes.js';
import keyExchangeRoutes from './routes/keyExchangeRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

const allowedOrigins = [
  "http://localhost",
  "http://localhost:80",
  "http://client",
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/key-exchange', keyExchangeRoutes);
app.use("/static", express.static(path.join(__dirname, "static")));

export default app;

