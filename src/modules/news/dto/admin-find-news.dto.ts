import { IsOptional, IsEnum, IsUUID, IsBoolean, IsString, IsDateString, IsNumber } from 'class-validator';
import { Type, Transform } from 'class-transformer';
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
    @Transform(({ value }) => value === 'true' || value === true)
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

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    page?: number = 1;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    limit?: number = 20;

    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    withDeleted?: boolean;
}
