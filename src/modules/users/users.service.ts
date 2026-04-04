import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async create(createUserDto: CreateUserDto): Promise<User> {
        const existing = await this.userRepository.findOne({
            where: { email: createUserDto.email },
        });

        if (existing) {
            throw new ConflictException(
                `Email "${createUserDto.email}" already exists`,
            );
        }

        const passwordHash = await bcrypt.hash(createUserDto.password, 12);

        const user = this.userRepository.create({
            email: createUserDto.email,
            passwordHash,
            fullName: createUserDto.fullName,
            role: createUserDto.role,
        });

        return this.userRepository.save(user);
    }

    async findAll(): Promise<User[]> {
        return this.userRepository.find();
    }

    async findOne(id: string): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id } });

        if (!user) {
            throw new NotFoundException(`User with id "${id}" not found`);
        }

        return user;
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { email } });
    }

    async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        const user = await this.findOne(id);

        if (updateUserDto.password) {
            user.passwordHash = await bcrypt.hash(updateUserDto.password, 12);
        }

        if (updateUserDto.fullName) {
            user.fullName = updateUserDto.fullName;
        }

        if (updateUserDto.role) {
            user.role = updateUserDto.role;
        }

        return this.userRepository.save(user);
    }

    async remove(id: string): Promise<void> {
        const user = await this.findOne(id);
        await this.userRepository.remove(user);
    }
}
