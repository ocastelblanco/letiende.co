// Desarrollo local (ng serve). Dirección pública — CLAUDE.md §5, A02: nunca
// un secreto.
//
// googleAnalyticsId y googleMapsApiKey NO se versionan con su valor real,
// aunque ambos sean llaves públicas por diseño de Google (restringidas por
// dominio, no por secreto): CLAUDE.md §5 prohíbe cualquier llave en
// environments/ sin excepción. Los marcadores de abajo los sustituye
// scripts/inyectar-llaves-publicas.mjs sobre el `dist/` ya compilado, a
// partir de las variables de entorno GOOGLE_MAPS_API_KEY y
// GOOGLE_ANALYTICS_ID (ver docs/MEMORY.md, ADR-017). `ng serve` no corre ese
// script: en desarrollo local el mapa y GA4 se quedan con el marcador, sin
// romper nada (GA4 además solo carga en el host letiende.co, nunca aquí).
export const environment = {
  urlBaseApiAgora: 'https://agora.letiende.co',
  googleAnalyticsId: '__GOOGLE_ANALYTICS_ID__',
  googleMapsApiKey: '__GOOGLE_MAPS_API_KEY__',
  // Site key de reCAPTCHA v3 (pública por diseño, pero de todas formas sin
  // versionar — mismo mecanismo de marcador que las dos de arriba). La
  // secret key nunca aparece aquí: vive solo como RECAPTCHA_SECRET_KEY en
  // el entorno de la Lambda de contacto (serverless.yml).
  recaptchaSiteKey: '__RECAPTCHA_SITE_KEY__',
};
