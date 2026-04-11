import { ApiProperty } from '@nestjs/swagger';
import { IsIP, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateServerDto {
    @ApiProperty({ example: 'Production Web Server', description: 'Tên máy chủ' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: '192.168.1.100', description: 'Địa chỉ IP của máy chủ', required: false })
    @IsIP()
    @IsOptional()
    ipAddress?: string;

    @ApiProperty({ example: 'mySecret123', description: 'Mật khẩu để xem agent token và install link' })
    @IsString()
    @IsNotEmpty()
    @MinLength(4, { message: 'Password must be at least 4 characters' })
    password: string;
}

