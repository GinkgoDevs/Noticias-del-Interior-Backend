import { IsOptional, IsEnum, IsUUID, IsBoolean, IsString, IsDateString, IsNumber } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { NewsStatus } from '../entities/news.entity';

export class AdminFindNewsDto {
    @ApiProperty({ enum: NewsStatus, required: false })
    @IsEnum(NewsStatus)
    @IsOptional()
    status?: NewsStatus;

    @ApiProperty({ required: false })
    @IsUUID()
    @IsOptional()
    categoryId?: string;

    @ApiProperty({ required: false })
    @IsUUID()
    @IsOptional()
    authorId?: string;

    @ApiProperty({ required: false, type: Boolean })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    featured?: boolean;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    search?: string;

    @ApiProperty({ required: false })
    @IsDateString()
    @IsOptional()
    dateFrom?: string;

    @ApiProperty({ required: false })
    @IsDateString()
    @IsOptional()
    dateTo?: string;

    @ApiProperty({ required: false, default: 1 })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    page?: number = 1;

    @ApiProperty({ required: false, default: 20 })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    limit?: number = 20;

    @ApiProperty({ required: false, type: Boolean })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    withDeleted?: boolean;
}
