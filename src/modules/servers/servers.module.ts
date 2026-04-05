import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Server } from './entities/server.entity';
import { ServersController } from './servers.controller';
import { ServersService } from './servers.service';
import { ServersStatusTask } from './tasks/servers-status.task';
import { CommandsModule } from '../commands/commands.module';

@Module({
    imports: [TypeOrmModule.forFeature([Server]), forwardRef(() => CommandsModule)],
    controllers: [ServersController],
    providers: [ServersService, ServersStatusTask],
    exports: [ServersService, ServersStatusTask],
})
export class ServersModule { }
