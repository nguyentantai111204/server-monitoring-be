import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../../common/constants/user-role.enum';

export class RegisterDto {
    @ApiProperty({ example: 'tantai', description: 'Tên đăng nhập (phải unique)' })
    @IsString()
    @IsNotEmpty()
    username: string;

    @ApiProperty({ example: '123456', description: 'Mật khẩu (tối thiểu 6 ký tự)' })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({ example: 'Nguyễn Tấn Tài', description: 'Họ và tên đầy đủ' })
    @IsString()
    @IsNotEmpty()
    fullName: string;

    @ApiPropertyOptional({
        example: UserRole.ADMIN,
        enum: UserRole,
        description: 'Vai trò người dùng (mặc định: ADMIN)',
    })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;
}
