import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max } from 'class-validator';

/**
 * DTO base para paginación
 * Uso: extends PaginationDto
 */
export class PaginationDto {
    @ApiProperty({ required: false, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiProperty({ required: false, default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    get skip(): number {
        return ((this.page || 1) - 1) * (this.limit || 10);
    }
}

/**
 * Metadata de paginación para respuestas
 */
export class PaginationMeta {
    @ApiProperty()
    page: number;

    @ApiProperty()
    limit: number;

    @ApiProperty()
    total: number;

    @ApiProperty()
    totalPages: number;

    @ApiProperty()
    hasNextPage: boolean;

    @ApiProperty()
    hasPreviousPage: boolean;

    constructor(page: number, limit: number, total: number) {
        this.page = Number(page);
        this.limit = Number(limit);
        this.total = Number(total);
        this.totalPages = Math.ceil(this.total / this.limit);
        this.hasNextPage = this.page < this.totalPages;
        this.hasPreviousPage = this.page > 1;
    }
}

/**
 * Respuesta paginada genérica
 */
export class PaginatedResponse<T> {
    @ApiProperty({ isArray: true })
    data: T[];

    @ApiProperty()
    meta: PaginationMeta;

    constructor(data: T[], page: number, limit: number, total: number) {
        this.data = data;
        this.meta = new PaginationMeta(page, limit, total);
    }
}
