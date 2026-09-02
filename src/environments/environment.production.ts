// Usado por `ng build --configuration=production`, el único build que existe:
// tanto staging como producción despliegan el mismo artefacto (CLAUDE.md §3,
// igual que Ágora y Babel) — solo cambia el stage de Serverless, no el build
// de Angular. Consecuencia intencional: el staging de este proyecto consulta
// la Ágora de PRODUCCIÓN, no una de staging propia. Aceptable porque
// /api/eventos-publicos es de solo lectura, sin efectos secundarios — ver
// docs/MEMORY.md, ADR-012.
export const environment = {
  urlBaseApiAgora: 'https://agora.letiende.co',
  // Llaves públicas por diseño de Google, restringidas por dominio del lado
  // de Google Cloud, no por secreto — CLAUDE.md §5, A02. Este mismo artefacto
  // sirve a staging y a producción; AnalyticsService evita que staging
  // contamine las métricas reales comprobando el host en tiempo de ejecución
  // (solo carga gtag.js en letiende.co, nunca en staging.letiende.co).
  googleAnalyticsId: '__GOOGLE_ANALYTICS_ID__',
  googleMapsApiKey: '__GOOGLE_MAPS_API_KEY__',
};
