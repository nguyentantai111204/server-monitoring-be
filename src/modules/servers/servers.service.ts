import {
    ForbiddenException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { Server } from './entities/server.entity';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../../common/constants/user-role.enum';

const SALT_ROUNDS = 10;

@Injectable()
export class ServersService {
    constructor(
        @InjectRepository(Server)
        private readonly serverRepository: Repository<Server>,
        private readonly configService: ConfigService,
    ) { }


    public generateOneLinerScript(agentToken: string, ipAddress?: string): string {
        const baseUrl = this.configService.get<string>('app.url') || 'http://localhost:3000';
        let script = `curl -sSL ${baseUrl}/scripts/install.sh | sudo bash -s -- -t ${agentToken} -u ${baseUrl}`;
        if (ipAddress) {
            script += ` -ip ${ipAddress}`;
        }
        return script;
    }

    // Fetch a server WITH the sensitive fields that are excluded by default (select: false)
    private async findOneWithSecrets(id: string): Promise<Server> {
        const server = await this.serverRepository
            .createQueryBuilder('server')
            .addSelect('server.agentToken')
            .addSelect('server.agentPasswordHash')
            .where('server.id = :id', { id })
            .getOne();

        if (!server) {
            throw new NotFoundException(`Server with id "${id}" not found`);
        }

        return server;
    }

    // ─── Core CRUD ───────────────────────────────────────────────────────────────

    async create(
        dto: CreateServerDto,
        owner: User,
    ): Promise<Server> {
        const agentToken = uuidv4();
        const agentPasswordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

        const server = this.serverRepository.create({
            name: dto.name,
            ipAddress: dto.ipAddress,
            ownerId: owner.id,
            agentToken,
            agentPasswordHash,
        });

        return this.serverRepository.save(server);
    }

    async findAllPublic(): Promise<Server[]> {
        return this.serverRepository.find({ relations: ['owner'] });
    }

    async findAll(user: User): Promise<Server[]> {
        if (user.role === UserRole.ADMIN) {
            return this.serverRepository.find({ relations: ['owner'] });
        }

        return this.serverRepository.find({
            where: { ownerId: user.id },
            relations: ['owner'],
        });
    }

    async findOne(id: string, user: User): Promise<Server> {
        const server = await this.serverRepository.findOne({
            where: { id },
            relations: ['owner'],
        });

        if (!server) {
            throw new NotFoundException(`Server with id "${id}" not found`);
        }

        if (user.role !== UserRole.ADMIN && server.ownerId !== user.id) {
            throw new ForbiddenException('You do not own this server');
        }

        return server;
    }

    async findByAgentToken(agentToken: string): Promise<Server | null> {
        return this.serverRepository
            .createQueryBuilder('server')
            .addSelect('server.agentToken')
            .where('server.agentToken = :agentToken', { agentToken })
            .getOne();
    }

    async update(
        id: string,
        updateServerDto: UpdateServerDto,
        user: User,
    ): Promise<Server> {
        const server = await this.findOne(id, user);
        Object.assign(server, updateServerDto);
        return this.serverRepository.save(server);
    }

    async remove(id: string, password: string, user: User): Promise<void> {
        await this.findOne(id, user);
        const serverWithSecrets = await this.findOneWithSecrets(id);
        const isPasswordCorrect = await bcrypt.compare(password, serverWithSecrets.agentPasswordHash);
        if (!isPasswordCorrect) {
            throw new UnauthorizedException('Incorrect server password');
        }
        await this.serverRepository.remove(serverWithSecrets);
    }

    async verifyPasswordAndGetSecrets(
        id: string,
        password: string,
        user: User,
    ): Promise<{ agentToken: string; oneLinerScript: string }> {
        // Ensure the user is authorized to access this server
        await this.findOne(id, user);

        // Fetch the row again with the sensitive fields
        const serverWithSecrets = await this.findOneWithSecrets(id);

        const isPasswordCorrect = await bcrypt.compare(password, serverWithSecrets.agentPasswordHash);
        if (!isPasswordCorrect) {
            throw new UnauthorizedException('Incorrect server password');
        }

        return {
            agentToken: serverWithSecrets.agentToken,
            oneLinerScript: this.generateOneLinerScript(serverWithSecrets.agentToken, serverWithSecrets.ipAddress),
        };
    }

    async verifyPasswordAndGetSecretsForSystem(
        id: string,
        user: User,
    ): Promise<{ agentToken: string; oneLinerScript: string }> {
        await this.findOne(id, user);
        const serverWithSecrets = await this.findOneWithSecrets(id);

        return {
            agentToken: serverWithSecrets.agentToken,
            oneLinerScript: this.generateOneLinerScript(serverWithSecrets.agentToken, serverWithSecrets.ipAddress),
        };
    }



    async regenerateAgentToken(
        id: string,
        user: User,
    ): Promise<Server> {
        const server = await this.findOne(id, user);
        const agentToken = uuidv4();
        server.agentToken = agentToken;
        return this.serverRepository.save(server);
    }


    async updateStatus(server: Server, status: any): Promise<Server> {
        server.status = status;
        server.lastHeartbeat = new Date();
        return this.serverRepository.save(server);
    }

    async updateTopProcesses(
        serverId: string,
        topProcesses: Server['topProcesses'],
    ): Promise<void> {
        await this.serverRepository.update(serverId, { topProcesses });
    }
}
