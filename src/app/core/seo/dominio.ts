/**
 * Dirección canónica del sitio (PRD.md §1, tech-specs.md §4.5) — toda
 * canónica, Open Graph y JSON-LD se arma a partir de esta constante, nunca
 * de `location.origin` ni de ningún dato de la petición (evita que un Host
 * falsificado o el dominio crudo de la Lambda terminen en una URL indexada).
 */
export const DOMINIO = 'https://letiende.co';
