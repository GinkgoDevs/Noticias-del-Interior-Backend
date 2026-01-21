import { Controller, Get } from '@nestjs/common';
import { SudokuService } from './sudoku.service';

@Controller('games/sudoku')
export class SudokuController {
    constructor(private readonly sudokuService: SudokuService) { }

    @Get('today')
    async getToday() {
        const data = await this.sudokuService.getToday();
        return { success: true, data };
    }
}
