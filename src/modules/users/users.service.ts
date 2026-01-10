import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, UserRole, AuthProvider } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly usersRepo: Repository<UserEntity>,
    ) { }

    async create(data: any): Promise<UserEntity> {
        const existing = await this.findByEmail(data.email);
        if (existing) {
            throw new BadRequestException('Email already in use');
        }

        const passwordHash = await bcrypt.hash(data.password, 10);

        // Simple mapping for frontend roles
        let role = UserRole.EDITOR;
        if (data.role === 'admin') role = UserRole.ADMIN;
        if (data.role === 'viewer') role = UserRole.AUTHOR;

        const user = this.usersRepo.create({
            email: data.email,
            name: data.fullName,
            passwordHash,
            role,
            authProvider: AuthProvider.LOCAL,
            authProviderId: 'local', // dummy for local
        });

        return this.usersRepo.save(user);
    }

    async findAll(): Promise<any[]> {
        const users = await this.usersRepo.find({
            order: { createdAt: 'DESC' },
        });

        return users.map(user => {
            let role: string = 'redactor';
            if (user.role === UserRole.ADMIN) role = 'admin';
            if (user.role === UserRole.AUTHOR) role = 'viewer';

            return {
                ...user,
                role,
                fullName: user.name,
            };
        });
    }

    async remove(id: string): Promise<void> {
        const user = await this.findById(id);
        await this.usersRepo.remove(user);
    }

    async updateRole(id: string, role: string): Promise<void> {
        const user = await this.findById(id);

        let newRole = UserRole.EDITOR;
        if (role === 'admin') newRole = UserRole.ADMIN;
        if (role === 'viewer') newRole = UserRole.AUTHOR;

        user.role = newRole;
        await this.usersRepo.save(user);
    }

    async findById(id: string): Promise<UserEntity> {
        const user = await this.usersRepo.findOneBy({ id });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }

    async findByEmail(email: string): Promise<UserEntity | null> {
        return this.usersRepo.findOneBy({ email });
    }
}
