import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../../common/constants/user-role.enum';

export class RegisterDto {
    @ApiProperty({ example: 'admin@domain.com', description: 'Địa chỉ email' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: '123456', description: 'Mật khẩu (tối thiểu 6 ký tự)' })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({ example: 'Nguyễn Tấn Tài', description: 'Họ và tên đầy đủ' })
    @IsString()
    @IsNotEmpty()
    fullName: string;

}
