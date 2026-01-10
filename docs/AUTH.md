# 🔐 Sistema de Autenticación y Autorización

## 📋 Resumen

El backend implementa un sistema completo de autenticación JWT con control de roles (RBAC).

### Roles disponibles:
- **ADMIN**: Acceso total al sistema
- **EDITOR**: Puede crear y editar contenido
- **AUTHOR**: Solo lectura (futuro)

---

## 🚀 Endpoints de Autenticación

### 1. Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "tu_password"
}
```

**Respuesta exitosa:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "ADMIN",
    "avatarUrl": "https://..."
  }
}
```

### 2. Obtener perfil
```http
GET /auth/profile
Authorization: Bearer {access_token}
```

**Respuesta:**
```json
{
  "id": "uuid",
  "email": "admin@example.com",
  "name": "Admin User",
  "role": "ADMIN",
  "avatarUrl": "https://...",
  "active": true
}
```

---

## 🔒 Rutas Protegidas

### Categorías
| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/categories` | Público | Lista categorías activas |
| GET | `/categories/admin` | ADMIN, EDITOR | Lista todas (incluye inactivas) |
| POST | `/categories` | ADMIN | Crear categoría |
| PATCH | `/categories/:id` | ADMIN | Editar categoría |
| PATCH | `/categories/:id/active` | ADMIN | Activar/desactivar |

### Noticias (Admin)
| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/admin/news` | ADMIN, EDITOR | Lista todas las noticias |
| POST | `/admin/news` | ADMIN, EDITOR | Crear noticia |
| PATCH | `/admin/news/:id` | ADMIN, EDITOR | Editar noticia |
| PATCH | `/admin/news/:id/publish` | ADMIN, EDITOR | Publicar noticia |
| PATCH | `/admin/news/:id/schedule` | ADMIN, EDITOR | Programar publicación |
| PATCH | `/admin/news/:id/archive` | ADMIN | Archivar noticia |

### Noticias (Público)
| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/news` | Público | Lista noticias publicadas |
| GET | `/news/latest` | Público | Últimas noticias |
| GET | `/news/:slug` | Público | Detalle de noticia |

### Tags
| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/admin/tags` | ADMIN, EDITOR | Lista todos los tags |
| POST | `/admin/tags` | ADMIN, EDITOR | Crear tag |

---

## 💻 Uso en el Código

### Proteger un controlador completo
```typescript
import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, Roles } from '../auth';
import { UserRole } from '../users/entities/user.entity';

@Controller('admin/something')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SomethingController {
  // Todos los endpoints requieren autenticación
}
```

### Proteger endpoints específicos
```typescript
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.EDITOR)
async create(@Body() dto: CreateDto) {
  // Solo ADMIN y EDITOR pueden acceder
}
```

### Obtener el usuario autenticado
```typescript
import { CurrentUser } from '../auth';
import { UserEntity } from '../users/entities/user.entity';

@Post()
@UseGuards(JwtAuthGuard)
async create(
  @Body() dto: CreateDto,
  @CurrentUser() user: UserEntity,
) {
  console.log('Usuario autenticado:', user.email);
  console.log('Rol:', user.role);
  // Usar user.id para asociar con el autor
}
```

---

## 🔧 Configuración

### Variables de entorno (.env)
```env
# JWT
JWT_SECRET=super_secret_key_change_me_in_production
JWT_EXPIRES_IN=7d
```

### Crear un usuario admin manualmente (SQL)
```sql
-- Primero, genera el hash de la contraseña con bcrypt (rounds=10)
-- Ejemplo: password "admin123" -> $2b$10$...

INSERT INTO users (
  id,
  email,
  name,
  "passwordHash",
  role,
  active,
  "emailVerified",
  "authProvider",
  "authProviderId",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'admin@noticiasdelinterior.com',
  'Administrador',
  '$2b$10$TU_HASH_AQUI',
  'ADMIN',
  true,
  true,
  'local',
  'local-admin',
  NOW(),
  NOW()
);
```

---

## 🧪 Testing con Thunder Client / Postman

### 1. Login
```
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "admin@noticiasdelinterior.com",
  "password": "admin123"
}
```

### 2. Copiar el `access_token` de la respuesta

### 3. Usar en requests protegidos
```
GET http://localhost:3000/admin/news
Authorization: Bearer {access_token}
```

---

## ⚠️ Seguridad

### ✅ Implementado
- JWT con expiración (7 días)
- Passwords hasheados con bcrypt
- Guards de autenticación y roles
- Separación de rutas públicas y admin
- Validación de usuario activo

### 🔜 Próximos pasos recomendados
- [ ] Refresh tokens
- [ ] Rate limiting
- [ ] Logs de auditoría
- [ ] 2FA (opcional)
- [ ] Blacklist de tokens

---

## 📚 Arquitectura

```
src/modules/auth/
├── guards/
│   ├── jwt-auth.guard.ts      # Valida el token JWT
│   └── roles.guard.ts          # Valida los roles
├── decorators/
│   ├── roles.decorator.ts      # @Roles(UserRole.ADMIN)
│   └── current-user.decorator.ts  # @CurrentUser()
├── strategies/
│   └── jwt.strategy.ts         # Estrategia de Passport
├── dto/
│   └── login.dto.ts
├── auth.controller.ts
├── auth.service.ts
├── auth.module.ts
└── index.ts                    # Barrel exports
```

---

## 🎯 Estado Actual

| Componente | Estado |
|------------|--------|
| JWT Auth | ✅ Implementado |
| Roles (ADMIN, EDITOR) | ✅ Implementado |
| Guards | ✅ Implementado |
| Decoradores | ✅ Implementado |
| Login endpoint | ✅ Implementado |
| Profile endpoint | ✅ Implementado |
| Rutas protegidas | ✅ Implementado |
| AuthorId real (no hardcoded) | ✅ Implementado |

**Nivel de seguridad: 8/10** 🟢

---

## 📞 Contacto

Para dudas o mejoras, contactar al equipo de desarrollo.
