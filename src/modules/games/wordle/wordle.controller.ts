import { Controller, Get } from '@nestjs/common';
import { WordleService } from './wordle.service';

@Controller('games/wordle')
export class WordleController {
    constructor(private readonly wordleService: WordleService) { }

    @Get('today')
    async getToday() {
        const data = await this.wordleService.getToday();
        return { success: true, data };
    }
}
