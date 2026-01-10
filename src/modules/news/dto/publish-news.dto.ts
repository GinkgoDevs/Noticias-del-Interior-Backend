import { IsOptional, IsDateString } from 'class-validator';

export class PublishNewsDto {
    @IsOptional()
    @IsDateString()
    publishedAt?: string;
}
