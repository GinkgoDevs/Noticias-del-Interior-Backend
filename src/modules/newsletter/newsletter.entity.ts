import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('newsletter_subscriptions')
export class NewsletterEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @CreateDateColumn()
    subscribedAt: Date;

    @Column({ default: true })
    isActive: boolean;
}
