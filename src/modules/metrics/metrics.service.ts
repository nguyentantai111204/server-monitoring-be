import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Metric } from './entities/metric.entity';
import { PushMetricDto } from './dto/push-metric.dto';
import { QueryMetricDto } from './dto/query-metric.dto';
import { ServersService } from '../servers/servers.service';
import { ServerStatus } from '../../common/constants/server-status.enum';
import { AlertsService } from '../alerts/alerts.service';
import { TelegramService } from '../../providers/telegram/telegram.service';
import { MetricType } from '../../common/constants/metric-type.enum';
import { Server } from '../servers/entities/server.entity';

@Injectable()
export class MetricsService {
    private readonly logger = new Logger(MetricsService.name);

    constructor(
        @InjectRepository(Metric)
        private readonly metricRepository: Repository<Metric>,
        private readonly serversService: ServersService,
        private readonly alertsService: AlertsService,
        private readonly telegramService: TelegramService,
    ) { }

    async pushMetric(
        agentToken: string,
        pushMetricDto: PushMetricDto,
        ip?: string,
    ): Promise<Metric> {
        const server = await this.serversService.findByAgentToken(agentToken);

        if (!server) {
            throw new UnauthorizedException('Invalid agent token');
        }

        // Priority: 1. Agent reported IP (internal) | 2. Request source IP (public/NAT)
        const detectedIp = pushMetricDto.ipAddress || ip;

        // Auto-detect and update IP if not set or changed
        if (detectedIp && (!server.ipAddress || server.ipAddress !== detectedIp)) {
            this.logger.log(`Auto-detected/Updated IP for server ${server.name}: ${detectedIp}`);
            server.ipAddress = detectedIp;
            // updateStatus will save the new IP and update heartbeat/status
            await this.serversService.updateStatus(server, ServerStatus.ONLINE);
        } else {
            this.logger.log(`Received metrics from server: ${server.name} [${server.ipAddress}]`);
            await this.serversService.updateStatus(server, ServerStatus.ONLINE);
        }

        const metric = this.metricRepository.create({
            serverId: server.id,
            cpuUsage: pushMetricDto.cpuUsage,
            ramUsage: pushMetricDto.ramUsage,
            diskUsage: pushMetricDto.diskUsage,
            networkIn: pushMetricDto.networkIn ?? 0,
            networkOut: pushMetricDto.networkOut ?? 0,
        });

        const savedMetric = await this.metricRepository.save(metric);

        this.checkAlerts(server, pushMetricDto).catch((err) =>
            console.error('Error checking alerts:', err),
        );

        return savedMetric;
    }

    async getMetrics(
        serverId: string,
        queryDto: QueryMetricDto,
    ): Promise<Metric[]> {
        const { from, to, limit = 100 } = queryDto;

        const where: any = { serverId };

        if (from && to) {
            where.timestamp = Between(new Date(from), new Date(to));
        }

        return this.metricRepository.find({
            where,
            order: { timestamp: 'DESC' },
            take: limit,
        });
    }

    async getLatestMetric(serverId: string): Promise<Metric | null> {
        return this.metricRepository.findOne({
            where: { serverId },
            order: { timestamp: 'DESC' },
        });
    }

    private async checkAlerts(server: Server, metrics: PushMetricDto) {
        const rules = await this.alertsService.findRulesByServer(server.id);

        for (const rule of rules) {
            let currentVal = 0;
            let metricName = '';

            switch (rule.metricType) {
                case MetricType.CPU:
                    currentVal = metrics.cpuUsage;
                    metricName = 'CPU';
                    break;
                case MetricType.RAM:
                    currentVal = metrics.ramUsage;
                    metricName = 'RAM';
                    break;
                case MetricType.DISK:
                    currentVal = metrics.diskUsage;
                    metricName = 'Disk';
                    break;
            }

            if (currentVal > rule.threshold) {
                const message = `🚨 <b>ALERT: ${server.name}</b>\nMetric: ${metricName}\nCurrent: ${currentVal}%\nThreshold: ${rule.threshold}%`;

                // Log audit
                await this.alertsService.createAuditLog(
                    server.ownerId,
                    'ALERT_TRIGGERED',
                    message,
                );

                // Send Telegram
                await this.telegramService.sendAlert(
                    server.name,
                    metricName,
                    currentVal,
                    rule.threshold,
                );
            }
        }
    }
}
