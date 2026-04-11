import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ServerStatus } from '../../../common/constants/server-status.enum';
import { User } from '../../users/entities/user.entity';

@Entity('servers')
export class Server extends BaseEntity {
    @Column({ name: 'owner_id' })
    ownerId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'owner_id' })
    owner: User;

    @Column({ length: 255 })
    name: string;

    @Column({ name: 'ip_address', length: 100, nullable: true })
    ipAddress: string;

    @Column({ name: 'agent_token', unique: true, select: false })
    agentToken: string;

    @Column({ name: 'agent_password_hash', select: false })
    agentPasswordHash: string;

    @Column({
        type: 'enum',
        enum: ServerStatus,
        default: ServerStatus.PENDING,
    })
    status: ServerStatus;

    @Column({ name: 'last_heartbeat', nullable: true })
    lastHeartbeat: Date;

    @Column({ name: 'top_processes', type: 'jsonb', nullable: true })
    topProcesses: {
        pid: number;
        user: string;
        cpu: number;
        mem: number;
        command: string;
    }[] | null;
}
