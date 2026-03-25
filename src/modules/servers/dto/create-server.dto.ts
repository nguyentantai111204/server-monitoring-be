import { ApiProperty } from '@nestjs/swagger';
import { IsIP, IsNotEmpty, IsString } from 'class-validator';

export class CreateServerDto {
    @ApiProperty({ example: 'Production Web Server', description: 'Tên máy chủ' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: '192.168.1.100', description: 'Địa chỉ IP của máy chủ' })
    @IsIP()
    ipAddress: string;
}
