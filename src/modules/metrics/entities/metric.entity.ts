import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Server } from '../../servers/entities/server.entity';

@Entity('server_metrics')
export class Metric {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: number;

    @Column({ name: 'server_id' })
    serverId: string;

    @ManyToOne(() => Server, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'server_id' })
    server: Server;

    @Column({ name: 'cpu_usage', type: 'float' })
    cpuUsage: number;

    @Column({ name: 'ram_usage', type: 'float' })
    ramUsage: number;

    @Column({ name: 'disk_usage', type: 'float' })
    diskUsage: number;

    @Column({ name: 'network_in', type: 'bigint', default: 0 })
    networkIn: number;

    @Column({ name: 'network_out', type: 'bigint', default: 0 })
    networkOut: number;

    @CreateDateColumn({ name: 'timestamp' })
    timestamp: Date;
}
