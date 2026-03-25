import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
    @ApiProperty({ example: 'tantai', description: 'Tên đăng nhập' })
    @IsString()
    @IsNotEmpty()
    username: string;

    @ApiProperty({ example: '123456', description: 'Mật khẩu (tối thiểu 6 ký tự)' })
    @IsString()
    @MinLength(6)
    password: string;
}
