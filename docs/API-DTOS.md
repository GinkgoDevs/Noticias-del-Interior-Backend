# 📡 API DTOs & Responses

El backend utiliza una estructura estandarizada para todas las respuestas.

## 📦 Formato Base

Todas las respuestas exitosas siguen este formato (`ApiResponse`):
```json
{
  "success": true,
  "data": { ... }, // Objeto o Array
  "message": "Mensaje opcional",
  "timestamp": "2026-01-09T18:00:00.000Z"
}
```

## 📄 Paginación

Los listados paginados envuelven los datos en `PaginatedData`:
```json
{
  "success": true,
  "data": {
    "data": [ ... ], // Los items
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

---

## 📰 News DTOs

### News List Item (`NewsListResponseDto`)
Usado en `/news` y `/news/latest`.
```json
{
  "id": "uuid",
  "title": "Título de la noticia",
  "slug": "titulo-de-la-noticia",
  "excerpt": "Extracto breve...",
  "mainImageUrl": "https://...",
  "publishedAt": "2026-01-09T...",
  "category": {
    "id": "uuid",
    "name": "Política",
    "slug": "politica",
    "color": "#FF0000"
  },
  "author": {
    "id": "uuid",
    "name": "Juan Pérez",
    "avatarUrl": "https://..."
  }
}
```

### News Detail (`NewsResponseDto`)
Usado en `/news/:slug`. Incluye todo lo anterior más:
```json
{
  ...
  "content": "<p>Contenido HTML completo...</p>",
  "tags": [
    { "id": "uuid", "name": "Economía", "slug": "economia" }
  ],
  "seoTitle": "...",
  "seoDescription": "...",
  "updatedAt": "..."
}
```

---

## 🔐 Auth DTOs

### Login Response (`AuthResponseDto`)
```json
{
  "access_token": "eyJ...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "EDITOR",
    "avatarUrl": "...",
    "active": true
  }
}
```

---

## 🏷️ Category DTOs

### Category Response (`CategoryResponseDto`)
```json
{
  "id": "uuid",
  "name": "Nombre",
  "slug": "slug",
  "color": "#HEX"
}
```

---

## 🛠️ Cómo Consumir (Frontend)

### Ejemplo Fetch con Tipos (TypeScript)

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

interface Paginated<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
}

// Consumir listado
async function getNews() {
  const res = await fetch('/news');
  const json: ApiResponse<Paginated<NewsListItem>> = await res.json();
  if (json.success) {
    console.log(json.data.data); // Noticias
    console.log(json.data.meta); // Paginación
  }
}
```
