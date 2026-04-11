import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { AlertsService } from './alerts.service';
import { CreateAlertRuleDto } from './dto/create-alert-rule.dto';
import { UpdateAlertRuleDto } from './dto/update-alert-rule.dto';

@ApiTags('alerts')
@ApiBearerAuth('JWT')
@Controller('alerts')
export class AlertsController {
    constructor(private readonly alertsService: AlertsService) { }


    @Get()
    getRules(@Query('serverId') serverId: string, @GetUser() user: User) {
        if (serverId) {
            return this.alertsService.findAllRulesByServer(serverId);
        }
        return this.alertsService.findAllRulesByUser(user.id);
    }

    @Post()
    createRule(@Body() dto: CreateAlertRuleDto) {
        return this.alertsService.createRule(dto);
    }

    @Patch(':id')
    updateRule(@Param('id') id: string, @Body() dto: UpdateAlertRuleDto) {
        return this.alertsService.updateRule(id, dto);
    }

    @Delete(':id')
    deleteRule(@Param('id') id: string) {
        return this.alertsService.deleteRule(id);
    }

    @Get('audit-logs')
    getAuditLogs(
        @Query('limit') limit: string,
        @GetUser() user: User,
    ) {
        return this.alertsService.findAuditLogs(user.id, limit ? parseInt(limit) : 100);
    }
}
