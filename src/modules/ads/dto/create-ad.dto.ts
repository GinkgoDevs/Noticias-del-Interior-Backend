import { IsString, IsEnum, IsOptional, IsBoolean, IsUrl, IsDateString } from 'class-validator';
import { AdPosition } from '../entities/ad.entity';

export class CreateAdDto {
    @IsString()
    title: string;

    @IsString()
    imageUrl: string;

    @IsString()
    @IsOptional()
    linkUrl?: string;

    @IsEnum(AdPosition)
    position: AdPosition;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsDateString()
    @IsOptional()
    startDate?: string;

    @IsDateString()
    @IsOptional()
    endDate?: string;
}

export class UpdateAdDto extends CreateAdDto { }
