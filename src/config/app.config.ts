import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
    port: parseInt(process.env.PORT || '3000', 10),
    globalPrefix: process.env.API_PREFIX || 'api',
    url: process.env.BACKEND_URL || 'http://localhost:3000',
    nodeEnv: process.env.NODE_ENV || 'development',
}));
