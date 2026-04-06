import {
    Body,
    Controller,
    Get,
    Headers,
    Param,
    Post,
    Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { CommandsService } from './commands.service';
import { CommandResultDto } from './dto/command-result.dto';
import { ExecuteCommandDto } from './dto/execute-command.dto';

@ApiTags('commands')
@ApiBearerAuth('JWT')
@Controller('commands')
export class CommandsController {
    constructor(private readonly commandsService: CommandsService) { }

    @Post()
    enqueue(@Body() dto: ExecuteCommandDto, @GetUser() user: User) {
        return this.commandsService.enqueue(dto, user);
    }

    @Get('server/:serverId')
    findAll(@Param('serverId') serverId: string, @GetUser() user: User) {
        return this.commandsService.findAll(serverId, user);
    }

    @Post('server/:serverId/active-users')
    requestActiveUsers(@Param('serverId') serverId: string, @GetUser() user: User) {
        return this.commandsService.requestActiveUsers(serverId, user);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.commandsService.findOne(id);
    }

    @Public()
    @ApiSecurity('Agent-Token')
    @Get('agent/poll')
    pollNext(@Headers('x-agent-token') agentToken: string) {
        return this.commandsService.pollNextCommand(agentToken);
    }

    @Public()
    @ApiSecurity('Agent-Token')
    @Put('agent/:commandId/result')
    submitResult(
        @Param('commandId') commandId: string,
        @Headers('x-agent-token') agentToken: string,
        @Body() resultDto: CommandResultDto,
    ) {
        return this.commandsService.submitResult(commandId, agentToken, resultDto);
    }
}
