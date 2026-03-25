import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Server } from '../entities/server.entity';
import { ServerStatus } from '../../../common/constants/server-status.enum';

@Injectable()
export class ServersStatusTask {
    private readonly logger = new Logger(ServersStatusTask.name);

    constructor(
        @InjectRepository(Server)
        private readonly serverRepository: Repository<Server>,
    ) { }

    @Cron(CronExpression.EVERY_MINUTE)
    async handleCron() {
        this.logger.debug('Running server status check...');

        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

        const servers = await this.serverRepository.find({
            where: {
                status: ServerStatus.ONLINE,
                lastHeartbeat: LessThan(oneMinuteAgo),
            },
        });

        if (servers.length === 0) {
            return;
        }

        this.logger.log(`Found ${servers.length} servers timed out. Marking as OFFLINE.`);

        for (const server of servers) {
            server.status = ServerStatus.OFFLINE;
        }

        await this.serverRepository.save(servers);
    }
}
