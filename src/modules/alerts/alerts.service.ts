import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertRule } from './entities/alert-rule.entity';
import { AuditLog } from './entities/audit-log.entity';
import { CreateAlertRuleDto } from './dto/create-alert-rule.dto';
import { UpdateAlertRuleDto } from './dto/update-alert-rule.dto';

@Injectable()
export class AlertsService {
    constructor(
        @InjectRepository(AlertRule)
        private readonly alertRuleRepository: Repository<AlertRule>,
        @InjectRepository(AuditLog)
        private readonly auditLogRepository: Repository<AuditLog>,
    ) { }


    async createRule(dto: CreateAlertRuleDto): Promise<AlertRule> {
        const rule = this.alertRuleRepository.create(dto);
        return this.alertRuleRepository.save(rule);
    }

    async findRulesByServer(serverId: string): Promise<AlertRule[]> {
        return this.alertRuleRepository.find({
            where: { serverId, isActive: true },
        });
    }

    async findAllRulesByServer(serverId: string): Promise<AlertRule[]> {
        return this.alertRuleRepository.find({
            where: { serverId },
            order: { createdAt: 'DESC' },
        });
    }

    async findAllRulesByUser(userId: string): Promise<AlertRule[]> {
        return this.alertRuleRepository
            .createQueryBuilder('rule')
            .innerJoin('rule.server', 'server')
            .addSelect(['server.id', 'server.name'])
            .where('server.ownerId = :userId', { userId })
            .orderBy('rule.createdAt', 'DESC')
            .getMany();
    }

    async updateRule(id: string, dto: UpdateAlertRuleDto): Promise<AlertRule> {
        const rule = await this.alertRuleRepository.findOne({ where: { id } });
        if (!rule) {
            throw new NotFoundException(`Alert rule "${id}" not found`);
        }
        Object.assign(rule, dto);
        return this.alertRuleRepository.save(rule);
    }

    async deleteRule(id: string): Promise<void> {
        const rule = await this.alertRuleRepository.findOne({ where: { id } });
        if (!rule) {
            throw new NotFoundException(`Alert rule "${id}" not found`);
        }
        await this.alertRuleRepository.remove(rule);
    }


    async createAuditLog(
        userId: string,
        action: string,
        description?: string,
    ): Promise<AuditLog> {
        const log = this.auditLogRepository.create({ userId, action, description });
        return this.auditLogRepository.save(log);
    }

    async findAuditLogs(userId?: string, limit = 100): Promise<AuditLog[]> {
        const qb = this.auditLogRepository
            .createQueryBuilder('log')
            .leftJoinAndSelect('log.user', 'user')
            .orderBy('log.timestamp', 'DESC')
            .take(limit);

        if (userId) {
            qb.where('log.userId = :userId', { userId });
        }

        return qb.getMany();
    }
}
