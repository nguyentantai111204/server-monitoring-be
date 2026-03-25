import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../../common/constants/user-role.enum';

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    fullName?: string;

    @IsOptional()
    @IsString()
    @MinLength(6)
    password?: string;

    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;
}
