import {
   IsString,
   IsNotEmpty,
   IsOptional,
   IsUUID,
   IsEnum,
   IsBoolean,
   IsArray,
   IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NewsStatus } from '../entities/news.entity';

export class CreateNewsDto {
   /* =========================
      Contenido principal
      ========================= */

   @ApiProperty({ example: 'Nueva noticia importante' })
   @IsString()
   @IsNotEmpty()
   title: string;

   @ApiProperty({ example: 'nueva-noticia-importante' })
   @IsString()
   @IsNotEmpty()
   slug: string;

   @ApiProperty({ example: 'Un breve resumen de la noticia' })
   @IsString()
   @IsNotEmpty()
   excerpt: string;

   @ApiProperty({ example: '<p>Contenido completo de la noticia...</p>' })
   @IsString()
   @IsNotEmpty()
   content: string;

   @ApiProperty({ required: false, example: 'https://ejemplo.com/imagen.jpg' })
   @IsString()
   @IsOptional()
   mainImageUrl?: string;

   @ApiProperty({ required: false })
   @IsString()
   @IsOptional()
   mainImageId?: string;

   @ApiProperty({ required: false, example: 'Foto: Juan Pérez / NDI' })
   @IsString()
   @IsOptional()
   mainImageCaption?: string;

   /* =========================
      Relaciones
      ========================= */

   @ApiProperty({ example: 'uuid-de-categoria' })
   @IsUUID()
   categoryId: string;

   @ApiProperty({ required: false, type: [String] })
   @IsArray()
   @IsUUID('all', { each: true })
   @IsOptional()
   tagIds?: string[];

   /* =========================
      Estado editorial
      ========================= */

   @ApiProperty({ enum: NewsStatus, required: false, default: NewsStatus.DRAFT })
   @IsEnum(NewsStatus)
   @IsOptional()
   status?: NewsStatus;

   @ApiProperty({ required: false, example: '2026-02-15T10:00:00Z' })
   @IsDateString()
   @IsOptional()
   scheduledAt?: string;

   /* =========================
      Home / destacados
      ========================= */

   @ApiProperty({ required: false, default: false })
   @IsBoolean()
   @IsOptional()
   featured?: boolean;

   /* =========================
      SEO
      ========================= */

   @ApiProperty({ required: false })
   @IsString()
   @IsOptional()
   seoTitle?: string;

   @ApiProperty({ required: false })
   @IsString()
   @IsOptional()
   seoDescription?: string;

   @ApiProperty({ required: false })
   @IsString()
   @IsOptional()
   canonicalUrl?: string;

   /* =========================
      Migración WordPress
      ========================= */

   @ApiProperty({ required: false })
   @IsString()
   @IsOptional()
   externalSource?: string;

   @ApiProperty({ required: false })
   @IsString()
   @IsOptional()
   externalId?: string;

   @ApiProperty({ required: false })
   @IsString()
   @IsOptional()
   legacyUrl?: string;

   @ApiProperty({ required: false, type: 'array', items: { type: 'object' } })
   @IsArray()
   @IsOptional()
   images?: { url: string; publicId: string; position?: number; caption?: string }[];
}
