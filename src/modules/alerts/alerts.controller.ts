import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/constants/user-role.enum';
import { AlertsService } from './alerts.service';
import { CreateAlertRuleDto } from './dto/create-alert-rule.dto';

@ApiTags('alerts')
@ApiBearerAuth('JWT')
@Controller('alerts')
export class AlertsController {
    constructor(private readonly alertsService: AlertsService) { }

    @Post('rules')
    createRule(@Body() dto: CreateAlertRuleDto) {
        return this.alertsService.createRule(dto);
    }

    @Get('rules/:serverId')
    getRules(@Param('serverId') serverId: string) {
        return this.alertsService.findRulesByServer(serverId);
    }

    @Delete('rules/:id')
    deleteRule(@Param('id') id: string) {
        return this.alertsService.deleteRule(id);
    }

    @Get('audit-logs')
    @Roles(UserRole.ADMIN)
    getAuditLogs(@Query('limit') limit?: string) {
        return this.alertsService.findAuditLogs(limit ? parseInt(limit) : 100);
    }
}
