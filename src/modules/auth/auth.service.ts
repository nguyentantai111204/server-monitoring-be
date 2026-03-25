import {
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshToken } from './entities/refresh-token.entity';
import { UserRole } from '../../common/constants/user-role.enum';

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepository: Repository<RefreshToken>,
    ) { }

    async register(registerDto: RegisterDto) {
        const user = await this.usersService.create({
            username: registerDto.username,
            password: registerDto.password,
            fullName: registerDto.fullName,
            role: registerDto.role || UserRole.VIEWER,
        });

        const { passwordHash: _pw, ...result } = user;
        return result;
    }

    async login(loginDto: LoginDto, userAgent?: string): Promise<TokenPair> {
        const user = await this.usersService.findByUsername(loginDto.username);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(
            loginDto.password,
            user.passwordHash,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return this.generateTokens(user.id, user.username, user.role, userAgent);
    }

    async refreshTokens(refreshTokenStr: string): Promise<TokenPair> {
        const tokenRecord = await this.refreshTokenRepository.findOne({
            where: { token: refreshTokenStr, isRevoked: false },
            relations: ['user'],
        });

        if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        tokenRecord.isRevoked = true;
        await this.refreshTokenRepository.save(tokenRecord);

        const { user } = tokenRecord;
        return this.generateTokens(user.id, user.username, user.role);
    }

    async logout(refreshTokenStr: string): Promise<void> {
        const token = await this.refreshTokenRepository.findOne({
            where: { token: refreshTokenStr },
        });

        if (!token) {
            throw new NotFoundException('Token not found');
        }

        token.isRevoked = true;
        await this.refreshTokenRepository.save(token);
    }

    async revokeAllUserTokens(userId: string): Promise<void> {
        await this.refreshTokenRepository.update(
            { userId, isRevoked: false },
            { isRevoked: true },
        );
    }

    private async generateTokens(
        userId: string,
        username: string,
        role: string,
        userAgent?: string,
    ): Promise<TokenPair> {
        const payload = { sub: userId, username, role };

        const jwtSecret =
            this.configService.get<string>('jwt.secret') ||
            'super-secret-key-change-in-production';
        const refreshSecret =
            this.configService.get<string>('jwt.refreshSecret') ||
            'super-refresh-secret-change-in-production';

        const accessToken = this.jwtService.sign(payload, {
            secret: jwtSecret,
            expiresIn: '15m',
        });

        const refreshTokenStr = this.jwtService.sign(payload, {
            secret: refreshSecret,
            expiresIn: '7d',
        });

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await this.refreshTokenRepository.save(
            this.refreshTokenRepository.create({
                userId,
                token: refreshTokenStr,
                expiresAt,
                userAgent: userAgent || '',
            }),
        );

        return { accessToken, refreshToken: refreshTokenStr };
    }
}
