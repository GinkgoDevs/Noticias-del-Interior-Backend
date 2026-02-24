import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum AdPosition {
    HEADER = 'HEADER',
    SIDEBAR = 'SIDEBAR',
    ARTICLE_SIDEBAR = 'ARTICLE_SIDEBAR', // Sidebar for the news page
    NEWS_LIST = 'NEWS_LIST',
    CONTENT = 'CONTENT', // Inside article content
    FOOTER = 'FOOTER',
}

@Entity('ads')
export class AdEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ type: 'text' })
    imageUrl: string;

    @Column({ type: 'text', nullable: true })
    linkUrl: string;

    @Column({
        type: 'enum',
        enum: AdPosition,
        default: AdPosition.NEWS_LIST,
    })
    position: AdPosition;

    @Column({ default: true })
    isActive: boolean;

    @Column({ type: 'int', default: 0 })
    views: number;

    @Column({ type: 'int', default: 0 })
    clicks: number;

    @Column({ type: 'timestamp', nullable: true })
    startDate: Date;

    @Column({ type: 'timestamp', nullable: true })
    endDate: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
