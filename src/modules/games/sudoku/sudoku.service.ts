import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SudokuDailyEntity } from './entities/sudoku-daily.entity';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class SudokuService {
    private readonly logger = new Logger(SudokuService.name);

    constructor(
        @InjectRepository(SudokuDailyEntity)
        private readonly sudokuRepo: Repository<SudokuDailyEntity>,
    ) { }

    @Cron('0 0 * * *')
    async handleDailyGeneration() {
        const today = new Date().toISOString().split('T')[0];
        const existing = await this.sudokuRepo.findOneBy({ date: today });
        if (existing) return;

        await this.generateForDate(today);
    }

    async getToday() {
        const today = new Date().toISOString().split('T')[0];
        let sudoku = await this.sudokuRepo.findOneBy({ date: today });

        if (!sudoku) {
            sudoku = await this.generateForDate(today);
        }

        return sudoku;
    }

    async generateForDate(date: string) {
        this.logger.log(`Generating Sudoku for ${date}...`);

        const difficulty = 'medium';
        const { puzzle, solution } = this.createSudoku(difficulty);

        const entity = this.sudokuRepo.create({
            date,
            puzzle,
            solution,
            difficulty,
        });

        return await this.sudokuRepo.save(entity);
    }

    private createSudoku(difficulty: string) {
        const solution = Array(9).fill(null).map(() => Array(9).fill(0));
        this.solveSudoku(solution);

        const puzzle = solution.map(row => [...row]);
        const cellsToRemove = difficulty === "easy" ? 30 : difficulty === "medium" ? 40 : 50;

        let removed = 0;
        while (removed < cellsToRemove) {
            const row = Math.floor(Math.random() * 9);
            const col = Math.floor(Math.random() * 9);
            if (puzzle[row][col] !== 0) {
                puzzle[row][col] = 0;
                removed++;
            }
        }

        return { puzzle, solution };
    }

    private solveSudoku(grid: number[][]): boolean {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (grid[row][col] === 0) {
                    const numbers = this.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
                    for (const num of numbers) {
                        if (this.isValid(grid, row, col, num)) {
                            grid[row][col] = num;
                            if (this.solveSudoku(grid)) return true;
                            grid[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    private isValid(grid: number[][], row: number, col: number, num: number): boolean {
        for (let x = 0; x < 9; x++) {
            if (grid[row][x] === num) return false;
            if (grid[x][col] === num) return false;
        }
        const startRow = row - (row % 3);
        const startCol = col - (col % 3);
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (grid[i + startRow][j + startCol] === num) return false;
            }
        }
        return true;
    }

    private shuffle(array: number[]) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
}
