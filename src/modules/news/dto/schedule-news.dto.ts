import { IsDateString } from 'class-validator';

export class ScheduleNewsDto {
    @IsDateString()
    scheduledAt: string;
}
