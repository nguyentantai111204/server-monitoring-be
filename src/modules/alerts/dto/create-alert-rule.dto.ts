import {
    IsBoolean,
    IsEnum,
    IsNumber,
    IsOptional,
    IsUUID,
    Max,
    Min,
} from 'class-validator';
import { MetricType } from '../../../common/constants/metric-type.enum';

export class CreateAlertRuleDto {
    @IsUUID()
    serverId: string;

    @IsEnum(MetricType)
    metricType: MetricType;

    @IsNumber()
    @Min(0)
    @Max(100)
    threshold: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
