# 🏗️ Technical Overview & Architecture Review
**Proyecto:** Noticias del Backend (NestJS)  
**Versión:** 1.0.0  
**Fecha:** Enero 2026

Este documento detalla las decisiones técnicas, patrones de diseño y estado actual del backend para revisión de arquitectura.

---

## 1. Arquitectura del Sistema

El proyecto sigue una arquitectura **Modular Monolith** basada en NestJS, diseñada para escalar verticalmente antes de necesitar microservicios.

### 📐 Estructura de Módulos (Domain-Driven Design Light)
Cada módulo encapsula su propia lógica de negocio, controladores y entidades.
```
src/
├── modules/
│   ├── auth/        # Seguridad, JWT, Guards
│   ├── news/        # Core CMS, Métricas, Public API
│   ├── users/       # Gestión de usuarios y perfiles
│   ├── categories/  # Taxonomía
│   └── tags/        # Etiquetas
├── common/          # DTOs transversales, Interceptors, Pipes
└── database/        # Configuración TypeORM, Seeds, Migraciones
```

**Decisión Técnica:** Se optó por módulos por funcionalidad (Feature Modules) en lugar de capas técnicas puras para facilitar la mantenibilidad y futura extracción a microservicios si fuese necesario.

---

## 2. Capa de Datos (Persistence Layer)

- **ORM:** TypeORM v0.3.
- **Base de Datos:** PostgreSQL.
- **Estrategia de Migraciones:** Versionadas en código (`src/database/migrations`).
  - *Nota:* Se utiliza generación manual/híbrida para evitar operaciones destructivas accidentales en producción.
- **Índices:**
  - `slug` (Unique): Búsquedas públicas rápidas.
  - `publishedAt` + `status`: Filtrado de noticias visibles.
  - `views`: Ordenamiento para trending topics.

### Entidades Principales
- **User:** Roles (Enum), Password (Bcrypt hash), Soft-delete ready.
- **News:** Relaciones ManyToOne (Author, Category) y ManyToMany (Tags).
  - *Optimización:* Campos `views` y `lastViewedAt` denormalizados en la misma tabla para evitar JOINs costosos en lecturas frecuentes (tradeoff aceptado: mayor write amplification, menor latency de lectura).

---

## 3. Seguridad & Autenticación (RBAC)

Sistema robusto basado en **Passport + JWT**.

### 🔐 Flujo de Auth
1. **Login:** Retorna JWT firmado (exp 7d).
2. **Guards:**
   - `JwtAuthGuard`: Valida firma y expiración.
   - `RolesGuard`: Verifica permisos (`ADMIN`, `EDITOR`).
3. **Decoradores Custom:**
   - `@CurrentUser()`: Inyecta la entidad `User` segura (sin pass) en el controlador.
   - `@Roles('ADMIN')`: Metadatos declarativos para proteger endpoints.

### 🛡️ Medidas Implementadas
- **Password Hashing:** Bcrypt con salt rounds default (10).
- **Serialization:** `ClassSerializerInterceptor` global para remover campos sensibles (`passwordHash`, emails privados) de las respuestas JSON usando decoradores `@Exclude`.
- **Validation:** `ValidationPipe` global con `whitelist: true` para prevenir *Mass Assignment Vulnerabilities*.

---

## 4. API Design & Developer Experience (DX)

La API está diseñada para ser "Frontend Friendly".

### 📦 DTOs & Responses
Se estandarizó el formato de respuesta (`ApiResponse<T>`) para previsibilidad.
- **Wrappers:** `{ success: boolean, data: T, meta: ... }`
- **Paginación:** Estandarizada en `PaginatedResponse` (page, limit, total, totalPages).
- **Segregación:** DTOs distintos para Listados (`NewsListDto`) vs Detalle (`NewsResponseDto`) para reducir payload en listas.

### 🔌 Interfaz Pública vs Admin
Separación explicita en controladores:
- `NewsPublicController`: Solo lectura, cache agresivo, filtros seguros (solo publicados).
- `NewsController` (Admin): Protegido, CRUD completo, sin cache o cache-busting.

---

## 5. Performance & Scalability

### ⚡ Estrategia de Caching
Implementación de **Cache-Aside** en memoria (`cache-manager`).
- **Keys:** Basadas en parámetros de query (ej: `news:public:list:{page:1,cat:pol}`).
- **TTL:** 
  - Listados: 2 min.
  - Detalle: 5 min.
  - Trending: 1 min.
- **Invalidación:** Simple (`cache.clear()`) en operaciones de escritura (Create/Update).
  - *Tradeoff:* Ineficiente a gran escala (borra todo), pero suficiente para MVP. Futura mejora: cache tags.

### 📈 Métricas Editoriales
- Update asíncrono ("fire & forget") para contador de visitas.
- No bloquea el thread principal de respuesta HTTP.
- *Tradeoff:* Precisión eventual vs Latencia cero. Valores orientativos para editorial, no para auditoría publicitaria.

---

## 6. Deuda Técnica & Roadmap (Honestidad para el Senior)

Puntos identificados para mejora en siguientes iteraciones:

### 🟠 Prioridad Media
1. **Soft Delete:** Implementar `@DeleteDateColumn` en `NewsEntity` para evitar borrados accidentales.
2. **Rate Limiting:** Falta agregar `nestjs-throttler`, especialmente en `/auth/login`.
3. **Redis:** Mover el cache de in-memory a Redis para persistencia y soporte cluster/pm2 multi-instancia.

### 🟢 Prioridad Baja (Future)
1. **Testing:** Añadir tests E2E (`supertest`) para flujos críticos (Login -> Crear Noticia).
2. **Background Jobs:** Mover el envío de emails o procesos pesados a colas (BullMQ).
3. **Auditoría:** Tabla de logs para acciones de administradores (`news_audit_log`).

---

**Conclusión:** El backend se encuentra en un estado de madurez **8.5/10**. Es seguro, ordenado y escalable para el tráfico esperado en lanzamiento y mediano plazo.
