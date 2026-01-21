import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('wordle_daily')
export class WordleDailyEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'date', unique: true })
    date: string; // Formato YYYY-MM-DD

    @Column({ type: 'varchar', length: 5 })
    word: string;

    @Column({ type: 'text', nullable: true })
    clue: string;

    @CreateDateColumn()
    createdAt: Date;
}
