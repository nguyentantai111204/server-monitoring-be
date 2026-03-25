import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';

@Injectable()
export class TelegramService {
    private readonly logger = new Logger(TelegramService.name);
    private readonly botToken: string;
    private readonly chatId: string;

    constructor(private readonly configService: ConfigService) {
        this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN') || '';
        this.chatId = this.configService.get<string>('TELEGRAM_CHAT_ID') || '';
    }

    async sendMessage(message: string): Promise<void> {
        if (!this.botToken || !this.chatId) {
            this.logger.warn('Telegram not configured. Skipping notification.');
            return;
        }

        const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
        const body = JSON.stringify({
            chat_id: this.chatId,
            text: message,
            parse_mode: 'HTML',
        });

        return new Promise((resolve, reject) => {
            const req = https.request(
                url,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(body),
                    },
                },
                (res) => {
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        resolve();
                    } else {
                        reject(new Error(`Telegram API error: ${res.statusCode}`));
                    }
                },
            );

            req.on('error', (err) => reject(err));
            req.write(body);
            req.end();
        });
    }

    async sendAlert(serverName: string, metricType: string, value: number, threshold: number): Promise<void> {
        const message =
            `🚨 <b>Alert!</b>\n` +
            `Server: <b>${serverName}</b>\n` +
            `Metric: ${metricType}\n` +
            `Value: ${value.toFixed(2)}%\n` +
            `Threshold: ${threshold}%`;

        await this.sendMessage(message);
    }
}
