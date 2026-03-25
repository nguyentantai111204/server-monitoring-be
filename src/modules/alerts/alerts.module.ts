import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertRule } from './entities/alert-rule.entity';
import { AuditLog } from './entities/audit-log.entity';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';

@Module({
    imports: [TypeOrmModule.forFeature([AlertRule, AuditLog])],
    controllers: [AlertsController],
    providers: [AlertsService],
    exports: [AlertsService],
})
export class AlertsModule { }
