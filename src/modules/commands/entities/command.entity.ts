import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Server } from '../../servers/entities/server.entity';
import { User } from '../../users/entities/user.entity';
import { CommandType } from '../../../common/constants/command-type.enum';
import { CommandStatus } from '../../../common/constants/command-status.enum';

@Entity('commands_queue')
export class Command extends BaseEntity {
    @Column({ name: 'server_id' })
    serverId: string;

    @ManyToOne(() => Server, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'server_id' })
    server: Server;

    @Column({ name: 'created_by' })
    createdBy: string;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'created_by' })
    creator: User;

    @Column({
        name: 'command_type',
        type: 'enum',
        enum: CommandType,
    })
    commandType: CommandType;

    @Column({ type: 'jsonb', default: {} })
    payload: Record<string, unknown>;

    @Column({
        type: 'enum',
        enum: CommandStatus,
        default: CommandStatus.PENDING,
    })
    status: CommandStatus;

    @Column({ name: 'result_log', type: 'text', nullable: true })
    resultLog: string;
}
