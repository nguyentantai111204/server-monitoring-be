import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Server } from '../../servers/entities/server.entity';
import { MetricType } from '../../../common/constants/metric-type.enum';

@Entity('alert_rules')
export class AlertRule extends BaseEntity {
    @Column({ name: 'server_id' })
    serverId: string;

    @ManyToOne(() => Server, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'server_id' })
    server: Server;

    @Column({
        name: 'metric_type',
        type: 'enum',
        enum: MetricType,
    })
    metricType: MetricType;

    @Column({ type: 'float' })
    threshold: number;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;
}
