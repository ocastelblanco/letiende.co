// Usado por `ng build --configuration=production`, el único build que existe:
// tanto staging como producción despliegan el mismo artefacto (CLAUDE.md §3,
// igual que Ágora y Babel) — solo cambia el stage de Serverless, no el build
// de Angular. Consecuencia intencional: el staging de este proyecto consulta
// la Ágora de PRODUCCIÓN, no una de staging propia. Aceptable porque
// /api/eventos-publicos es de solo lectura, sin efectos secundarios — ver
// docs/MEMORY.md, ADR-012.
export const environment = {
  urlBaseApiAgora: 'https://agora.letiende.co',
  // Carta del café bar (tech-specs.md §4.6, F-8). `urlContenidoCartaWebApp`
  // no es un marcador de llave pública — no pasa por
  // inyectar-llaves-publicas.mjs, porque no es un secreto: es una URL
  // pública, desplegada el 23/09/2026 (T-0036), verificada en vivo con
  // `curl -L` (sigue la redirección a `script.googleusercontent.com` sin
  // intervención). Real en staging y en producción — no filtra nada:
  // `/carta` ya tiene ruta (T-0038), pero ADR-024 la mantiene en 404 fuera
  // de staging hasta la publicación real (T-0040).
  urlMenuComandante: 'https://comandante.letiende.co/menu.json',
  urlContenidoCartaWebApp:
    'https://script.google.com/macros/s/AKfycbzEcwJgUxX5Aepy2wC8YYH-qe2hlsYm8-IUVSjsevNU8ew6Myi54xAaXomhblVEbH4O/exec',
  // Marcadores, no las llaves reales — CLAUDE.md §5, A02 prohíbe cualquier
  // llave en environments/, incluso una pública restringida por dominio como
  // esta. scripts/inyectar-llaves-publicas.mjs los sustituye sobre el
  // `dist/` compilado, leyendo GOOGLE_MAPS_API_KEY y GOOGLE_ANALYTICS_ID del
  // entorno de CI (docs/MEMORY.md, ADR-017). Este mismo artefacto sirve a
  // staging y a producción; AnalyticsService evita que staging contamine las
  // métricas reales comprobando el host en tiempo de ejecución (solo carga
  // gtag.js en letiende.co, nunca en staging.letiende.co).
  googleAnalyticsId: '__GOOGLE_ANALYTICS_ID__',
  googleMapsApiKey: '__GOOGLE_MAPS_API_KEY__',
  // Site key de reCAPTCHA v3 — mismo mecanismo de marcador, la secret key
  // nunca aparece aquí (vive solo en el entorno de la Lambda de contacto).
  recaptchaSiteKey: '__RECAPTCHA_SITE_KEY__',
};
