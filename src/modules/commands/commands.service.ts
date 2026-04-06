import {
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Command } from './entities/command.entity';
import { ExecuteCommandDto } from './dto/execute-command.dto';
import { CommandResultDto } from './dto/command-result.dto';
import { ServersService } from '../servers/servers.service';
import { User } from '../users/entities/user.entity';
import { CommandStatus } from '../../common/constants/command-status.enum';
import { CommandType } from '../../common/constants/command-type.enum';

@Injectable()
export class CommandsService {
    constructor(
        @InjectRepository(Command)
        private readonly commandRepository: Repository<Command>,
        private readonly serversService: ServersService,
    ) { }

    async enqueue(dto: ExecuteCommandDto, user: User): Promise<Command> {
        await this.serversService.findOne(dto.serverId, user);

        const command = this.commandRepository.create({
            serverId: dto.serverId,
            createdBy: user.id,
            commandType: dto.commandType,
            payload: dto.payload,
            status: CommandStatus.PENDING,
        });

        return this.commandRepository.save(command);
    }

    async requestActiveUsers(serverId: string, user: User): Promise<Command> {
        return this.enqueue({
            serverId,
            commandType: CommandType.GET_ACTIVE_USERS,
            payload: {},
        }, user);
    }

    async findAll(serverId: string, user: User): Promise<Command[]> {
        await this.serversService.findOne(serverId, user);

        return this.commandRepository.find({
            where: { serverId },
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Command> {
        const command = await this.commandRepository.findOne({ where: { id } });

        if (!command) {
            throw new NotFoundException(`Command with id "${id}" not found`);
        }

        return command;
    }

    async pollNextCommand(agentToken: string): Promise<Command | null> {
        const server = await this.serversService.findByAgentToken(agentToken);

        if (!server) {
            throw new UnauthorizedException('Invalid agent token');
        }

        // Search for PENDING commands first
        let command = await this.commandRepository.findOne({
            where: { serverId: server.id, status: CommandStatus.PENDING },
            order: { createdAt: 'ASC' },
        });

        if (command) {
            command.status = CommandStatus.PROCESSING;
            // Update timestamp of last activity to help track stuck commands if needed later
            // For now, just save the status change
            await this.commandRepository.save(command);
            console.log(`[*] Command ${command.id} (${command.commandType}) sent to agent for server ${server.id}`);
        }

        return command;
    }

    async submitResult(
        commandId: string,
        agentToken: string,
        resultDto: CommandResultDto,
    ): Promise<Command> {
        const server = await this.serversService.findByAgentToken(agentToken);

        if (!server) {
            throw new UnauthorizedException('Invalid agent token');
        }

        const command = await this.findOne(commandId);

        if (command.serverId !== server.id) {
            throw new UnauthorizedException('Command does not belong to this server');
        }

        command.status = resultDto.status;
        command.resultLog = resultDto.resultLog || '';

        return this.commandRepository.save(command);
    }
}
