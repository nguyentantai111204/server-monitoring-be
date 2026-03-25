import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class PushMetricDto {
    @ApiProperty({ example: 45.5, description: 'Phần trăm CPU sử dụng (0-100)' })
    @IsNumber()
    @Min(0)
    @Max(100)
    cpuUsage: number;

    @ApiProperty({ example: 60.2, description: 'Phần trăm RAM sử dụng (0-100)' })
    @IsNumber()
    @Min(0)
    @Max(100)
    ramUsage: number;

    @ApiProperty({ example: 30.0, description: 'Phần trăm Disk sử dụng (0-100)' })
    @IsNumber()
    @Min(0)
    @Max(100)
    diskUsage: number;

    @ApiPropertyOptional({ example: 1024, description: 'Lưu lượng mạng vào (Bytes)' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    networkIn?: number;

    @ApiPropertyOptional({ example: 512, description: 'Lưu lượng mạng ra (Bytes)' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    networkOut?: number;
}
