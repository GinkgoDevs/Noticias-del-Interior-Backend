import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TagEntity } from './entities/tag.entity';
import { Repository } from 'typeorm';
import { CreateTagDto } from './dto/create-tag.dto';

@Injectable()
export class TagsService {
    constructor(
        @InjectRepository(TagEntity)
        private readonly tagRepo: Repository<TagEntity>,
    ) { }

    create(dto: CreateTagDto) {
        const tag = this.tagRepo.create(dto);
        return this.tagRepo.save(tag);
    }

    findAll() {
        return this.tagRepo.find({ where: { active: true } });
    }
}
