import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { VerifyServerPasswordDto } from './dto/verify-server-password.dto';
import { ServersService } from './servers.service';
import { CommandsService } from '../commands/commands.service';
import { CommandType } from '../../common/constants/command-type.enum';

@ApiTags('servers')
@ApiBearerAuth('JWT')
@Controller('servers')
export class ServersController {
    constructor(
        private readonly serversService: ServersService,
        private readonly commandsService: CommandsService,
    ) { }

    @Post()
    create(@Body() dto: CreateServerDto, @GetUser() user: User) {
        return this.serversService.create(dto, user);
    }

    @Get()
    findAll(@GetUser() user: User) {
        return this.serversService.findAll(user);
    }

    @Public()
    @ApiOperation({ summary: 'List all servers (no auth required)' })
    @Get('public')
    findAllPublic() {
        return this.serversService.findAllPublic();
    }

    @Get(':id')
    findOne(@Param('id') id: string, @GetUser() user: User) {
        return this.serversService.findOne(id, user);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() dto: UpdateServerDto,
        @GetUser() user: User,
    ) {
        return this.serversService.update(id, dto, user);
    }

    @Delete(':id')
    remove(
        @Param('id') id: string,
        @Body() dto: VerifyServerPasswordDto,
        @GetUser() user: User,
    ) {
        return this.serversService.remove(id, dto.password, user);
    }


    @Post(':id/verify-password')
    verifyPassword(
        @Param('id') id: string,
        @Body() dto: VerifyServerPasswordDto,
        @GetUser() user: User,
    ) {
        return this.serversService.verifyPasswordAndGetSecrets(id, dto.password, user);
    }


    @Post(':id/kill-process')
    async killProcess(
        @Param('id') id: string,
        @Body('pid') pid: number,
        @GetUser() user: User,
    ) {
        await this.serversService.findOne(id, user);
        return this.commandsService.enqueue(
            {
                serverId: id,
                commandType: CommandType.KILL_PROCESS,
                payload: { cmd: `kill -9 ${pid}` },
            },
            user,
        );
    }

    @Post(':id/update-agent')
    async updateAgent(
        @Param('id') id: string,
        @GetUser() user: User,
    ) {
        const secrets = await this.serversService.verifyPasswordAndGetSecretsForSystem(id, user);
        return this.commandsService.enqueue(
            {
                serverId: id,
                commandType: CommandType.UPDATE_AGENT,
                payload: { cmd: secrets.oneLinerScript },
            },
            user,
        );
    }
}
