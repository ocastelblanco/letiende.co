// Desarrollo local (ng serve). Direcciones y llaves públicas — CLAUDE.md §5,
// A02: nunca un secreto. googleAnalyticsId y googleMapsApiKey son llaves
// públicas por diseño de Google (se compilan en el bundle del navegador a
// propósito); googleAnalyticsId no dispara envíos aquí de todas formas —
// AnalyticsService solo carga en el host letiende.co (ver docs/MEMORY.md).
export const environment = {
  urlBaseApiAgora: 'https://agora.letiende.co',
  googleAnalyticsId: '__GOOGLE_ANALYTICS_ID__',
  googleMapsApiKey: '__GOOGLE_MAPS_API_KEY__',
};
