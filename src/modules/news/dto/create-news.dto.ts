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
import { NewsStatus } from '../entities/news.entity';

export class CreateNewsDto {
   /* =========================
      Contenido principal
      ========================= */

   @IsString()
   @IsNotEmpty()
   title: string;

   @IsString()
   @IsNotEmpty()
   slug: string;

   @IsString()
   @IsNotEmpty()
   excerpt: string;

   @IsString()
   @IsNotEmpty()
   content: string;

   @IsString()
   @IsOptional()
   mainImageUrl?: string;

   @IsString()
   @IsOptional()
   mainImageId?: string;

   /* =========================
      Relaciones
      ========================= */

   @IsUUID()
   categoryId: string;

   @IsArray()
   @IsUUID('all', { each: true })
   @IsOptional()
   tagIds?: string[];

   /* =========================
      Estado editorial
      ========================= */

   @IsEnum(NewsStatus)
   @IsOptional()
   status?: NewsStatus;

   @IsDateString()
   @IsOptional()
   scheduledAt?: string;

   /* =========================
      Home / destacados
      ========================= */

   @IsBoolean()
   @IsOptional()
   featured?: boolean;

   /* =========================
      SEO
      ========================= */

   @IsString()
   @IsOptional()
   seoTitle?: string;

   @IsString()
   @IsOptional()
   seoDescription?: string;

   @IsString()
   @IsOptional()
   canonicalUrl?: string;

   /* =========================
      Migración WordPress
      ========================= */

   @IsString()
   @IsOptional()
   externalSource?: string;

   @IsString()
   @IsOptional()
   externalId?: string;

   @IsString()
   @IsOptional()
   legacyUrl?: string;

   @IsArray()
   @IsOptional()
   images?: { url: string; publicId: string; position?: number }[];
}
