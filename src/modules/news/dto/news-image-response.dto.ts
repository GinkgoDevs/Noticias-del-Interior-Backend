import { Expose } from 'class-transformer';

export class NewsImageResponseDto {
    @Expose()
    id: string;

    @Expose()
    url: string;

    @Expose()
    publicId: string;

    @Expose()
    position: number;

    @Expose()
    caption?: string;

    @Expose()
    source: string;
}
