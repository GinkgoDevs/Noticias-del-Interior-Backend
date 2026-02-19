import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    JoinColumn
} from 'typeorm';
import { NewsEntity } from './news.entity';

@Entity('news_images')
export class NewsImageEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => NewsEntity, (news) => news.images, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'newsId' })
    news: NewsEntity;

    @Column()
    publicId: string;

    @Column()
    url: string;

    @Column({
        type: 'varchar',
        default: 'content'
    })
    source: 'wordpress' | 'content' | 'upload';

    @Column({ default: 0 })
    position: number;

    @Column({ type: 'varchar', length: 500, nullable: true })
    caption?: string;

    @CreateDateColumn()
    createdAt: Date;
}
