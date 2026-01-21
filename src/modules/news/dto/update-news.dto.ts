import {
   IsString,
   IsOptional,
   IsEnum,
   IsBoolean,
   IsArray,
   IsUUID,
   IsDateString,
   IsInt,
   Min,
} from 'class-validator';
import { NewsStatus } from '../entities/news.entity';

export class UpdateNewsDto {
   /* =========================
      Contenido
      ========================= */

   @IsString()
   @IsOptional()
   title?: string;

   /**
    * ⚠️ El slug se valida acá,
    * pero el Service decide si se puede cambiar
    */
   @IsString()
   @IsOptional()
   slug?: string;

   @IsString()
   @IsOptional()
   excerpt?: string;

   @IsString()
   @IsOptional()
   content?: string;

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
   @IsOptional()
   categoryId?: string;

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

   /**
    * Para programación editorial
    */
   @IsDateString()
   @IsOptional()
   scheduledAt?: string;

   /* =========================
      Home / destacados
      ========================= */

   @IsBoolean()
   @IsOptional()
   featured?: boolean;

   @IsOptional()
   @IsInt()
   @Min(0)
   featuredOrder?: number;

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

   @IsArray()
   @IsOptional()
   images?: { url: string; publicId: string; position?: number }[];
}
