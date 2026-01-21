import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { CrosswordWordEntity } from './crossword-word.entity';

@Entity('crossword_daily')
export class CrosswordDailyEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'date', unique: true })
    date: string; // Formato YYYY-MM-DD

    @Column({ type: 'int', default: 12 })
    size: number;

    @Column({ type: 'json' })
    grid: string[][];

    @Column({ type: 'json' })
    solution: string[][];

    @OneToMany(() => CrosswordWordEntity, (word: CrosswordWordEntity) => word.crossword, { cascade: true })
    words: CrosswordWordEntity[];

    @CreateDateColumn()
    createdAt: Date;
}
