import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsObject, IsUUID } from 'class-validator';
import { CommandType } from '../../../common/constants/command-type.enum';

export class ExecuteCommandDto {
    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'ID của server nhận lệnh',
    })
    @IsUUID()
    serverId: string;

    @ApiProperty({
        example: CommandType.RESTART_SERVICE,
        enum: CommandType,
        description: 'Loại lệnh cần thực thi',
    })
    @IsEnum(CommandType)
    commandType: CommandType;

    @ApiProperty({
        example: { service: 'nginx' },
        description: 'Tham số của lệnh (JSON)',
    })
    @IsObject()
    @IsNotEmpty()
    payload: Record<string, unknown>;
}
