<div align="center">

# letiende.co

**The main site for Le Tiende — the facade that unifies, under one domain and one menu, box office ticketing, the bookstore catalogue, and (coming soon) the café bar menu, without reimplementing any of the three.**

[![Status](https://img.shields.io/badge/status-in%20development-dbab09?style=flat-square)](docs/MEMORY.md)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![Angular](https://img.shields.io/badge/Angular-22-DD0031?style=flat-square&logo=angular&logoColor=white)](https://angular.dev)
[![AWS](https://img.shields.io/badge/AWS-Lambda_·_CloudFront_·_API_Gateway-232F3E?style=flat-square&logo=amazonaws&logoColor=white)](https://aws.amazon.com)
[![Serverless](https://img.shields.io/badge/IaC-Serverless_Framework_4-FD5750?style=flat-square&logo=serverless&logoColor=white)](https://serverless.com)
[![AI-assisted: written by a human with help from AI tools](https://img.shields.io/static/v1?label=&message=AI-assisted&color=gold&style=flat-square)](https://nasa-ammos.github.io/slim/?search=Badges)
[![SLIM](https://img.shields.io/badge/Best%20Practices%20from-SLIM-blue?style=flat-square)](https://nasa-ammos.github.io/slim/)
[![Español](https://img.shields.io/badge/leer_en-Español-FFE7B3?style=flat-square)](./README.es.md)

</div>

---

## What it is and what problem it solves

**Le Tiende** (Bogotá, Colombia) runs three digital services that already work well on their own: its theater's box office ([Ágora](https://github.com/ocastelblanco/agora-letiende)), its bookstore catalogue ([Babel](https://github.com/ocastelblanco/babel-letiende)), and its café bar's price list (Comandante). The problem isn't missing functionality — it's that a visitor has no single front door: each service lives at a different address, and someone searching for "Le Tiende" never finds out the other two exist.

`letiende.co` is not a fourth system. It's the **facade** that puts all three under one domain and one navigation menu, so a visitor can browse the box office, the catalogue and (in stage 2) the menu without switching addresses and without noticing the seam.

| | |
| :-- | :-- |
| **Type** | Public site for a cultural venue — a container over already-existing services |
| **URL** | [`letiende.co`](https://letiende.co) *(today still serves the previous static site; the cutover to this project is the last item on the roadmap)* |
| **Interface language** | Spanish |
| **Current stage** | In development — documentation and scaffolding complete, no pages of its own yet |

## Architecture

The box office (`/cartelera`) and the catalogue (`/libros`) are served **via a CloudFront route proxy**, straight from the already-in-production Ágora and Babel stacks — this repository never reimplements those views or the purchase flow. The only things owned here are the homepage, the institutional pages, the shared navigation bar and the SEO/AEO layer. Full detail, with a diagram, in [`docs/tech-specs.md`](docs/tech-specs.md).

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| Frontend framework | Angular 22 — standalone components, Signals, zoneless application, SSR via `@angular/ssr` |
| Styling | Tailwind CSS 4, no component library — Le Tiende brand palette in `@theme` |
| Backend runtime | Node.js 24 on AWS Lambda |
| API | AWS API Gateway (HTTP API) |
| CDN / route proxy | AWS CloudFront — one domain, three origins (this stack, Ágora, Babel) |
| Email | AWS SES (contact form) |
| IaC | Serverless Framework 4 |
| CI/CD | GitHub Actions — PR → `staging`, merge to `main` → `production` |
| Testing | Vitest, via `@angular/build:unit-test` |
| Language | TypeScript `strict` — `any` is banned |

No database of its own, no authentication: everything that requires an account already lives in Ágora and Babel. Full detail in [`docs/tech-specs.md`](docs/tech-specs.md).

## Quick Start

```bash
git clone https://github.com/ocastelblanco/letiende.co.git
cd letiende.co
npm install
```

```bash
npm start                                      # dev server (ng serve)
npm run build -- --configuration=production    # production build with SSR
npm run serve:ssr                              # serve the SSR build locally
npm test                                       # unit tests (Vitest)
```

**Requirements:** Node.js 24.x, npm.

## Security

With no authentication and no money handled, the attack surface is small by design — not by omission. The concrete rules (contact form, CloudFront proxy, HTML rendered with third-party data) are mapped against the OWASP Top 10 and encoded as permanent constraints in [`CLAUDE.md` §5](CLAUDE.md), including a table of absolute code prohibitions.

## Contributing

Every change reaches `main` only through a human-reviewed pull request ([`CLAUDE.md` §6](CLAUDE.md)):

1. Branch from `main` using `feature/*`, `fix/*`, `docs/*`, `hotfix/*`, `refactor/*` or `chore/*`
2. Make the change and confirm `npm run build` passes
3. Stage specific files — never `git add .` or `git add -A`
4. Open a pull request against `main` describing the change and how to verify it

Code, commits and comments are written in **Colombian Spanish**.

## Project Documentation

| Document | Contents |
| :--- | :--- |
| [`CLAUDE.md`](CLAUDE.md) | Permanent agent instructions: stack, conventions, security, git flow |
| [`docs/PRD.md`](docs/PRD.md) | Product vision, users, objectives and 3-stage roadmap |
| [`docs/tech-specs.md`](docs/tech-specs.md) | Architecture, routes, infrastructure and endpoints |
| [`docs/DESIGN.md`](docs/DESIGN.md) | Design system and the visual contract with Ágora and Babel |
| [`docs/MEMORY.md`](docs/MEMORY.md) | Project state, architecture decisions and known gotchas |
| [`docs/TODO.md`](docs/TODO.md) | JIT backlog — at most two active atomic tasks |
| [`metrics/`](metrics/) | Per-task effort and cost tracking — the source of the authorship badge above |

## License

[MIT](LICENSE).

## Support

Internal Le Tiende project. For questions or support, contact the Le Tiende team.

---

<div align="center">
<sub>Built for <b>Le Tiende</b> — theater, bookstore and café bar · Bogotá, Colombia<br/>
Sibling services: <a href="https://github.com/ocastelblanco/agora-letiende">Ágora</a> (box office) ·
<a href="https://github.com/ocastelblanco/babel-letiende">Babel</a> (bookstore) · Contact: <a href="https://github.com/ocastelblanco">@ocastelblanco</a></sub>
</div>
