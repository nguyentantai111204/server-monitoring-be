import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { ServersService } from './servers.service';

@ApiTags('servers')
@ApiBearerAuth('JWT')
@Controller('servers')
export class ServersController {
    constructor(private readonly serversService: ServersService) { }

    @Post()
    create(@Body() createServerDto: CreateServerDto, @GetUser() user: User) {
        return this.serversService.create(createServerDto, user);
    }

    @Get()
    findAll(@GetUser() user: User) {
        return this.serversService.findAll(user);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @GetUser() user: User) {
        return this.serversService.findOne(id, user);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateServerDto: UpdateServerDto,
        @GetUser() user: User,
    ) {
        return this.serversService.update(id, updateServerDto, user);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @GetUser() user: User) {
        return this.serversService.remove(id, user);
    }

    @Post(':id/regenerate-token')
    regenerateToken(@Param('id') id: string, @GetUser() user: User) {
        return this.serversService.regenerateAgentToken(id, user);
    }
}
