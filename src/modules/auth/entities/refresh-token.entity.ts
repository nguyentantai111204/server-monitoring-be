import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('refresh_tokens')
export class RefreshToken extends BaseEntity {
    @Column({ name: 'user_id' })
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'text' })
    token: string;

    @Column({ name: 'expires_at' })
    expiresAt: Date;

    @Column({ name: 'is_revoked', default: false })
    isRevoked: boolean;

    @Column({ name: 'user_agent', type: 'text', nullable: true })
    userAgent: string;
}
