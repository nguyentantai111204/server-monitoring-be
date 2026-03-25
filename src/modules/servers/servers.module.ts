import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Server } from './entities/server.entity';
import { ServersController } from './servers.controller';
import { ServersService } from './servers.service';
import { ServersStatusTask } from './tasks/servers-status.task';

@Module({
    imports: [TypeOrmModule.forFeature([Server])],
    controllers: [ServersController],
    providers: [ServersService, ServersStatusTask],
    exports: [ServersService, ServersStatusTask],
})
export class ServersModule { }
