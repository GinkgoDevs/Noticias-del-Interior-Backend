import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { CrosswordDailyEntity } from './crossword-daily.entity';

export enum CrosswordDirection {
    ACROSS = 'ACROSS',
    DOWN = 'DOWN',
}

@Entity('crossword_words')
export class CrosswordWordEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => CrosswordDailyEntity, (crossword) => crossword.words, { onDelete: 'CASCADE' })
    crossword: CrosswordDailyEntity;

    @Column()
    word: string;

    @Column({ type: 'text' })
    clue: string;

    @Column({ type: 'int' })
    row: number;

    @Column({ type: 'int' })
    col: number;

    @Column({ type: 'enum', enum: CrosswordDirection, default: CrosswordDirection.ACROSS })
    direction: CrosswordDirection;

    @Column({ default: 'media' })
    difficulty: string;
}
