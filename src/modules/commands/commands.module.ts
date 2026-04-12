import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Command } from './entities/command.entity';
import { CommandsController } from './commands.controller';
import { CommandsService } from './commands.service';
import { ServersModule } from '../servers/servers.module';
import { IpBlocklistService } from '../../common/services/ip-blocklist.service';
import { AgentAuthInterceptor } from '../../common/interceptors/agent-auth.interceptor';

@Module({
    imports: [TypeOrmModule.forFeature([Command]), forwardRef(() => ServersModule)],
    controllers: [CommandsController],
    providers: [CommandsService, IpBlocklistService, AgentAuthInterceptor],
    exports: [CommandsService],
})
export class CommandsModule { }
