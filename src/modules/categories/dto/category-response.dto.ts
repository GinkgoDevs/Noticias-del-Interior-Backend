import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class CategoryResponseDto {
    @Expose()
    id: string;

    @Expose()
    name: string;

    @Expose()
    slug: string;

    @Expose()
    color: string;

    // Métodos estáticos de ayuda
    static fromEntity(entity: any): CategoryResponseDto {
        const dto = new CategoryResponseDto();
        dto.id = entity.id;
        dto.name = entity.name;
        dto.slug = entity.slug;
        dto.color = entity.color;
        return dto;
    }
}
