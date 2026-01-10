import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

export enum UserRole {
    ADMIN = 'ADMIN',
    EDITOR = 'EDITOR',
    AUTHOR = 'AUTHOR',
}

export enum AvatarSource {
    GOOGLE = 'google',
    CUSTOM = 'custom',
    NONE = 'none',
}

export enum AuthProvider {
    LOCAL = 'local',
    GOOGLE = 'google',
}

@Entity('users')
@Index('uq_users_email', ['email'], { unique: true })
@Index('idx_users_auth_provider_id', ['authProviderId'])
@Index('uq_users_external', ['externalSource', 'externalId'], { unique: true })
export class UserEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    email: string;

    @Column({ length: 100, nullable: true })
    username?: string;

    @Column({ length: 150, nullable: true })
    name?: string;

    @Column({ nullable: true, select: false })
    passwordHash?: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.EDITOR,
    })
    role: UserRole;

    @Column({ default: true })
    active: boolean;

    @Column({ default: false })
    emailVerified: boolean;

    @Column()
    authProvider: AuthProvider;

    @Column()
    authProviderId: string;

    @Column({ nullable: true })
    avatarUrl?: string;

    @Column({
        type: 'enum',
        enum: AvatarSource,
        default: AvatarSource.NONE,
    })
    avatarSource: AvatarSource;

    @Column({ nullable: true, type: 'text' })
    bio?: string;

    @Column({ default: 'es-AR' })
    locale: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ nullable: true })
    lastLoginAt?: Date;

    @Column({ type: 'varchar', length: 64, nullable: true, comment: 'ID del sistema de origen' })
    externalId?: string;

    @Column({ type: 'varchar', length: 50, nullable: true, comment: 'Origen externo (ej: wordpress)' })
    externalSource?: string;
}
