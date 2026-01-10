import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity, UserRole, AuthProvider, AvatarSource } from '../modules/users/entities/user.entity';

@Injectable()
export class SeedService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
    ) { }

    /**
     * Crea un usuario admin si no existe
     */
    async createAdminUser() {
        const adminEmail = 'admin@noticiasdelinterior.com';

        // Verificar si ya existe
        const existing = await this.userRepo.findOne({
            where: { email: adminEmail }
        });

        if (existing) {
            console.log('✅ Usuario admin ya existe');
            return existing;
        }

        // Crear hash de la contraseña
        const password = process.env.ADMIN_PASSWORD || 'admin123';
        const passwordHash = await bcrypt.hash(password, 10);

        // Crear usuario
        const admin = this.userRepo.create({
            email: adminEmail,
            name: 'Administrador',
            passwordHash,
            role: UserRole.ADMIN,
            active: true,
            emailVerified: true,
            authProvider: AuthProvider.LOCAL,
            authProviderId: 'local-admin',
            avatarSource: AvatarSource.NONE,
            locale: 'es-AR',
        });

        await this.userRepo.save(admin);

        console.log('✅ Usuario admin creado');
        console.log('   Email:', adminEmail);
        console.log('   Password:', password);
        console.log('   ⚠️  CAMBIAR LA CONTRASEÑA EN PRODUCCIÓN');

        return admin;
    }

    /**
     * Crea un usuario editor de ejemplo
     */
    async createEditorUser() {
        const editorEmail = 'editor@noticiasdelinterior.com';

        const existing = await this.userRepo.findOne({
            where: { email: editorEmail }
        });

        if (existing) {
            console.log('✅ Usuario editor ya existe');
            return existing;
        }

        const password = process.env.EDITOR_PASSWORD || 'editor123';
        const passwordHash = await bcrypt.hash(password, 10);

        const editor = this.userRepo.create({
            email: editorEmail,
            name: 'Editor',
            passwordHash,
            role: UserRole.EDITOR,
            active: true,
            emailVerified: true,
            authProvider: AuthProvider.LOCAL,
            authProviderId: 'local-editor',
            avatarSource: AvatarSource.NONE,
            locale: 'es-AR',
        });

        await this.userRepo.save(editor);

        console.log('✅ Usuario editor creado');
        console.log('   Email:', editorEmail);
        console.log('   Password:', password);

        return editor;
    }

    /**
     * Crea un usuario lector de ejemplo
     */
    async createViewerUser() {
        const viewerEmail = 'lector@noticiasdelinterior.com';

        const existing = await this.userRepo.findOne({
            where: { email: viewerEmail }
        });

        if (existing) {
            console.log('✅ Usuario lector ya existe');
            return existing;
        }

        const password = 'lector123';
        const passwordHash = await bcrypt.hash(password, 10);

        const viewer = this.userRepo.create({
            email: viewerEmail,
            name: 'Lector de Prueba',
            passwordHash,
            role: UserRole.AUTHOR, // Mappeado a viewer en el frontend
            active: true,
            emailVerified: true,
            authProvider: AuthProvider.LOCAL,
            authProviderId: 'local-viewer',
            avatarSource: AvatarSource.NONE,
            locale: 'es-AR',
        });

        await this.userRepo.save(viewer);

        console.log('✅ Usuario lector creado');
        console.log('   Email:', viewerEmail);
        console.log('   Password:', password);

        return viewer;
    }

    /**
     * Ejecuta todos los seeds
     */
    async runAll() {
        console.log('🌱 Iniciando seeds...\n');

        await this.createAdminUser();
        await this.createEditorUser();
        await this.createViewerUser();

        console.log('\n✅ Seeds completados');
    }
}
