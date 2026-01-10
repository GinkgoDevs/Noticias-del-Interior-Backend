import { Exclude, Expose, Type } from 'class-transformer';
import { CategoryResponseDto } from '../../categories/dto/category-response.dto';
import { AuthorResponseDto } from '../../users/dto/author-response.dto';

@Exclude()
export class NewsListResponseDto {
    @Expose()
    id: string;

    @Expose()
    title: string;

    @Expose()
    slug: string;

    @Expose()
    excerpt: string;

    @Expose()
    mainImageUrl?: string;

    @Expose()
    publishedAt: Date;

    @Expose()
    views: number;

    @Expose()
    @Type(() => CategoryResponseDto)
    category: CategoryResponseDto;

    @Expose()
    @Type(() => AuthorResponseDto)
    author: AuthorResponseDto;

    // No incluimos tags ni content
}
