import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrosswordDailyEntity } from './crossword/entities/crossword-daily.entity';
import { CrosswordWordEntity } from './crossword/entities/crossword-word.entity';
import { CrosswordService } from './crossword/crossword.service';
import { CrosswordController } from './crossword/crossword.controller';
import { SudokuDailyEntity } from './sudoku/entities/sudoku-daily.entity';
import { SudokuService } from './sudoku/sudoku.service';
import { SudokuController } from './sudoku/sudoku.controller';
import { WordleDailyEntity } from './wordle/entities/wordle-daily.entity';
import { WordleService } from './wordle/wordle.service';
import { WordleController } from './wordle/wordle.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            CrosswordDailyEntity,
            CrosswordWordEntity,
            SudokuDailyEntity,
            WordleDailyEntity
        ]),
    ],
    providers: [CrosswordService, SudokuService, WordleService],
    controllers: [CrosswordController, SudokuController, WordleController],
    exports: [CrosswordService, SudokuService, WordleService],
})
export class GamesModule { }
