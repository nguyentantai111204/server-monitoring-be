import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Metric } from './entities/metric.entity';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { ServersModule } from '../servers/servers.module';
import { AlertsModule } from '../alerts/alerts.module';
import { TelegramModule } from '../../providers/telegram/telegram.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Metric]),
        ServersModule,
        AlertsModule,
        TelegramModule,
    ],
    controllers: [MetricsController],
    providers: [MetricsService],
    exports: [MetricsService],
})
export class MetricsModule { }
