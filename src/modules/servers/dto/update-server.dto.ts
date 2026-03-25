import { IsEnum, IsIP, IsOptional, IsString } from 'class-validator';
import { ServerStatus } from '../../../common/constants/server-status.enum';

export class UpdateServerDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsIP()
    ipAddress?: string;

    @IsOptional()
    @IsEnum(ServerStatus)
    status?: ServerStatus;
}
