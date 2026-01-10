import { Controller, Post, Body, Get, UseGuards } from "@nestjs/common";
import { TagsService } from "./tags.service";
import { CreateTagDto } from "./dto/create-tag.dto";
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('admin/tags')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TagsController {
    constructor(private readonly tagsService: TagsService) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.EDITOR)
    create(@Body() dto: CreateTagDto) {
        return this.tagsService.create(dto);
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.EDITOR)
    findAll() {
        return this.tagsService.findAll();
    }
}

