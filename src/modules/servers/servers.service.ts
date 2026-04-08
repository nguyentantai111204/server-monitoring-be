import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Server } from './entities/server.entity';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../../common/constants/user-role.enum';

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

    async create(
        createServerDto: CreateServerDto,
        owner: User,
    ): Promise<Server & { oneLinerScript: string }> {
        const agentToken = uuidv4();
        const server = this.serverRepository.create({
            name: createServerDto.name,
            ipAddress: createServerDto.ipAddress,
            ownerId: owner.id,
            agentToken,
        });

        const savedServer = await this.serverRepository.save(server);
        return {
            ...savedServer,
            oneLinerScript: this.generateOneLinerScript(agentToken, createServerDto.ipAddress),
        };
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
        return this.serverRepository.findOne({ where: { agentToken } });
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

    async remove(id: string, user: User): Promise<void> {
        const server = await this.findOne(id, user);
        await this.serverRepository.remove(server);
    }

    async regenerateAgentToken(
        id: string,
        user: User,
    ): Promise<Server & { oneLinerScript: string }> {
        const server = await this.findOne(id, user);
        const agentToken = uuidv4();
        server.agentToken = agentToken;
        const savedServer = await this.serverRepository.save(server);

        return {
            ...savedServer,
            oneLinerScript: this.generateOneLinerScript(agentToken, server.ipAddress),
        };
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
