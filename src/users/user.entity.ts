import { BaseEntity } from 'src/common/base.entity';
import { Entity, Column } from 'typeorm';

@Entity()
export class User extends BaseEntity {
    @Column({ unique: true })
    username: string;

    @Column()
    password_hash: string;

    @Column()
    email: string;

    @Column()
    full_name: string;
}