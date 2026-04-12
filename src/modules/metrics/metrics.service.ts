import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, LessThan, Not, Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
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

        const detectedIp = pushMetricDto.ipAddress || ip;

        if (detectedIp && (!server.ipAddress || server.ipAddress !== detectedIp)) {
            this.logger.log(`Auto-detected/Updated IP for server ${server.name}: ${detectedIp}`);
            server.ipAddress = detectedIp;
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

        if (pushMetricDto.topProcesses && pushMetricDto.topProcesses.length > 0) {
            await this.serversService.updateTopProcesses(
                server.id,
                pushMetricDto.topProcesses,
            );
        }

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

                await this.alertsService.createAuditLog(
                    server.ownerId,
                    'ALERT_TRIGGERED',
                    message,
                );

                await this.telegramService.sendAlert(
                    server.name,
                    metricName,
                    currentVal,
                    rule.threshold,
                );
            }
        }
    }

    // @Cron(process.env.METRICS_CRON_SCHEDULE || '*/5 * * * *')
    @Cron('*/5 * * * *')
    async cleanupOldMetrics() {
        const retentionMinutes = parseInt(process.env.METRICS_RETENTION_MINUTES || '5', 10);
        const timeLimit = new Date();
        timeLimit.setMinutes(timeLimit.getMinutes() - retentionMinutes);

        try {
            // Lấy danh sách các Server ID đang có metrics trong DB
            const distinctServers = await this.metricRepository
                .createQueryBuilder('metric')
                .select('metric.serverId', 'serverId')
                .distinct(true)
                .getRawMany();

            let totalDeleted = 0;

            for (const { serverId } of distinctServers) {
                // Lấy ra ID của 20 records mới nhất của server này để giữ lại
                const topMetrics = await this.metricRepository.find({
                    where: { serverId },
                    order: { timestamp: 'DESC' },
                    take: 20,
                    select: ['id'],
                });

                const idsToKeep = topMetrics.map(m => m.id);

                if (idsToKeep.length > 0) {
                    const result = await this.metricRepository.delete({
                        serverId,
                        timestamp: LessThan(timeLimit),
                        id: Not(In(idsToKeep)), // Không nằm trong top 20 mới nhất
                    });
                    totalDeleted += (result.affected || 0);
                }
            }

            if (totalDeleted > 0) {
                this.logger.log(`[Data Retention Demo] Cleaned up ${totalDeleted} old metrics records, keeping newest 20 per server.`);
            }
        } catch (error) {
            this.logger.error('Failed to cleanup old metrics:', error);
        }
    }
}
