# 💡 Ejemplos Prácticos de Uso

## 🔐 Autenticación

### Ejemplo 1: Proteger un controlador completo
```typescript
import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../auth';

@Controller('admin/something')
@UseGuards(JwtAuthGuard, RolesGuard)  // Todos los endpoints requieren auth
export class SomethingController {
  // Todos los métodos están protegidos
}
```

### Ejemplo 2: Proteger endpoints específicos
```typescript
import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, Roles } from '../auth';
import { UserRole } from '../users/entities/user.entity';

@Controller('posts')
export class PostsController {
  
  @Get()  // Público
  findAll() {
    return this.postsService.findAll();
  }

  @Post()  // Solo autenticados
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreatePostDto) {
    return this.postsService.create(dto);
  }

  @Delete(':id')  // Solo ADMIN
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  delete(@Param('id') id: string) {
    return this.postsService.delete(id);
  }
}
```

---

## 👤 Obtener Usuario Autenticado

### Ejemplo 3: Usar @CurrentUser()
```typescript
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser } from '../auth';
import { UserEntity } from '../users/entities/user.entity';

@Controller('posts')
export class PostsController {
  
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() dto: CreatePostDto,
    @CurrentUser() user: UserEntity,  // Usuario del token
  ) {
    console.log('Usuario autenticado:', user.email);
    console.log('Rol:', user.role);
    console.log('ID:', user.id);
    
    return this.postsService.create({
      ...dto,
      authorId: user.id,  // Usar el ID real del usuario
    });
  }
}
```

### Ejemplo 4: Validar permisos manualmente
```typescript
import { Controller, Patch, Param, Body, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser } from '../auth';
import { UserEntity, UserRole } from '../users/entities/user.entity';

@Controller('posts')
export class PostsController {
  
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
    @CurrentUser() user: UserEntity,
  ) {
    const post = await this.postsService.findOne(id);
    
    // Solo el autor o un ADMIN pueden editar
    if (post.authorId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('No tienes permiso para editar este post');
    }
    
    return this.postsService.update(id, dto);
  }
}
```

---

## 🎭 Roles y Permisos

### Ejemplo 5: Múltiples roles permitidos
```typescript
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.EDITOR)  // ADMIN o EDITOR
async create(@Body() dto: CreateDto) {
  // Solo ADMIN y EDITOR pueden acceder
}
```

### Ejemplo 6: Rol único
```typescript
@Delete(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)  // Solo ADMIN
async delete(@Param('id') id: string) {
  // Solo ADMIN puede eliminar
}
```

### Ejemplo 7: Diferentes permisos por método
```typescript
@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriesController {
  
  @Get()
  @Roles(UserRole.ADMIN, UserRole.EDITOR)  // Lectura: ADMIN y EDITOR
  findAll() {
    return this.categoriesService.findAll();
  }

  @Post()
  @Roles(UserRole.ADMIN)  // Escritura: Solo ADMIN
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }
}
```

---

## 🔄 Servicios

### Ejemplo 8: Usar el usuario en un servicio
```typescript
// posts.controller.ts
@Post()
@UseGuards(JwtAuthGuard)
async create(
  @Body() dto: CreatePostDto,
  @CurrentUser() user: UserEntity,
) {
  return this.postsService.create(dto, user);
}

// posts.service.ts
@Injectable()
export class PostsService {
  async create(dto: CreatePostDto, user: UserEntity) {
    const post = this.postRepo.create({
      ...dto,
      authorId: user.id,
      authorName: user.name,
      createdAt: new Date(),
    });
    
    return this.postRepo.save(post);
  }
}
```

---

## 🌐 Frontend Integration

### Ejemplo 9: Login desde el frontend
```typescript
// React/Next.js example
async function login(email: string, password: string) {
  const response = await fetch('http://localhost:3000/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  
  if (response.ok) {
    // Guardar token
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  } else {
    throw new Error(data.message);
  }
}
```

### Ejemplo 10: Hacer requests autenticados
```typescript
// React/Next.js example
async function createPost(postData) {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('http://localhost:3000/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,  // Agregar token
    },
    body: JSON.stringify(postData),
  });

  return response.json();
}
```

### Ejemplo 11: Interceptor de Axios
```typescript
// axios-config.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

// Agregar token automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 🧪 Testing

### Ejemplo 12: Test de endpoint protegido
```typescript
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';

describe('PostsController', () => {
  let app;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    jwtService = moduleRef.get<JwtService>(JwtService);
    await app.init();
  });

  it('POST /posts - debe requerir autenticación', async () => {
    return request(app.getHttpServer())
      .post('/posts')
      .send({ title: 'Test' })
      .expect(401);  // Unauthorized
  });

  it('POST /posts - debe funcionar con token válido', async () => {
    const token = jwtService.sign({
      sub: 'user-id',
      email: 'test@example.com',
      role: 'EDITOR',
    });

    return request(app.getHttpServer())
      .post('/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Post' })
      .expect(201);
  });
});
```

---

## 🔧 Casos de Uso Avanzados

### Ejemplo 13: Guard personalizado
```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class IsOwnerGuard implements CanActivate {
  async canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceId = request.params.id;

    // Verificar si el usuario es el dueño del recurso
    const resource = await this.resourceService.findOne(resourceId);
    
    return resource.ownerId === user.id || user.role === UserRole.ADMIN;
  }
}

// Uso
@Patch(':id')
@UseGuards(JwtAuthGuard, IsOwnerGuard)
async update(@Param('id') id: string, @Body() dto: UpdateDto) {
  // Solo el dueño o ADMIN pueden editar
}
```

### Ejemplo 14: Decorador personalizado para permisos
```typescript
// permissions.decorator.ts
import { SetMetadata } from '@nestjs/common';

export enum Permission {
  CREATE_POST = 'create:post',
  EDIT_POST = 'edit:post',
  DELETE_POST = 'delete:post',
}

export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata('permissions', permissions);

// permissions.guard.ts
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<Permission[]>(
      'permissions',
      context.getHandler(),
    );

    if (!requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    // Lógica para verificar permisos
    return requiredPermissions.every((permission) =>
      user.permissions?.includes(permission),
    );
  }
}

// Uso
@Delete(':id')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.DELETE_POST)
async delete(@Param('id') id: string) {
  // Solo usuarios con permiso DELETE_POST
}
```

---

## 📝 Buenas Prácticas

### ✅ DO
```typescript
// ✅ Usar @CurrentUser() para obtener el usuario
@Post()
@UseGuards(JwtAuthGuard)
create(@CurrentUser() user: UserEntity) {
  return this.service.create(user.id);
}

// ✅ Combinar guards en el orden correcto
@UseGuards(JwtAuthGuard, RolesGuard)

// ✅ Ser explícito con los roles
@Roles(UserRole.ADMIN, UserRole.EDITOR)

// ✅ Validar permisos en el servicio también
async delete(id: string, userId: string) {
  const resource = await this.findOne(id);
  if (resource.ownerId !== userId) {
    throw new ForbiddenException();
  }
  // ...
}
```

### ❌ DON'T
```typescript
// ❌ No hardcodear IDs de usuario
const userId = 'hardcoded-id';

// ❌ No confiar solo en el frontend
// Siempre validar en el backend

// ❌ No usar guards sin autenticación primero
@UseGuards(RolesGuard)  // ❌ Falta JwtAuthGuard

// ❌ No exponer información sensible
return {
  ...user,
  passwordHash: user.passwordHash  // ❌ NUNCA
};
```

---

## 🎯 Resumen

Estos ejemplos cubren los casos de uso más comunes. Para más detalles:
- Ver `docs/AUTH.md` para documentación completa
- Ver controladores existentes para ejemplos reales
- Consultar la documentación oficial de NestJS

**¡Feliz codificación! 🚀**
