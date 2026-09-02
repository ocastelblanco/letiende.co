<div align="center">

# letiende.co

**El sitio principal de Le Tiende — la fachada que une, bajo un solo dominio y un solo menú, la boletería, el catálogo de la librería y (próximamente) la carta del café bar, sin reimplementar ninguno de los tres.**

[![Estado](https://img.shields.io/badge/estado-en%20desarrollo-dbab09?style=flat-square)](docs/MEMORY.md)
[![Licencia](https://img.shields.io/badge/licencia-MIT-blue?style=flat-square)](LICENSE)
[![Angular](https://img.shields.io/badge/Angular-22-DD0031?style=flat-square&logo=angular&logoColor=white)](https://angular.dev)
[![AWS](https://img.shields.io/badge/AWS-Lambda_·_CloudFront_·_API_Gateway-232F3E?style=flat-square&logo=amazonaws&logoColor=white)](https://aws.amazon.com)
[![Serverless](https://img.shields.io/badge/IaC-Serverless_Framework_4-FD5750?style=flat-square&logo=serverless&logoColor=white)](https://serverless.com)
[![AI-assisted: escrito por un humano con ayuda de herramientas de IA](https://img.shields.io/static/v1?label=&message=AI-assisted&color=gold&style=flat-square)](https://nasa-ammos.github.io/slim/?search=Badges)
[![SLIM](https://img.shields.io/badge/Best%20Practices%20from-SLIM-blue?style=flat-square)](https://nasa-ammos.github.io/slim/)
[![English](https://img.shields.io/badge/read_in-English-FFE7B3?style=flat-square)](./README.md)

</div>

---

## Qué es y qué problema resuelve

**Le Tiende** (Bogotá, Colombia) opera tres servicios digitales que ya funcionan bien por separado: la boletería de su teatro ([Ágora](https://github.com/ocastelblanco/agora-letiende)), el catálogo de su librería ([Babel](https://github.com/ocastelblanco/babel-letiende)), y la lista de precios de su café bar (Comandante). El problema no es que falte funcionalidad — es que un visitante no tiene por dónde entrar: cada servicio vive en una dirección distinta, y quien busca "Le Tiende" no se entera de que existen las otras dos.

`letiende.co` no es un cuarto sistema. Es la **fachada** que pone los tres bajo un solo dominio y un solo menú de navegación, para que el visitante recorra cartelera, catálogo y (en la etapa 2) carta sin cambiar de dirección y sin notar la costura.

| | |
| :-- | :-- |
| **Tipo** | Sitio público de un centro cultural — contenedor sobre servicios ya existentes |
| **Dirección** | [`letiende.co`](https://letiende.co) *(hoy sirve el sitio estático anterior; el cutover a este proyecto es la última tarea del roadmap)* |
| **Idioma de la interfaz** | Español |
| **Etapa actual** | En desarrollo — documentación y andamiaje completos, sin páginas propias todavía |

## Arquitectura

La cartelera (`/cartelera`) y el catálogo (`/libros`) se sirven **por proxy de ruta en CloudFront**, directamente desde los stacks de Ágora y Babel que ya están en producción — este repositorio nunca reimplementa esas vistas ni el flujo de compra. Lo único propio de aquí es la portada, las páginas institucionales, la barra de navegación común y la capa de SEO/AEO. Detalle completo, con diagrama, en [`docs/tech-specs.md`](docs/tech-specs.md).

## Stack tecnológico

| Capa | Tecnología |
| :--- | :--- |
| Framework frontend | Angular 22 — componentes standalone, Signals, aplicación *zoneless*, SSR con `@angular/ssr` |
| Estilos | Tailwind CSS 4, sin librería de componentes — paleta de marca Le Tiende en `@theme` |
| Runtime backend | Node.js 24 en AWS Lambda |
| API | AWS API Gateway (HTTP API) |
| CDN / proxy de ruta | AWS CloudFront — un solo dominio, tres orígenes (este stack, Ágora, Babel) |
| Correo | AWS SES (formulario de contacto) |
| IaC | Serverless Framework 4 |
| CI/CD | GitHub Actions — PR → `staging`, merge a `main` → `production` |
| Pruebas | Vitest, vía `@angular/build:unit-test` |
| Lenguaje | TypeScript `strict` — `any` está prohibido |

Sin base de datos propia, sin autenticación: todo lo que requiere identificarse ya vive en Ágora y en Babel. Detalle completo en [`docs/tech-specs.md`](docs/tech-specs.md).

## Arranque rápido

```bash
git clone https://github.com/ocastelblanco/letiende.co.git
cd letiende.co
npm install
```

```bash
npm start                                      # servidor de desarrollo (ng serve)
npm run build -- --configuration=production    # build de producción con SSR
npm run serve:ssr                              # sirve el build SSR localmente
npm test                                       # pruebas unitarias (Vitest)
```

**Requisitos:** Node.js 24.x, npm.

## Seguridad

Sin autenticación ni manejo de dinero, la superficie de riesgo es pequeña por diseño — no por descuido. Las reglas concretas (formulario de contacto, proxy de CloudFront, HTML renderizado con datos de terceros) están mapeadas contra OWASP Top 10 y codificadas como restricciones permanentes en [`CLAUDE.md` §5](CLAUDE.md), incluida una tabla de prohibiciones absolutas de código.

## Contribuir

Todo cambio llega a `main` únicamente por un pull request revisado por un humano ([`CLAUDE.md` §6](CLAUDE.md)):

1. Crea una rama desde `main` con `feature/*`, `fix/*`, `docs/*`, `hotfix/*`, `refactor/*` o `chore/*`
2. Haz el cambio y confirma que `npm run build` pasa
3. Agrega archivos específicos — nunca `git add .` ni `git add -A`
4. Abre un pull request contra `main` describiendo el cambio y cómo probarlo

Código, commits y comentarios se escriben en **español colombiano**.

## Documentación del proyecto

| Documento | Contenido |
| :--- | :--- |
| [`CLAUDE.md`](CLAUDE.md) | Instrucciones permanentes para agentes: stack, convenciones, seguridad, git flow |
| [`docs/PRD.md`](docs/PRD.md) | Visión de producto, usuarios, objetivos y roadmap en 3 etapas |
| [`docs/tech-specs.md`](docs/tech-specs.md) | Arquitectura, rutas, infraestructura y endpoints |
| [`docs/DESIGN.md`](docs/DESIGN.md) | Sistema de diseño y contrato visual con Ágora y Babel |
| [`docs/MEMORY.md`](docs/MEMORY.md) | Estado del proyecto, decisiones de arquitectura y gotchas conocidos |
| [`docs/TODO.md`](docs/TODO.md) | Backlog JIT — máximo dos tareas atómicas activas |
| [`metrics/`](metrics/) | Registro de esfuerzo y costo por tarea, la fuente de la insignia de autoría de arriba |

## Licencia

[MIT](LICENSE).

## Soporte

Proyecto interno de Le Tiende. Para dudas o soporte, contactar al equipo de Le Tiende.

---

<div align="center">
<sub>Construido para <b>Le Tiende</b> — teatro, librería y café bar · Bogotá, Colombia<br/>
Servicios hermanos: <a href="https://github.com/ocastelblanco/agora-letiende">Ágora</a> (boletería) ·
<a href="https://github.com/ocastelblanco/babel-letiende">Babel</a> (librería) · Contacto: <a href="https://github.com/ocastelblanco">@ocastelblanco</a></sub>
</div>
