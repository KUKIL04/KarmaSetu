import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { initializeDatabase } from './db/index.js';
import { initializeRedis } from './db/redis.js';
import { errorHandler } from './middlewares/error.js';

// Route Imports
import otpRouter from './routes/otp.js';
import tenantRouter from './routes/tenant.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import userRouter from './routes/user.js';

dotenv.config();

const app = express();
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

const PORT = process.env.PORT || 3333;

app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));
app.use('/api/v1/otp', otpRouter);
app.use('/api/v1/tenant', tenantRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/user', userRouter);
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-backend' });
});

app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(`🚀 Production-grade Auth Backend listening on port ${PORT}`);
  await initializeDatabase();
  await initializeRedis();
});