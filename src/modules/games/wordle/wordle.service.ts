import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WordleDailyEntity } from './entities/wordle-daily.entity';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WordleService {
    private readonly logger = new Logger(WordleService.name);

    constructor(
        @InjectRepository(WordleDailyEntity)
        private readonly wordleRepo: Repository<WordleDailyEntity>,
        private readonly configService: ConfigService,
    ) { }

    @Cron('0 0 * * *')
    async handleDailyGeneration() {
        const today = new Date().toISOString().split('T')[0];
        const existing = await this.wordleRepo.findOneBy({ date: today });
        if (existing) return;

        await this.generateForDate(today);
    }

    async getToday() {
        const today = new Date().toISOString().split('T')[0];
        let wordle = await this.wordleRepo.findOneBy({ date: today });

        if (!wordle) {
            wordle = await this.generateForDate(today);
        }

        return wordle;
    }

    async generateForDate(date: string) {
        this.logger.log(`Generating Wordle for ${date} using AI...`);

        let word = 'LIBRO';
        let clue = 'Objeto con hojas para leer';

        const apiKey = this.configService.get<string>('OPENAI_API_KEY');
        if (apiKey) {
            try {
                const response = await axios.post(
                    'https://api.openai.com/v1/chat/completions',
                    {
                        model: 'gpt-4o-mini',
                        messages: [
                            {
                                role: 'system',
                                content: 'Eres un experto en juegos de palabras. Genera una palabra de 5 letras en español para Wordle.'
                            },
                            {
                                role: 'user',
                                content: 'Genera una palabra de exactamente 5 letras en ESPAÑOL. Sin tildes, sin espacios. También proporciona una pista muy breve. Devuelve JSON: { "word": "XXXXX", "clue": "..." }'
                            }
                        ],
                        response_format: { type: "json_object" }
                    },
                    {
                        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
                    }
                );
                const content = JSON.parse(response.data.choices[0].message.content);
                word = content.word.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-ZÑ]/g, "");
                clue = content.clue;
            } catch (error: any) {
                this.logger.error('Error generating AI Wordle:', error.message);
            }
        }

        const entity = this.wordleRepo.create({
            date,
            word: word.slice(0, 5),
            clue,
        });

        return await this.wordleRepo.save(entity);
    }
}
