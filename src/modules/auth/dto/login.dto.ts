import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
    @ApiProperty({ example: 'admin@domain.com', description: 'Email đăng nhập' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: '123456', description: 'Mật khẩu (tối thiểu 6 ký tự)' })
    @IsString()
    @MinLength(6)
    password: string;
}
