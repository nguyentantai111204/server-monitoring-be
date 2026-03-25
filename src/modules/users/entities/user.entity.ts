import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserRole } from '../../../common/constants/user-role.enum';

@Entity('users')
export class User extends BaseEntity {
    @Column({ unique: true, length: 100 })
    username: string;

    @Column({ name: 'password_hash', type: 'text' })
    passwordHash: string;

    @Column({ name: 'full_name', length: 255 })
    fullName: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.ADMIN,
    })
    role: UserRole;
}
