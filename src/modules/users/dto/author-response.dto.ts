import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class AuthorResponseDto {
    @Expose()
    id: string;

    @Expose()
    name: string;

    @Expose()
    avatarUrl?: string;

    @Expose()
    bio?: string;
}
