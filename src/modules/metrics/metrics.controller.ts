import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { PushMetricDto } from './dto/push-metric.dto';
import { QueryMetricDto } from './dto/query-metric.dto';
import { MetricsService } from './metrics.service';

@ApiTags('metrics')
@Controller('metrics')
export class MetricsController {
    constructor(private readonly metricsService: MetricsService) { }

    @Public()
    @ApiSecurity('Agent-Token')
    @Post('push')
    pushMetric(
        @Headers('x-agent-token') agentToken: string,
        @Body() pushMetricDto: PushMetricDto,
    ) {
        return this.metricsService.pushMetric(agentToken, pushMetricDto);
    }

    @ApiBearerAuth('JWT')
    @Get(':serverId')
    getMetrics(
        @Param('serverId') serverId: string,
        @Query() queryDto: QueryMetricDto,
    ) {
        return this.metricsService.getMetrics(serverId, queryDto);
    }

    @ApiBearerAuth('JWT')
    @Get(':serverId/latest')
    getLatest(@Param('serverId') serverId: string) {
        return this.metricsService.getLatestMetric(serverId);
    }
}
