import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CommandStatus } from '../../../common/constants/command-status.enum';

export class CommandResultDto {
    @ApiProperty({
        example: CommandStatus.SUCCESS,
        enum: CommandStatus,
        description: 'Trạng thái sau khi thực thi lệnh',
    })
    @IsEnum(CommandStatus)
    status: CommandStatus;

    @ApiPropertyOptional({
        example: 'Service nginx restarted successfully',
        description: 'Chi tiết log/lỗi trả về từ Agent',
    })
    @IsOptional()
    @IsString()
    resultLog?: string;
}
