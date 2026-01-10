import { IsOptional, IsEnum, IsUUID, IsBoolean, IsString, IsDateString } from 'class-validator';
import { NewsStatus } from '../entities/news.entity';

export class AdminFindNewsDto {
    @IsEnum(NewsStatus)
    @IsOptional()
    status?: NewsStatus;

    @IsUUID()
    @IsOptional()
    categoryId?: string;

    @IsUUID()
    @IsOptional()
    authorId?: string;

    @IsBoolean()
    @IsOptional()
    featured?: boolean;

    @IsString()
    @IsOptional()
    search?: string;

    @IsDateString()
    @IsOptional()
    dateFrom?: string;

    @IsDateString()
    @IsOptional()
    dateTo?: string;

    @IsOptional()
    page?: number = 1;

    @IsOptional()
    limit?: number = 20;
}
