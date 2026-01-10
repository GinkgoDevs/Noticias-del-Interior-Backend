import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    OneToMany,
} from 'typeorm';
import { NewsEntity } from '../../news/entities/news.entity';

@Entity('categories')
@Index('uq_categories_slug', ['slug'], { unique: true })
@Index('uq_categories_external', ['externalSource', 'externalId'], { unique: true })
export class CategoryEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar' })
    name: string;

    @Column({ type: 'varchar' })
    slug: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ default: true })
    active: boolean;

    @Column({ name: 'sortOrder', default: 0 })
    sortOrder: number;

    @Column({ nullable: true })
    seoTitle?: string;

    @Column({ type: 'text', nullable: true })
    seoDescription?: string;

    @OneToMany(() => NewsEntity, (news) => news.category)
    news: NewsEntity[];

    /* =========================
       Migración WordPress
       ========================= */

    @Column({ type: 'varchar', length: 50, nullable: true, comment: 'Origen externo (ej: wordpress)' })
    externalSource?: string;

    @Column({ type: 'varchar', length: 64, nullable: true, comment: 'ID del sistema de origen' })
    externalId?: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
