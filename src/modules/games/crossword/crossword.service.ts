import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrosswordDailyEntity } from './entities/crossword-daily.entity';
import { CrosswordWordEntity, CrosswordDirection } from './entities/crossword-word.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

interface AiWord {
    word: string;
    clue: string;
}

interface PlacedWord extends AiWord {
    row: number;
    col: number;
    direction: CrosswordDirection;
}

@Injectable()
export class CrosswordService {
    private readonly logger = new Logger(CrosswordService.name);
    private readonly size = 12;

    constructor(
        @InjectRepository(CrosswordDailyEntity)
        private readonly crosswordRepo: Repository<CrosswordDailyEntity>,
        @InjectRepository(CrosswordWordEntity)
        private readonly wordRepo: Repository<CrosswordWordEntity>,
        private readonly configService: ConfigService,
    ) { }

    @Cron('5 0 * * *')
    async handleDailyGeneration() {
        const today = new Date().toISOString().split('T')[0];
        this.logger.log(`Starting daily crossword generation for ${today}`);

        // Check if already exists
        const existing = await this.crosswordRepo.findOneBy({ date: today });
        if (existing) {
            this.logger.warn(`Crossword for ${today} already exists.`);
            return;
        }

        await this.generateForDate(today);
    }

    async getToday() {
        const today = new Date().toISOString().split('T')[0];
        const crossword = await this.crosswordRepo.findOne({
            where: { date: today },
            relations: ['words'],
        });

        if (!crossword) {
            // If not found, try to generate it on the fly (first time)
            return this.generateForDate(today);
        }

        return crossword;
    }

    async generateForDate(date: string) {
        this.logger.log(`Generating crossword for ${date}...`);

        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts) {
            try {
                const aiWords = await this.getWordsFromAi();
                const placedWords = this.tryGenerateGrid(aiWords);

                if (placedWords && placedWords.length >= 5) { // Lower requirement to 5 for fallback/safety
                    return await this.saveCrossword(date, placedWords);
                }
            } catch (error: any) {
                this.logger.error(`Attempt ${attempts + 1} failed: ${error.message}`);
            }
            attempts++;
        }

        throw new Error(`Failed to generate a valid crossword after ${maxAttempts} attempts`);
    }

    private async getWordsFromAi(): Promise<AiWord[]> {
        const apiKey = this.configService.get<string>('OPENAI_API_KEY');
        if (!apiKey) {
            this.logger.warn('OPENAI_API_KEY not found, using fallback words');
            return this.getFallbackWords();
        }

        try {
            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: 'Eres un experto creador de crucigramas profesionales. Tu objetivo es generar desafíos que sean precisos, sin errores de ortografía y con pistas claras pero desafiantes.'
                        },
                        {
                            role: 'user',
                            content: `Genera una lista de 15 palabras para un crucigrama de CULTURA GENERAL.
              Reglas CRÍTICAS:
              1. PALABRAS: Solo letras A-Z y Ñ. SIN espacios, SIN tildes, SIN caracteres especiales (excepto la Ñ). Verifica la ortografía.
              2. LONGITUD: Entre 3 y 10 letras.
              3. PISTAS: Deben ser PRECISAS y NO AMBIGUAS. Evita pistas que puedan referirse a múltiples palabras cortas comunes.
              4. TEMÁTICA: Geografía, Historia, Ciencia, Arte, Deportes o Actualidad Internacional.
              5. DIFICULTAD: Mezcla palabras fáciles con algunas más complejas, pero todas deben tener una respuesta única y clara.
              6. FORMATO: Devuelve UN OBJETO JSON con una propiedad "words" que sea un array de objetos con "word" y "clue".`
                        }
                    ],
                    response_format: { type: "json_object" }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log(`AI Response received. Status: ${response.status}`);
            let contentString = response.data.choices[0].message.content;
            console.log('AI RAW:', contentString);

            // Clean up markdown code blocks if the AI included them
            if (contentString.includes('```')) {
                contentString = contentString.replace(/```json|```/g, '').trim();
            }

            const content = JSON.parse(contentString);
            // Support { "words": [...] } or root array
            const rawWords = Array.isArray(content) ? content : (content.words || content.palabras || []);

            console.log(`Found ${rawWords.length} raw words from AI`);

            const processed = rawWords.map((w: any) => ({
                word: (w.word || w.palabra || '').toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-ZÑ]/g, ""),
                clue: w.clue || w.pista || ''
            })).filter((w: any) => w.word.length >= 3 && w.word.length <= this.size);

            console.log(`After filtering: ${processed.length} valid words for grid`);
            return processed;
        } catch (error: any) {
            this.logger.error('Error calling AI:', error.response?.data || error.message);
            return this.getFallbackWords();
        }
    }

    private getFallbackWords(): AiWord[] {
        return [
            { word: 'ARGENTINA', clue: 'País del campeón del mundo 2022' },
            { word: 'CÓRDOBA', clue: 'Provincia argentina famosa por el cuarteto' },
            { word: 'PERRO', clue: 'El mejor amigo del hombre' },
            { word: 'POLÍTICA', clue: 'Ciencia que trata del gobierno' },
            { word: 'DIARIO', clue: 'Publicación impresa o digital diaria' },
            { word: 'VERANO', clue: 'Estación más calurosa del año' },
            { word: 'FÚTBOL', clue: 'Deporte más popular en Argentina' },
            { word: 'HISTORIA', clue: 'Relato de hechos pasados' },
            { word: 'Música', clue: 'Arte de combinar los sonidos' },
            { word: 'ASADO', clue: 'Comida típica argentina hecha a la parrilla' },
        ];
    }

    private tryGenerateGrid(words: AiWord[]): PlacedWord[] | null {
        // Sort by length descending
        const sorted = [...words].sort((a, b) => b.word.length - a.word.length);
        const placed: PlacedWord[] = [];
        const grid = Array(this.size).fill(null).map(() => Array(this.size).fill(''));

        this.logger.log(`Starting grid generation with ${sorted.length} words`);
        // Place first word in the middle
        const first = sorted.shift()!;
        const row = Math.floor(this.size / 2);
        const col = Math.floor((this.size - first.word.length) / 2);
        this.placeWord(grid, first.word, row, col, CrosswordDirection.ACROSS);
        placed.push({ ...first, row, col, direction: CrosswordDirection.ACROSS });

        for (const aiWord of sorted) {
            const best = this.findBestPosition(grid, aiWord.word, placed);
            if (best) {
                this.placeWord(grid, aiWord.word, best.row, best.col, best.direction);
                placed.push({ ...aiWord, ...best });
            }
        }

        this.logger.log(`Grid completed with ${placed.length} words placed`);
        return placed.length >= 5 ? placed : null;
    }

    private findBestPosition(grid: string[][], word: string, placed: PlacedWord[]) {
        let bestPos = null;
        let maxIntersections = 0;

        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                for (const dir of [CrosswordDirection.ACROSS, CrosswordDirection.DOWN]) {
                    if (this.canPlace(grid, word, r, c, dir)) {
                        const intersections = this.countIntersections(grid, word, r, c, dir);
                        if (intersections > maxIntersections) {
                            maxIntersections = intersections;
                            bestPos = { row: r, col: c, direction: dir };
                        } else if (intersections === 0 && !bestPos && placed.length < 3) {
                            // Allow some early words without intersections to jumpstart if needed,
                            // but we prefer intersections.
                            bestPos = { row: r, col: c, direction: dir };
                        }
                    }
                }
            }
        }

        return (maxIntersections > 0 || bestPos) ? bestPos : null;
    }

    private canPlace(grid: string[][], word: string, row: number, col: number, dir: CrosswordDirection): boolean {
        if (dir === CrosswordDirection.ACROSS) {
            if (col + word.length > this.size) return false;
            // Check boundaries around the word
            if (col > 0 && grid[row][col - 1] !== '') return false;
            if (col + word.length < this.size && grid[row][col + word.length] !== '') return false;

            for (let i = 0; i < word.length; i++) {
                const char = grid[row][col + i];
                if (char !== '' && char !== word[i]) return false;

                // If placing vertically empty, check left/right don't have neighbors unless it's an intersection
                if (char === '') {
                    if (row > 0 && grid[row - 1][col + i] !== '') return false;
                    if (row < this.size - 1 && grid[row + 1][col + i] !== '') return false;
                }
            }
        } else {
            if (row + word.length > this.size) return false;
            if (row > 0 && grid[row - 1][col] !== '') return false;
            if (row + word.length < this.size && grid[row + word.length][col] !== '') return false;

            for (let i = 0; i < word.length; i++) {
                const char = grid[row + i][col];
                if (char !== '' && char !== word[i]) return false;

                if (char === '') {
                    if (col > 0 && grid[row + i][col - 1] !== '') return false;
                    if (col < this.size - 1 && grid[row + i][col + 1] !== '') return false;
                }
            }
        }
        return true;
    }

    private countIntersections(grid: string[][], word: string, row: number, col: number, dir: CrosswordDirection): number {
        let count = 0;
        for (let i = 0; i < word.length; i++) {
            const r = dir === CrosswordDirection.ACROSS ? row : row + i;
            const c = dir === CrosswordDirection.ACROSS ? col + i : col;
            if (grid[r][c] === word[i]) count++;
        }
        return count;
    }

    private placeWord(grid: string[][], word: string, row: number, col: number, dir: CrosswordDirection) {
        for (let i = 0; i < word.length; i++) {
            const r = dir === CrosswordDirection.ACROSS ? row : row + i;
            const c = dir === CrosswordDirection.ACROSS ? col + i : col;
            grid[r][c] = word[i];
        }
    }

    private async saveCrossword(date: string, placedWords: PlacedWord[]) {
        const grid = Array(this.size).fill(null).map(() => Array(this.size).fill(''));
        const solution = Array(this.size).fill(null).map(() => Array(this.size).fill(''));

        for (const w of placedWords) {
            this.placeWord(solution, w.word, w.row, w.col, w.direction);
        }

        const crossword = this.crosswordRepo.create({
            date,
            size: this.size,
            grid, // Empty grid for the player
            solution,
            words: placedWords.map(w => this.wordRepo.create({
                word: w.word,
                clue: w.clue,
                row: w.row,
                col: w.col,
                direction: w.direction,
            })),
        });

        return await this.crosswordRepo.save(crossword);
    }
}
