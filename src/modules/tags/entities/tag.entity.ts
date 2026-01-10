import {
   Entity,
   PrimaryGeneratedColumn,
   Column,
   CreateDateColumn,
   UpdateDateColumn,
   Index,
   ManyToMany,
} from 'typeorm';
import { NewsEntity } from '../../news/entities/news.entity';

@Entity('tags')
@Index('uq_tags_slug', ['slug'], { unique: true })
@Index('uq_tags_external', ['externalSource', 'externalId'], { unique: true })
export class TagEntity {
   @PrimaryGeneratedColumn('uuid')
   id: string;

   @Column({ type: 'varchar', length: 120 })
   name: string;

   @Column({ type: 'varchar', length: 120 })
   slug: string;

   @Column({ default: true })
   active: boolean;

   /* =========================
      Migración WordPress
      ========================= */

   @Column({ type: 'varchar', length: 50, nullable: true, comment: 'Origen externo (ej: wordpress)' })
   externalSource?: string;

   @Column({ type: 'varchar', length: 64, nullable: true, comment: 'ID del sistema de origen' })
   externalId?: string;

   /* =========================
      Relaciones
      ========================= */

   @ManyToMany(() => NewsEntity, (news) => news.tags)
   news: NewsEntity[];

   /* =========================
      Auditoría
      ========================= */

   @CreateDateColumn({ type: 'timestamp' })
   createdAt: Date;

   @UpdateDateColumn({ type: 'timestamp' })
   updatedAt: Date;
}
