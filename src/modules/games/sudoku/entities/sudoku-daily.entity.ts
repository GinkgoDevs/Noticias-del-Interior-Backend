import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('sudoku_daily')
export class SudokuDailyEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'date', unique: true })
    date: string; // Formato YYYY-MM-DD

    @Column({ type: 'json' })
    puzzle: number[][];

    @Column({ type: 'json' })
    solution: number[][];

    @Column({ type: 'varchar', default: 'medium' })
    difficulty: string;

    @CreateDateColumn()
    createdAt: Date;
}
