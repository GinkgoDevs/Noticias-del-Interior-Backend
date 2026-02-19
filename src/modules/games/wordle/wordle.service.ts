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

        const fallbacks = [
            { word: 'AXIOMA', clue: 'Proposición tan clara que no necesita demostración.' },
            { word: 'UBICUO', clue: 'Que está presente en todas partes al mismo tiempo.' },
            { word: 'EFIMERO', clue: 'Que dura muy poco tiempo.' },
            { word: 'ETEREO', clue: 'Extremadamente delicado y ligero, algo fuera de este mundo.' },
            { word: 'PETRICOR', clue: 'El olor a tierra mojada después de la lluvia.' },
            { word: 'NEFELIBA', clue: 'Persona soñadora que no se apercibe de la realidad.' },
            { word: 'ATARAXIA', clue: 'Estado de ánimo sereno y equilibrado.' },
            { word: 'INEFABLE', clue: 'Algo tan increíble que no puede ser expresado con palabras.' },
            { word: 'MELIFLUO', clue: 'Un sonido suave y dulce como la miel.' },
            { word: 'SERENDIPIA', clue: 'Hallazgo afortunado e inesperado.' },
            { word: 'ALBEDRIO', clue: 'Potestad de obrar por reflexión y elección.' },
            { word: 'BOHEMIO', clue: 'Que lleva una vida libre y poco organizada.' },
            { word: 'CANDIDEZ', clue: 'Sencillez, ingenuidad y falta de malicia.' },
            { word: 'DELEITE', clue: 'Placer o satisfacción espiritual o física.' },
            { word: 'ELOCUENTE', clue: 'Que habla con fluidez y propiedad para convencer.' },
            { word: 'FASCINAR', clue: 'Atraer irresistiblemente.' },
            { word: 'GENUINO', clue: 'Puro, auténtico, sin mezcla ni falsificación.' },
            { word: 'HECHIZO', clue: 'Atractivo misterioso o fascinante.' },
            { word: 'IDILICO', clue: 'Agradable, hermoso y placentero.' },
            { word: 'JACARANDA', clue: 'Árbol ornamental de flores violáceas.' },
            { word: 'KILOVATIO', clue: 'Unidad de potencia eléctrica.' },
            { word: 'LABERINTO', clue: 'Lugar formado por calles y encrucijadas, difícil de salir.' },
            { word: 'MIRADA', clue: 'Acción de observar o dirigir la vista.' },
            { word: 'NOSTALGIA', clue: 'Pena de verse ausente de la patria o de los deudos.' },
            { word: 'ONIRICO', clue: 'Perteneciente o relativo a los sueños.' },
            { word: 'PARADOJA', clue: 'Dicho o hecho que parece contrario a la lógica.' },
            { word: 'QUIMERA', clue: 'Sueño o ilusión que es producto de la imaginación.' },
            { word: 'RESILIENCIA', clue: 'Capacidad de adaptación frente a un agente perturbador.' },
            { word: 'SOLEDAD', clue: 'Carencia voluntaria o circunstancial de compañía.' },
            { word: 'TRASCENDER', clue: 'Empezar a conocerse algo que estaba oculto.' }
        ];

        const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        let word = randomFallback.word;
        let clue = randomFallback.clue;

        const geminiKey = this.configService.get<string>('GEMINI_API_KEY') || this.configService.get<string>('GOOGLE_API_KEY');

        if (geminiKey) {
            // Intentar varios modelos en orden de probabilidad de ser gratuitos/activos
            const models = ['gemini-2.0-flash-lite', 'gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-pro'];
            let success = false;

            for (const model of models) {
                if (success) break;
                try {
                    this.logger.log(`Trying to generate Wordle with Gemini model: ${model}...`);
                    const response = await axios.post(
                        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
                        {
                            contents: [{
                                parts: [{
                                    text: 'Genera una palabra de exactamente 5 a 8 letras en ESPAÑOL que sea desafiante (poco común o de nivel de cultura general avanzado). Sin tildes, sin espacios. También proporciona una pista breve pero críptica o técnica. IMPORTANTE: Evita palabras extremadamente comunes como "MESA" o "LIBRO". Devuelve ÚNICAMENTE un objeto JSON con este formato: { "word": "XXXXX", "clue": "..." }'
                                }]
                            }]
                        },
                        { timeout: 10000 }
                    );

                    let text = response.data.candidates[0].content.parts[0].text;
                    text = text.replace(/```json|```/g, '').trim();
                    const content = JSON.parse(text);
                    word = content.word.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-ZÑ]/g, "");
                    clue = content.clue;
                    this.logger.log(`Successfully generated word using Gemini (${model}): ${word}`);
                    success = true;
                } catch (error: any) {
                    const status = error.response?.status;
                    this.logger.warn(`Model ${model} failed (Status: ${status}).`);
                }
            }
        } else {
            this.logger.warn('No Gemini/Google API key found, using randomized fallback word');
        }

        const entity = this.wordleRepo.create({
            date,
            word,
            clue,
        });

        return await this.wordleRepo.save(entity);
    }
}
