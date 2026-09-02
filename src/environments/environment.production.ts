// Usado por `ng build --configuration=production`, el único build que existe:
// tanto staging como producción despliegan el mismo artefacto (CLAUDE.md §3,
// igual que Ágora y Babel) — solo cambia el stage de Serverless, no el build
// de Angular. Consecuencia intencional: el staging de este proyecto consulta
// la Ágora de PRODUCCIÓN, no una de staging propia. Aceptable porque
// /api/eventos-publicos es de solo lectura, sin efectos secundarios — ver
// docs/MEMORY.md, ADR-012.
export const environment = {
  urlBaseApiAgora: 'https://agora.letiende.co',
};
