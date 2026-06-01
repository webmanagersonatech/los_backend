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
import mettingRoutes from './modules/meeting/routes';
import teamtypeRoutes from './modules/team-types/routes'


import { logger } from './middlewares/logger';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';


dotenv.config();

const app = express();

connectDB();

app.use(cors({
    origin: ['http://localhost:3000', 'http://160.187.54.80:3003',], // frontend URLs
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

app.use('/api/meeting', mettingRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/work', workRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/team-types', teamtypeRoutes);
app.use('/api/otp', otpRoutes);


app.get("/", (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>API Status | Los API</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            }

            body {
                min-height: 100vh;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
                position: relative;
                overflow-x: hidden;
            }

            /* Animated background shapes */
            body::before {
                content: '';
                position: absolute;
                width: 300px;
                height: 300px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 50%;
                top: -150px;
                right: -150px;
                animation: float 20s infinite;
            }

            body::after {
                content: '';
                position: absolute;
                width: 400px;
                height: 400px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 50%;
                bottom: -200px;
                left: -200px;
                animation: float 25s infinite reverse;
            }

            @keyframes float {
                0%, 100% { transform: translate(0, 0); }
                50% { transform: translate(30px, 30px); }
            }

            /* Main card */
            .card {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border-radius: 32px;
                padding: 50px 40px;
                text-align: center;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                max-width: 500px;
                width: 100%;
                position: relative;
                z-index: 1;
                animation: slideUp 0.6s ease-out;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            /* Status indicator */
            .status-container {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 12px;
                margin-bottom: 25px;
            }

            .status-dot {
                width: 20px;
                height: 20px;
                background: #22c55e;
                border-radius: 50%;
                animation: pulse 2s infinite;
                box-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
            }

            @keyframes pulse {
                0%, 100% {
                    transform: scale(1);
                    opacity: 1;
                }
                50% {
                    transform: scale(1.3);
                    opacity: 0.7;
                }
            }

            .status-text {
                font-size: 14px;
                font-weight: 600;
                color: #22c55e;
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            /* Icon/Logo */
            .logo {
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 25px;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
            }

            .logo svg {
                width: 45px;
                height: 45px;
                color: white;
            }

            h1 {
                font-size: 32px;
                font-weight: 700;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                margin-bottom: 12px;
            }

            .subtitle {
                color: #64748b;
                font-size: 16px;
                margin-bottom: 30px;
                line-height: 1.5;
            }

            /* Stats grid */
            .stats {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin-bottom: 30px;
            }

            .stat-card {
                background: #f8fafc;
                padding: 15px;
                border-radius: 16px;
                transition: transform 0.2s, box-shadow 0.2s;
            }

            .stat-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            }

            .stat-label {
                font-size: 12px;
                color: #64748b;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 8px;
            }

            .stat-value {
                font-size: 24px;
                font-weight: 700;
                color: #1e293b;
            }

            .stat-unit {
                font-size: 12px;
                color: #94a3b8;
                font-weight: 400;
            }

            /* Badge */
            .badge {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 10px 24px;
                border-radius: 50px;
                font-weight: 600;
                font-size: 14px;
                margin-top: 10px;
                box-shadow: 0 4px 14px rgba(102, 126, 234, 0.4);
                transition: transform 0.2s, box-shadow 0.2s;
            }

            .badge:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
            }

            /* Footer */
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
                font-size: 12px;
                color: #94a3b8;
            }

            .footer a {
                color: #667eea;
                text-decoration: none;
            }

            .footer a:hover {
                text-decoration: underline;
            }

            /* Responsive */
            @media (max-width: 480px) {
                .card {
                    padding: 35px 25px;
                }
                
                h1 {
                    font-size: 26px;
                }
                
                .stats {
                    gap: 10px;
                }
                
                .stat-value {
                    font-size: 20px;
                }
            }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="status-container">
                <div class="status-dot"></div>
                <span class="status-text">Operational</span>
            </div>

            <div class="logo">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>

            <h1>Los API</h1>
            <p class="subtitle">Your Express server is running successfully.<br>Everything is ready to serve requests.</p>

            <div class="stats">
                <div class="stat-card">
                    <div class="stat-label">Status</div>
                    <div class="stat-value">200 <span class="stat-unit">OK</span></div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Uptime</div>
                    <div class="stat-value" id="uptime">0<span class="stat-unit">s</span></div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Environment</div>
                    <div class="stat-value">${process.env.NODE_ENV || 'development'}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Timestamp</div>
                    <div class="stat-value" id="timestamp">--:--:--</div>
                </div>
            </div>

            <div class="badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 8v4l3 3"/>
                </svg>
                ONLINE
            </div>

            <div class="footer">
                <p>Powered by Express.js | <a href="#">API Documentation</a></p>
                <p style="margin-top: 8px;">© ${new Date().getFullYear()} Los API - All rights reserved</p>
            </div>
        </div>

        <script>
            // Update uptime
            const startTime = Date.now();
            function updateUptime() {
                const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
                const hours = Math.floor(uptimeSeconds / 3600);
                const minutes = Math.floor((uptimeSeconds % 3600) / 60);
                const seconds = uptimeSeconds % 60;
                
                let uptimeString = '';
                if (hours > 0) uptimeString += hours + 'h ';
                if (minutes > 0 || hours > 0) uptimeString += minutes + 'm ';
                uptimeString += seconds + 's';
                
                document.getElementById('uptime').innerHTML = uptimeString;
            }
            
            // Update timestamp
            function updateTimestamp() {
                const now = new Date();
                const timeString = now.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit' 
                });
                document.getElementById('timestamp').innerHTML = timeString;
            }
            
            // Update every second
            setInterval(() => {
                updateUptime();
                updateTimestamp();
            }, 1000);
            
            // Initial updates
            updateUptime();
            updateTimestamp();
        </script>
    </body>
    </html>
    `);
});

export default app;
