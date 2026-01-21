import {
   Entity,
   PrimaryGeneratedColumn,
   Column,
   CreateDateColumn,
   UpdateDateColumn,
   DeleteDateColumn,
   Index,
   ManyToOne,
   ManyToMany,
   JoinColumn,
   JoinTable,
} from 'typeorm';
import { CategoryEntity } from '../../categories/entities/category.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { TagEntity } from '../../tags/entities/tag.entity';
import { NewsImageEntity } from './news-image.entity';
import { OneToMany } from 'typeorm';

export enum NewsStatus {
   DRAFT = 'DRAFT',
   PUBLISHED = 'PUBLISHED',
   ARCHIVED = 'ARCHIVED',
}

@Entity('news')
@Index('uq_news_slug', ['slug'], { unique: true })
@Index('idx_news_published_at', ['publishedAt'])
@Index('idx_news_status', ['status'])
@Index('idx_news_featured', ['featured'])
@Index('idx_news_status_published_at', ['status', 'publishedAt'])
@Index('uq_news_external', ['externalSource', 'externalId'], { unique: true })
export class NewsEntity {
   @PrimaryGeneratedColumn('uuid')
   id: string;

   /* =========================
      Contenido principal
      ========================= */

   @Column()
   title: string;

   @Column({ length: 255 })
   slug: string;

   @Column({ type: 'text' })
   excerpt: string;

   @Column({ type: 'text' })
   content: string;

   @Column({ nullable: true })
   mainImageUrl?: string;

   @Column({ nullable: true })
   mainImageId?: string; // Cloudinary Public ID

   /* =========================
      Estado editorial
      ========================= */

   @Column({
      type: 'enum',
      enum: NewsStatus,
      default: NewsStatus.DRAFT,
   })
   status: NewsStatus;

   @Column({ type: 'timestamp', nullable: true })
   publishedAt?: Date | null;

   @Column({ type: 'timestamp', nullable: true })
   scheduledAt?: Date | null;

   /* =========================
      Home / destacados
      ========================= */

   @Column({ default: false })
   featured: boolean;

   @Column({ type: 'int', nullable: true })
   featuredOrder?: number;

   /* =========================
      SEO
      ========================= */

   @Column({ nullable: true })
   seoTitle?: string;

   @Column({ type: 'text', nullable: true })
   seoDescription?: string;

   @Column({ nullable: true })
   canonicalUrl?: string;

   /* =========================
      Relaciones principales
      ========================= */

   @ManyToOne(() => CategoryEntity, { nullable: false, onDelete: 'RESTRICT' })
   @JoinColumn({ name: 'categoryId' })
   category: CategoryEntity;

   @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'RESTRICT' })
   @JoinColumn({ name: 'authorId' })
   author: UserEntity;

   /* =========================
      Tags (Many-to-Many)
      ========================= */

   @ManyToMany(() => TagEntity, (tag) => tag.news)
   @JoinTable({
      name: 'news_tags',
      joinColumn: {
         name: 'newsId',
         referencedColumnName: 'id',
      },
      inverseJoinColumn: {
         name: 'tagId',
         referencedColumnName: 'id',
      },
   })
   tags: TagEntity[];

   @OneToMany(() => NewsImageEntity, (image) => image.news, { cascade: true })
   images: NewsImageEntity[];

   /* =========================
      Migración WordPress
      ========================= */

   @Column({ type: 'varchar', length: 50, nullable: true, comment: 'Origen externo (ej: wordpress)' })
   externalSource?: string;

   @Column({ type: 'varchar', length: 64, nullable: true, comment: 'ID del sistema de origen' })
   externalId?: string;

   @Column({ nullable: true })
   legacyUrl?: string; // URL vieja (301 + FB comments)

   @Column({ type: 'timestamp', nullable: true })
   importedAt?: Date;

   /* =========================
      Métricas Editoriales
      ========================= */

   @Column({ default: 0 })
   views: number;

   @Column({ type: 'timestamp', nullable: true })
   lastViewedAt?: Date;

   /* =========================
      Auditoría
      ========================= */

   @CreateDateColumn({ type: 'timestamp' })
   createdAt: Date;

   @UpdateDateColumn({ type: 'timestamp' })
   updatedAt: Date;

   @DeleteDateColumn({ type: 'timestamp', nullable: true })
   deletedAt?: Date | null;
}
