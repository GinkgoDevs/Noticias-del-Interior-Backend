import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max } from 'class-validator';

/**
 * DTO base para paginación
 * Uso: extends PaginationDto
 */
export class PaginationDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

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
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;

    constructor(page: number, limit: number, total: number) {
        this.page = page;
        this.limit = limit;
        this.total = total;
        this.totalPages = Math.ceil(total / limit);
        this.hasNextPage = page < this.totalPages;
        this.hasPreviousPage = page > 1;
    }
}

/**
 * Respuesta paginada genérica
 */
export class PaginatedResponse<T> {
    data: T[];
    meta: PaginationMeta;

    constructor(data: T[], page: number, limit: number, total: number) {
        this.data = data;
        this.meta = new PaginationMeta(page, limit, total);
    }
}
