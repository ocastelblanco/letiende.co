# Runbook — T-15: cutover de `letiende.co` a la distribución nueva

Guía de ejecución para el único paso que falta de T-15 (`tech-specs.md` §11): mover
`letiende.co`/`www.letiende.co` de la distribución de CloudFront vieja (el sitio estático anterior)
a la nueva (este stack). Es una acción sobre DNS/CDN de producción — **requiere que un humano decida
cuándo ejecutarla y la confirme en el momento**, no la dispara ningún agente por su cuenta
(`docs/TODO.md`).

Este documento existe para que, cuando se decida ejecutar, sea copiar y pegar comandos ya verificados
contra el estado real de la cuenta — no investigar en caliente. Es exactamente la ventana de tiempo
que hay que acortar: CloudFront no permite el mismo alias en dos distribuciones a la vez (ADR-006,
`docs/MEMORY.md`), así que entre el paso 1 y el paso 3 `letiende.co` no responde. El objetivo de este
runbook es que esa ventana dure minutos, no que desaparezca — no se puede evitar del todo con la
arquitectura actual de CloudFront.

## Estado verificado (04/09/2026, contra la cuenta real — no de memoria)

| Recurso | Estado |
|---|---|
| Distribución vieja | `E33QAN86FY24JZ` → `d1gbhem25hsxvv.cloudfront.net`. Aliases: `letiende.co`, `www.letiende.co`. Certificado propio: `ca9cd231-…` |
| Distribución nueva (producción) | `ER22S2WADMM83` → `d1o48r8wylv3sh.cloudfront.net`. Aliases: **ninguno todavía** (`CloudFrontDefaultCertificate: true`) |
| Certificado ACM | `arn:aws:acm:us-east-1:696912647258:certificate/ca9cd231-0aef-40ad-88dc-b8dc8369441b` — `ISSUED`, cubre `letiende.co` y `www.letiende.co` (SAN), vence 2027-01-28. No es exclusivo de una distribución: se puede referenciar desde ambas a la vez sin conflicto |
| Registro Route 53 | Zona `Z010633738KAGFIPOZVEW`. `letiende.co`/`www.letiende.co` tipo A, alias a `d1gbhem25hsxvv.cloudfront.net` (zona de alias fija `Z2FDTNDATAQYW2`, la misma para cualquier distribución). También existen `MX` (SES inbound), `TXT` (verificación de Google, SPF), `NS`, `SOA` — **no tocar ninguno de esos**, solo los dos registros `A` |
| Proxy embebido (Ágora/Babel) | Verificado en vivo contra `staging.letiende.co/cartelera` y `/libros`: barra común presente, `GET /cartelera/api/eventos-publicos` → 200. El mecanismo (`x-le-tiende-host`, `EmbebidoService.esEmbebido()`) ya está en producción de Ágora y Babel |
| Encabezados de seguridad | Resueltos (T-0015, PR #25) en las tres distribuciones relevantes |
| PR de este repo | `infra/prepara-cutover-t15` — agrega `Aliases`/`ViewerCertificate` de producción a `serverless.yml`. **Ver advertencia de orden de fusión más abajo** |

## Prerrequisitos antes de empezar

- [ ] El PR `infra/prepara-cutover-t15` está aprobado, con CI en verde, listo para fusionar (pero
      **todavía sin fusionar** — ver el paso 2).
- [ ] Hora de bajo tráfico elegida (el corte de DNS es visible para visitantes reales mientras dura).
- [ ] Acceso de consola/CLI con permisos sobre CloudFront, ACM (lectura) y Route 53 en la cuenta
      `696912647258`.
- [ ] `aws` CLI configurado y `jq` instalado en la máquina desde donde se ejecuta.

## Secuencia de ejecución

### Paso 1 — Quitar el alias de la distribución vieja

```bash
aws cloudfront get-distribution-config --id E33QAN86FY24JZ > /tmp/dist-vieja.json
ETAG_VIEJA=$(jq -r '.ETag' /tmp/dist-vieja.json)

jq '.DistributionConfig
    | .Aliases = {Quantity: 0, Items: []}
    | .ViewerCertificate = {CloudFrontDefaultCertificate: true, MinimumProtocolVersion: "TLSv1", CertificateSource: "cloudfront"}' \
  /tmp/dist-vieja.json > /tmp/dist-vieja-config.json

aws cloudfront update-distribution \
  --id E33QAN86FY24JZ \
  --if-match "$ETAG_VIEJA" \
  --distribution-config file:///tmp/dist-vieja-config.json

aws cloudfront wait distribution-deployed --id E33QAN86FY24JZ
```

El `wait` tarda varios minutos (es normal). Desde que este paso empieza a propagar, `letiende.co`
deja de responder correctamente hasta el paso 3 — es el costo inherente de esta migración, no un
error.

### Paso 2 — Fusionar el PR `infra/prepara-cutover-t15`

Solo **después** de que el paso 1 termine (`wait` sin error). Fusionar dispara
`desplegar-produccion` (`.github/workflows/deploy.yml`), que aplica el `Alias`
(`letiende.co`/`www.letiende.co`) y el certificado a `ER22S2WADMM83` vía CloudFormation.

```bash
gh pr checks <número-del-pr> --watch   # esperar a que build-y-test / desplegar-produccion terminen en verde
```

Si este paso falla con `CNAMEAlreadyExists`, el paso 1 no había terminado de propagar — repetir el
`wait` del paso 1 y reintentar el deploy (`gh workflow run` o un nuevo push vacío al PR).

### Paso 3 — Verificar la distribución nueva

```bash
aws cloudfront get-distribution --id ER22S2WADMM83 \
  | jq '{Status: .Distribution.Status, Aliases: .Distribution.DistributionConfig.Aliases, Cert: .Distribution.DistributionConfig.ViewerCertificate}'
```

Debe mostrar `Status: "Deployed"` y `Aliases.Items` con ambos dominios.

### Paso 4 — Mover el registro de Route 53

```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id Z010633738KAGFIPOZVEW \
  --change-batch '{
    "Comment": "Cutover T-15: letiende.co -> distribución nueva ER22S2WADMM83",
    "Changes": [
      {
        "Action": "UPSERT",
        "ResourceRecordSet": {
          "Name": "letiende.co",
          "Type": "A",
          "AliasTarget": {
            "HostedZoneId": "Z2FDTNDATAQYW2",
            "DNSName": "d1o48r8wylv3sh.cloudfront.net",
            "EvaluateTargetHealth": false
          }
        }
      },
      {
        "Action": "UPSERT",
        "ResourceRecordSet": {
          "Name": "www.letiende.co",
          "Type": "A",
          "AliasTarget": {
            "HostedZoneId": "Z2FDTNDATAQYW2",
            "DNSName": "d1o48r8wylv3sh.cloudfront.net",
            "EvaluateTargetHealth": false
          }
        }
      }
    ]
  }'
```

`UPSERT` solo reemplaza estos dos registros `A` — `MX`/`TXT`/`NS`/`SOA` quedan intactos.

## Verificación posterior (todas contra `https://letiende.co`, con navegador real y `curl`)

- [ ] `curl -I https://letiende.co/` → `200`, certificado válido (no el de CloudFront por defecto).
- [ ] `curl https://letiende.co/robots.txt` → `Allow: /` (antes de esto, en la distribución vieja
      servía el sitio estático; verificar que ya no es ese contenido).
- [ ] `/`, `/nosotros`, `/contacto`, `/preguntas-frecuentes` — header/footer y contenido del
      contenedor, sin regresión visual.
- [ ] `/cartelera/` y `/libros/` — barra común presente (no la de Ágora/Babel en solitario), sin el
      mensaje "No se pudieron cargar los eventos"/"No se pudo cargar el catálogo".
- [ ] Formulario de `/contacto` — un envío de prueba real llega por correo (SES).
- [ ] Google Analytics 4 dispara (ADR-015: solo en host `letiende.co`, ya lo era antes del cutover).

## Reversión (si algo sale mal)

En orden inverso:

1. Route 53 — repetir el `change-resource-record-sets` del paso 4 con `DNSName` de vuelta a
   `d1gbhem25hsxvv.cloudfront.net`.
2. Quitar el alias de `ER22S2WADMM83` (mismo patrón `get-distribution-config` → editar `Aliases`
   a `{Quantity: 0, Items: []}` y `ViewerCertificate` a `CloudFrontDefaultCertificate: true` →
   `update-distribution` con su propio `ETag`) — necesario antes de poder devolvérselo a la vieja.
3. Volver a poner `letiende.co`/`www.letiende.co` y `ca9cd231-…` en `E33QAN86FY24JZ` (mismo patrón,
   `Aliases: {Quantity: 2, Items: ["letiende.co", "www.letiende.co"]}` y el `ViewerCertificate`
   original).

El paso 2 (revertir el PR fusionado) es opcional para una reversión rápida: mientras el alias no esté
en `ER22S2WADMM83`, que el código de `serverless.yml` lo siga declarando no afecta a nadie. Revertir
el PR con un nuevo commit es la vía correcta si la reversión es definitiva, no un rollback temporal.

## Seguimiento después del cutover (fuera de este repositorio)

- **Ágora y Babel:** restaurar la rama de redirección cross-domain que quedó comentada
  (`tech-specs.md`, hallazgo séptimo de T-0013/T-0014) — responsabilidad de quien ejecute este
  cutover, en esos dos repos, no en este.
- Limpieza opcional, sin apuro: el bucket S3 del sitio estático viejo y la distribución
  `E33QAN86FY24JZ` quedan sin tráfico real tras el cutover; se pueden desmontar en una tarea aparte
  una vez confirmado que todo funciona en producción por unos días.
