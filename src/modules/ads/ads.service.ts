import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, IsNull, Or } from 'typeorm';
import { AdEntity, AdPosition } from './entities/ad.entity';
import { CreateAdDto, UpdateAdDto } from './dto/create-ad.dto';

@Injectable()
export class AdsService {
    constructor(
        @InjectRepository(AdEntity)
        private readonly adRepo: Repository<AdEntity>,
    ) { }

    async create(createAdDto: CreateAdDto) {
        const ad = this.adRepo.create(createAdDto);
        return await this.adRepo.save(ad);
    }

    async findAll() {
        return await this.adRepo.find({
            order: { createdAt: 'DESC' },
        });
    }

    async findActive(position?: AdPosition) {
        const now = new Date();
        const query = this.adRepo.createQueryBuilder('ad')
            .where('ad.isActive = :isActive', { isActive: true });

        if (position) {
            query.andWhere('ad.position = :position', { position });
        }

        // Filter by dates if they exist
        query.andWhere(
            '(ad.startDate IS NULL OR ad.startDate <= :now) AND (ad.endDate IS NULL OR ad.endDate >= :now)',
            { now }
        );

        return await query.orderBy('RANDOM()').getMany();
    }

    async findOne(id: string) {
        const ad = await this.adRepo.findOneBy({ id });
        if (!ad) throw new NotFoundException('Publicidad no encontrada');
        return ad;
    }

    async update(id: string, updateAdDto: UpdateAdDto) {
        const ad = await this.findOne(id);
        Object.assign(ad, updateAdDto);
        return await this.adRepo.save(ad);
    }

    async remove(id: string) {
        const ad = await this.findOne(id);
        return await this.adRepo.remove(ad);
    }

    async recordView(id: string) {
        return await this.adRepo.increment({ id }, 'views', 1);
    }

    async recordClick(id: string) {
        return await this.adRepo.increment({ id }, 'clicks', 1);
    }
}
