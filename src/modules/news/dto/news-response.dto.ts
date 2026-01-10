import { Exclude, Expose, Type } from 'class-transformer';
import { CategoryResponseDto } from '../../categories/dto/category-response.dto';
import { AuthorResponseDto } from '../../users/dto/author-response.dto';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

@Exclude()
export class NewsResponseDto {
    @Expose()
    id: string;

    @Expose()
    title: string;

    @Expose()
    slug: string;

    @Expose()
    excerpt: string;

    @Expose()
    content: string;

    @Expose()
    mainImageUrl?: string;

    @Expose()
    publishedAt: Date;

    @Expose()
    updatedAt: Date;

    @Expose()
    featured: boolean;

    @Expose()
    seoTitle?: string;

    @Expose()
    seoDescription?: string;

    @Expose()
    views: number;

    @Expose()
    @Type(() => CategoryResponseDto)
    category: CategoryResponseDto;

    @Expose()
    @Type(() => AuthorResponseDto)
    author: AuthorResponseDto;

    @Expose()
    @Type(() => TagResponseDto)
    tags: TagResponseDto[];

    constructor(partial: Partial<NewsResponseDto>) {
        Object.assign(this, partial);
    }
}
