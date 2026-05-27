import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db';
import authRoutes from './modules/auth/auth.routes';;
import path from 'path';
import TeamRoutes from './modules/teams/routes'
import temmemberRoutes from './modules/team-members/routes'
import settingsRoutes from './modules/settings/routes';
import dashboardRoutes from './modules/dashboard/routes';
import workRoutes from './modules/work/routes';
import otpRoutes from './modules/otp/routes';


import { logger } from './middlewares/logger';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';


dotenv.config();

const app = express();

connectDB();

app.use(cors({
    origin: ['http://localhost:3000',  'http://160.187.54.80:3003', ], // frontend URLs
    credentials: true,
}));


app.use(express.json({ limit: "100mb" }));
app.use(express.json());
app.use(cookieParser());
app.use(logger);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);

app.use('/api/team-member', temmemberRoutes);
app.use('/api/teams', TeamRoutes);

app.use('/api/settings', settingsRoutes);
app.use('/api/work', workRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/otp', otpRoutes);


app.get('/', (req, res) => res.json({ ok: true, message: 'API los is running' }));

export default app;
