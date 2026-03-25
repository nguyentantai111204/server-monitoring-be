import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Command } from './entities/command.entity';
import { CommandsController } from './commands.controller';
import { CommandsService } from './commands.service';
import { ServersModule } from '../servers/servers.module';

@Module({
    imports: [TypeOrmModule.forFeature([Command]), ServersModule],
    controllers: [CommandsController],
    providers: [CommandsService],
    exports: [CommandsService],
})
export class CommandsModule { }
