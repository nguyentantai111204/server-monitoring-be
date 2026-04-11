import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyServerPasswordDto {
    @ApiProperty({ example: 'mySecret123', description: 'Mật khẩu của server' })
    @IsString()
    @IsNotEmpty()
    password: string;
}
