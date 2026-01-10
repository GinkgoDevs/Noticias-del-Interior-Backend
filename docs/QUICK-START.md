# 🚀 Guía de Inicio Rápido - Sistema de Autenticación

## ✅ Prerequisitos

- PostgreSQL instalado y corriendo
- Node.js 18+ instalado
- Variables de entorno configuradas en `.env`

---

## 📝 Paso a Paso

### 1. Instalar dependencias
```bash
npm install
```

### 2. Ejecutar migraciones
```bash
npm run migration:run
```

### 3. Crear usuarios de prueba (OPCIÓN A - Recomendado)
```bash
npm run seed
```

Esto creará:
- **Admin**: `admin@noticiasdelinterior.com` / `admin123`
- **Editor**: `editor@noticiasdelinterior.com` / `editor123`

⚠️ **IMPORTANTE**: Cambiar estas contraseñas en producción.

### 4. Crear usuario manualmente (OPCIÓN B)

#### 4.1. Generar hash de contraseña
```bash
npm run hash miPassword123
```

Copia el hash generado.

#### 4.2. Insertar en la base de datos
```sql
INSERT INTO users (
  id, email, name, "passwordHash", role, active, 
  "emailVerified", "authProvider", "authProviderId", 
  "createdAt", "updatedAt"
) VALUES (
  gen_random_uuid(),
  'tu@email.com',
  'Tu Nombre',
  '$2b$10$HASH_COPIADO_AQUI',
  'ADMIN',
  true,
  true,
  'local',
  'local-admin',
  NOW(),
  NOW()
);
```

### 5. Iniciar el servidor
```bash
npm run dev
```

El servidor estará corriendo en `http://localhost:3000`

---

## 🧪 Probar la Autenticación

### 1. Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@noticiasdelinterior.com",
    "password": "admin123"
  }'
```

**Respuesta esperada:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@noticiasdelinterior.com",
    "name": "Administrador",
    "role": "ADMIN",
    "avatarUrl": null
  }
}
```

### 2. Obtener perfil (con token)
```bash
curl http://localhost:3000/auth/profile \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

### 3. Acceder a ruta protegida
```bash
curl http://localhost:3000/admin/news \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

---

## 🔐 Endpoints Disponibles

### Públicos (sin autenticación)
- `GET /news` - Lista de noticias publicadas
- `GET /news/latest` - Últimas noticias
- `GET /news/:slug` - Detalle de noticia
- `GET /categories` - Categorías activas
- `POST /auth/login` - Login

### Protegidos (requieren autenticación)
- `GET /auth/profile` - Perfil del usuario
- `GET /admin/news` - Lista admin de noticias
- `POST /admin/news` - Crear noticia
- `PATCH /admin/news/:id` - Editar noticia
- `GET /categories/admin` - Todas las categorías
- `POST /categories` - Crear categoría (solo ADMIN)
- `GET /admin/tags` - Lista de tags
- `POST /admin/tags` - Crear tag

---

## 👥 Roles y Permisos

| Rol | Permisos |
|-----|----------|
| **ADMIN** | Acceso total (crear, editar, eliminar, archivar) |
| **EDITOR** | Crear y editar noticias, categorías y tags |
| **AUTHOR** | Solo lectura (futuro) |

---

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia en modo watch

# Producción
npm run build            # Compila el proyecto
npm run prod             # Ejecuta la versión compilada

# Base de datos
npm run migration:generate -- src/database/migrations/NombreMigracion
npm run migration:run    # Ejecuta migraciones pendientes

# Utilidades
npm run seed             # Crea usuarios de prueba
npm run hash [password]  # Genera hash de contraseña

# Testing
npm run test             # Ejecuta tests
npm run test:watch       # Tests en modo watch
```

---

## 📚 Documentación Adicional

- **[AUTH.md](./AUTH.md)** - Documentación completa de autenticación
- **[IMPLEMENTATION-AUTH.md](./IMPLEMENTATION-AUTH.md)** - Detalles de implementación

---

## ⚠️ Seguridad en Producción

### Variables de entorno críticas:
```env
# JWT
JWT_SECRET=CAMBIAR_POR_UN_SECRET_SEGURO_ALEATORIO

# Database
DATABASE_URL=postgresql://user:password@host:5432/database
```

### Recomendaciones:
1. ✅ Cambiar `JWT_SECRET` por un valor aleatorio y seguro
2. ✅ Cambiar las contraseñas de los usuarios de prueba
3. ✅ Usar HTTPS en producción
4. ✅ Configurar CORS apropiadamente
5. ✅ Implementar rate limiting (próximo paso)

---

## 🐛 Troubleshooting

### Error: "Credenciales inválidas"
- Verificar que el email existe en la base de datos
- Verificar que la contraseña es correcta
- Verificar que el usuario está activo (`active = true`)

### Error: "Unauthorized"
- Verificar que el token JWT es válido
- Verificar que el token no ha expirado (7 días)
- Verificar que el header Authorization está bien formado: `Bearer TOKEN`

### Error: "Forbidden"
- Verificar que el usuario tiene el rol necesario
- Verificar que el decorador `@Roles()` está correctamente configurado

---

## 📞 Soporte

Para más información, consultar:
- Documentación en `docs/`
- Código de ejemplo en los controladores
- Equipo de desarrollo

---

**¡Listo para usar! 🎉**
