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
    private readonly size = 15; // Aumentado para un formato profesional de 15x15

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
                this.logger.log(`Generation attempt ${attempts + 1}...`);
                const aiWords = await this.getWordsFromAi();
                const isFallback = aiWords.length > 45; // El fallback tiene 50+ palabras, los resultados de AI suelen ser ~45 o menos si hay filtros

                // Intentamos varias veces con la misma lista de palabras pero diferentes órdenes/semillas
                for (let seedIdx = 0; seedIdx < 15; seedIdx++) {
                    const placedWords = this.tryGenerateGrid(aiWords, seedIdx);

                    // Flexibilidad total: si estamos en el último intento o última semilla del fallback,
                    // bajamos el requisito al mínimo posible para que el usuario pueda jugar.
                    let minRequired = isFallback ? 14 : 18;
                    if (seedIdx > 12) minRequired = isFallback ? 8 : 12;

                    if (placedWords && placedWords.length >= minRequired) {
                        return await this.saveCrossword(date, placedWords);
                    }
                }
            } catch (error: any) {
                this.logger.error(`Attempt ${attempts + 1} failed: ${error.message}`);
            }
            attempts++;
        }

        throw new Error(`Failed to generate a valid crossword after ${maxAttempts} attempts`);
    }

    private async getWordsFromAi(): Promise<AiWord[]> {
        const geminiKey = this.configService.get<string>('GEMINI_API_KEY') || this.configService.get<string>('GOOGLE_API_KEY');

        if (geminiKey) {
            const models = ['gemini-2.0-flash-lite', 'gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-pro'];

            for (const model of models) {
                try {
                    this.logger.log(`Attempting to fetch words from Gemini model: ${model}...`);
                    const prompt = `Genera una lista de 45 palabras para un crucigrama de CULTURA GENERAL de ALTA DIFICULTAD en ESPAÑOL.
                Reglas CRÍTICAS:
                1. PALABRAS: Solo letras A-Z y Ñ. SIN espacios, SIN tildes.
                2. LONGITUD: Mix variado: 10 palabras de 3-4 letras, 20 de 5-7 letras, 15 de 8-12 letras.
                3. PISTAS: Desafiantes, estilo académico o enciclopédico.
                4. TEMÁTICA: Historia, Ciencia, Arte, Geografía Universal, Literatura.
                5. FORMATO: JSON con propiedad "words" que sea un array de objetos con "word" y "clue".`;

                    const response = await axios.post(
                        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
                        {
                            contents: [{
                                parts: [{ text: prompt }]
                            }]
                        }
                    );

                    let text = response.data.candidates[0].content.parts[0].text;
                    text = text.replace(/```json|```/g, '').trim();
                    const content = JSON.parse(text);
                    const rawWords = Array.isArray(content) ? content : (content.words || content.palabras || []);

                    this.logger.log(`Received ${rawWords.length} words from Gemini (${model}).`);

                    return rawWords.map((w: any) => ({
                        word: (w.word || w.palabra || '').toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-ZÑ]/g, ""),
                        clue: w.clue || w.pista || ''
                    })).filter((w: any) => w.word.length >= 3 && w.word.length <= this.size);
                } catch (error: any) {
                    this.logger.warn(`Model ${model} failed (Status: ${error.response?.status}).`);
                }
            }
        }

        this.logger.warn('All Gemini models failed or no API key, using shuffled fallback words');
        return this.shuffleFallbackWords(this.getFallbackWords());
    }

    private shuffleFallbackWords(words: AiWord[]): AiWord[] {
        return [...words].sort(() => Math.random() - 0.5);
    }

    private getFallbackWords(): AiWord[] {
        return [
            { word: 'PERIPECIA', clue: 'En el drama o en la vida real, cambio repentino de situación.' },
            { word: 'EPÍTOME', clue: 'Resumen o compendio de una obra extensa.' },
            { word: 'BIÓSFERA', clue: 'Sistema formado por el conjunto de los seres vivos del planeta.' },
            { word: 'EPISTEME', clue: 'En la filosofía de Platón, el saber verdadero.' },
            { word: 'NICOSIA', clue: 'Capital de la República de Chipre.' },
            { word: 'ESTUARIO', clue: 'Tramo de un río de gran anchura y caudal que desemboca en el mar.' },
            { word: 'GORGONA', clue: 'En la mitología griega, monstruo femenino con serpientes por cabello.' },
            { word: 'RENACER', clue: 'Volver a adquirir importancia o vigencia.' },
            { word: 'QUIMERA', clue: 'Aquello que se propone a la imaginación como posible pero que no lo es.' },
            { word: 'MECENAS', clue: 'Persona que patrocina las letras o las artes.' },
            { word: 'PANTALÁN', clue: 'Muelle estrecho para el atraque de embarcaciones deportivas.' },
            { word: 'BALUARTE', clue: 'Obra de fortificación de figura pentagonal.' },
            { word: 'SINERGIA', clue: 'Acción de dos o más causas cuyo efecto es superior a la suma de efectos individuales.' },
            { word: 'ONÍRICO', clue: 'Perteneciente o relativo a los sueños.' },
            { word: 'ALBACEA', clue: 'Persona encargada por el testador para cumplir su última voluntad.' },
            { word: 'ESTOICO', clue: 'Fuerte, ecuánime ante la desgracia.' },
            { word: 'LITURGIA', clue: 'Orden y forma de las ceremonias religiosas.' },
            { word: 'PALEONTÓLOGO', clue: 'Científico que estudia los organismos fósiles.' },
            { word: 'HEGELIANO', clue: 'Seguidor de la filosofía de Hegel.' },
            { word: 'DIATRIBA', clue: 'Discurso o escrito violento e injurioso contra alguien o algo.' },
            { word: 'ACRÓNIMO', clue: 'Tipo de sigla que se pronuncia como una palabra.' },
            { word: 'NÉMESIS', clue: 'Vengador de las injusticias, o enemigo irreconciliable.' },
            { word: 'SOLILOQUIO', clue: 'Discurso que mantiene una persona consigo misma.' },
            { word: 'PARADIGMA', clue: 'Ejemplo o modelo que sirve de norma en una disciplina.' },
            { word: 'OSTRACISMO', clue: 'Aislamiento voluntario o forzoso de la vida pública.' },
            { word: 'PLETÓRICO', clue: 'Que tiene gran abundancia de algo, especialmente de alegría o salud.' },
            { word: 'METÁFORA', clue: 'Tropo consistente en trasladar el sentido recto de las voces a otro figurado.' },
            { word: 'ANALOGÍA', clue: 'Relación de semejanza entre cosas distintas.' },
            { word: 'HEDONISMO', clue: 'Teoría que establece el placer como fin de la vida.' },
            { word: 'EMPIRISMO', clue: 'Sistema filosófico que basa el conocimiento en la experiencia.' },
            { word: 'RETÓRICA', clue: 'Arte de bien decir, de dar al lenguaje eficacia para deleitar o conmover.' },
            { word: 'ASTRONOMÍA', clue: 'Ciencia que trata de los astros.' },
            { word: 'MITOLOGÍA', clue: 'Conjunto de mitos de un pueblo o cultura.' },
            { word: 'ICONOCLASTA', clue: 'Que rechaza el culto a las imágenes sagradas.' },
            { word: 'SARCASMO', clue: 'Burla sangrienta, ironía mordaz y cruel.' },
            { word: 'UTOPÍA', clue: 'Plan, proyecto o sistema optimista que aparece como irrealizable.' },
            { word: 'SUR', clue: 'Punto cardinal opuesto al norte.' },
            { word: 'LUZ', clue: 'Agente físico que hace visibles los objetos.' },
            { word: 'SAL', clue: 'Sustancia blanca y cristalina, muy soluble en agua.' },
            { word: 'REY', clue: 'Monarca o soberano de un reino.' },
            { word: 'ORO', clue: 'Elemento químico metálico de color amarillo, muy dúctil y maleable.' },
            { word: 'ROMA', clue: 'Capital de Italia.' },
            { word: 'ARTE', clue: 'Manifestación de la actividad humana mediante la cual se expresa una visión personal.' },
            { word: 'MAR', clue: 'Masa de agua salada que cubre la mayor parte de la superficie de la tierra.' },
            { word: 'ÉTICA', clue: 'Recto, conforme a la moral.' },
            { word: 'SIGLO', clue: 'Período de cien años.' },
            { word: 'MUNDO', clue: 'Conjunto de todo lo existente.' },
            { word: 'CIELO', clue: 'Esfera aparente azul que rodea la tierra.' },
            { word: 'URSS', clue: 'Antiguo estado federal de Eurasia (sigla).' },
            { word: 'ONU', clue: 'Organización de las Naciones Unidas (sigla).' },
        ];
    }

    private tryGenerateGrid(words: AiWord[], seedIndex: number): PlacedWord[] | null {
        // Sort by length descending, but we might want to skip some for different seeds
        let sorted = [...words].sort((a, b) => b.word.length - a.word.length);

        // En cada semilla, rotamos la primera palabra para variar la estructura inicial
        if (seedIndex > 0 && sorted.length > seedIndex) {
            const [item] = sorted.splice(seedIndex, 1);
            sorted.unshift(item);
        }

        const placed: PlacedWord[] = [];
        const grid = Array(this.size).fill(null).map(() => Array(this.size).fill(''));

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

        return placed;
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
