import { IsBoolean, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateAlertRuleDto {
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    threshold?: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
