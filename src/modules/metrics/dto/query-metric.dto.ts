import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryMetricDto {
    @ApiPropertyOptional({
        example: new Date(Date.now() - 3600000).toISOString(),
        description: 'Thời điểm bắt đầu (ISO Date)',
    })
    @IsOptional()
    @IsDateString()
    from?: string;

    @ApiPropertyOptional({
        example: new Date().toISOString(),
        description: 'Thời điểm kết thúc (ISO Date)',
    })
    @IsOptional()
    @IsDateString()
    to?: string;

    @ApiPropertyOptional({
        example: 50,
        description: 'Số lượng bản ghi tối đa trả về',
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 100;
}
