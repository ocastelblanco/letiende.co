// Usado por `ng build --configuration=production`, el único build que existe:
// tanto staging como producción despliegan el mismo artefacto (CLAUDE.md §3,
// igual que Ágora y Babel) — solo cambia el stage de Serverless, no el build
// de Angular. Consecuencia intencional: el staging de este proyecto consulta
// la Ágora de PRODUCCIÓN, no una de staging propia. Aceptable porque
// /api/eventos-publicos es de solo lectura, sin efectos secundarios — ver
// docs/MEMORY.md, ADR-012.
export const environment = {
  urlBaseApiAgora: 'https://agora.letiende.co',
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
