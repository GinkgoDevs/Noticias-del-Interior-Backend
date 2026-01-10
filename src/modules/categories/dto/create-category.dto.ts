// src/modules/categories/dto/create-category.dto.ts
import {
    IsString,
    IsOptional,
    IsBoolean,
    IsInt,
    Min,
    MaxLength,
} from 'class-validator';

export class CreateCategoryDto {
    @IsString()
    @MaxLength(120)
    name: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @IsOptional()
    @IsBoolean()
    active?: boolean = true;

    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number = 0;

    @IsOptional()
    @IsString()
    @MaxLength(120)
    seoTitle?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    seoDescription?: string;
}
