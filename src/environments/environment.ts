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
  // Carta del café bar (tech-specs.md §4.6, F-8). Precios: Comandante.
  // `urlContenidoCartaWebApp` NO es un marcador de llave pública: no pasa
  // por scripts/inyectar-llaves-publicas.mjs porque no es un secreto — es
  // una URL pública, desplegada el 23/09/2026 (T-0036), verificada en vivo
  // con `curl -L` (sigue la redirección a `script.googleusercontent.com`
  // sin intervención). Cambiar de implementación en Apps Script cambia esta
  // URL — no editar a mano sin coordinar con quien administre la hoja.
  urlMenuComandante: 'https://comandante.letiende.co/menu.json',
  urlContenidoCartaWebApp:
    'https://script.google.com/macros/s/AKfycbzEcwJgUxX5Aepy2wC8YYH-qe2hlsYm8-IUVSjsevNU8ew6Myi54xAaXomhblVEbH4O/exec',
  googleAnalyticsId: '__GOOGLE_ANALYTICS_ID__',
  googleMapsApiKey: '__GOOGLE_MAPS_API_KEY__',
  // Site key de reCAPTCHA v3 (pública por diseño, pero de todas formas sin
  // versionar — mismo mecanismo de marcador que las dos de arriba). La
  // secret key nunca aparece aquí: vive solo como RECAPTCHA_SECRET_KEY en
  // el entorno de la Lambda de contacto (serverless.yml).
  recaptchaSiteKey: '__RECAPTCHA_SITE_KEY__',
};
