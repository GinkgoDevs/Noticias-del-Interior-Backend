// src/modules/categories/category.service.ts
import {
    Injectable,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import slugify from 'slugify';

import { CategoryEntity } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
    constructor(
        @InjectRepository(CategoryEntity)
        private readonly categoryRepository: Repository<CategoryEntity>,
    ) { }

    // -------------------------
    // CREATE
    // -------------------------
    async create(dto: CreateCategoryDto): Promise<CategoryEntity> {
        const slug = this.generateSlug(dto.name);

        const exists = await this.categoryRepository.findOne({
            where: { slug },
        });

        if (exists) {
            throw new ConflictException('Category slug already exists');
        }

        const category = this.categoryRepository.create({
            ...dto,
            slug,
        });

        return this.categoryRepository.save(category);
    }

    // -------------------------
    // FIND ALL (ADMIN / PUBLIC)
    // -------------------------
    async findAll(includeInactive = false): Promise<CategoryEntity[]> {
        return this.categoryRepository.find({
            where: includeInactive ? {} : { active: true },
            relations: ['news'],
            order: {
                sortOrder: 'ASC',
                name: 'ASC',
            },
        });
    }

    async remove(id: string): Promise<void> {
        const category = await this.findById(id);
        await this.categoryRepository.remove(category);
    }

    // -------------------------
    // FIND ONE
    // -------------------------
    async findById(id: string): Promise<CategoryEntity> {
        const category = await this.categoryRepository.findOne({
            where: { id },
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        return category;
    }

    async findBySlug(slug: string): Promise<CategoryEntity> {
        const category = await this.categoryRepository.findOne({
            where: { slug: slug.trim().toLowerCase() }, // Normalizar input
        });

        if (!category) {
            throw new NotFoundException(`Category with slug '${slug}' not found`);
        }

        return category;
    }

    // -------------------------
    // UPDATE
    // -------------------------
    async update(
        id: string,
        dto: UpdateCategoryDto,
    ): Promise<CategoryEntity> {
        const category = await this.findById(id);

        // Si cambia el nombre → regenerar slug
        if (dto.name && dto.name !== category.name) {
            const newSlug = this.generateSlug(dto.name);

            const exists = await this.categoryRepository.findOne({
                where: { slug: newSlug },
            });

            if (exists && exists.id !== id) {
                throw new ConflictException('Category slug already exists');
            }

            category.slug = newSlug;
        }

        Object.assign(category, dto);

        return this.categoryRepository.save(category);
    }

    // -------------------------
    // ACTIVATE / DEACTIVATE
    // -------------------------
    async setActive(id: string, active: boolean): Promise<CategoryEntity> {
        const category = await this.findById(id);
        category.active = active;
        return this.categoryRepository.save(category);
    }

    // -------------------------
    // HELPERS
    // -------------------------
    private generateSlug(text: string): string {
        return slugify(text, {
            lower: true,
            strict: true,
            locale: 'es',
            trim: true,
        });
    }
}
