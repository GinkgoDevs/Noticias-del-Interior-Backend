# 📊 Sistema de Métricas y Trending

El backend incluye un sistema ligero pero efectivo para trackear la popularidad del contenido sin requerir servicios externos como Google Analytics para la lógica de negocio.

## 🗄️ Modelo de Datos

La entidad `News` tiene dos nuevos campos:

- **`views`** (`int`, default 0): Contador total acumulado de lecturas.
- **`lastViewedAt`** (`timestamp`): Fecha y hora de la última visita.

> **⚠️ Disclaimer de Precisión / Tradeoff:**
> El contador de `views` tiene un propósito **editorial y de descubrimiento** (trending topics), no contable.
> - Puede incluir recargas de página o tráfico de bots no filtrados.
> - En entornos con caché distribuido (futuro), podría tener ligeros retrasos de consistencia.
> - **No debe utilizarse como métrica única para facturación publicitaria.**

## 🚀 Funcionamiento

### Incremento de Vistas
Cada vez que se consulta el detalle de una noticia pública (`GET /news/:slug`):

1. Se recupera la noticia (de DB o Cache).
2. Se dispara un proceso asíncrono ("fire & forget") para incrementar el contador.
3. Se devuelve la respuesta inmediatamente al usuario (baja latencia).
4. En segundo plano, la DB ejecuta:
   ```sql
   UPDATE news SET views = views + 1, "lastViewedAt" = NOW() WHERE id = '...'
   ```

> **Nota sobre Cache:** Incluso si la noticia está cacheada en memoria (hit), el incremento se dispara igual. El contador visible en la respuesta puede estar "congelado" hasta que expire el caché (5 min), pero el dato real en DB siempre sube.

### Algoritmo de Trending (`/news/trending`)
Este endpoint devuelve las noticias más populares bajo los siguientes criterios:

1. **Estado:** Publicadas (`PUBLISHED`).
2. **Fecha:** Publicadas en los últimos 30 días (para garantizar frescura).
3. **Orden:**
   - Mayor cantidad de `views`.
   - Si hay empate, la más reciente (`publishedAt`).

## 📡 Endpoints Relacionados

### `GET /news/trending`
Devuelve las 5 noticias más leídas del mes.

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "title": "Noticia muy leída",
      "views": 1540,
      "publishedAt": "2026-01-08...",
      ...
    }
  ]
}
```

### `GET /news/:slug`
Ahora incluye el campo `views` en la respuesta.

## 🛠️ Mantenimiento

- **Índices:** Se creó el índice `idx_news_views` para que ordenar por visitas sea instantáneo incluso con millones de registros.
- **Cache:** El listado de trending se cachea por 1 minuto para evitar carga excesiva en la DB.
