# Servicio de Correo Electrónico — letiende.co

**Última actualización:** Marzo 2026

Documentación del sistema de envío y recepción de correos para el dominio `letiende.co`, implementado sobre Amazon SES, SNS y AWS Lambda.

---

## 1. Flujo de Recepción (Inbound)

```
Remitente externo
  --> DNS MX: 10 inbound-smtp.us-east-1.amazonaws.com (Route 53, TTL: 60)
  --> Amazon SES — Receipt Rule "letiende-inbound-forward"
      (Rule Set: default-rule-set | ScanEnabled: true | Recipients: letiende.co, .letiende.co)
  --> SNS Topic: letiende-email-inbound
  --> Lambda: letiende-email-forwarder
      (nodejs22.x | Lee FORWARD_MAP desde SSM | Enruta por cuenta receptora)
  --> Amazon SES SendRawEmail
  --> Gmail destino (según tabla de redirecciones)
```

### Tabla de redirecciones

| Dirección receptora | Destino Gmail | Tipo |
|---|---|---|
| `info@letiende.co` | `letiende.co@gmail.com` | Exacto |
| `eventos@letiende.co` | `leteatre.co@gmail.com` | Exacto |
| `reservas@letiende.co` | `letiende.co@gmail.com` | Exacto |
| `libreria@letiende.co` | `enrique.izquierdo73@gmail.com` | Exacto |
| cualquier otra `@letiende.co` | `letiende.co@gmail.com` | Catch-all |

### Cómo cambiar una redirección sin redesplegar código

Las redirecciones están en SSM Parameter Store y se cachean por cold start de Lambda (~15 min de inactividad). Para modificarlas:

```bash
# Ver configuración actual
aws ssm get-parameter \
  --name "/letiende/prod/EMAIL_FORWARD_MAP" \
  --region us-east-1 \
  --query "Parameter.Value" --output text | python3 -m json.tool

# Actualizar (reemplazar el JSON completo)
aws ssm put-parameter \
  --name "/letiende/prod/EMAIL_FORWARD_MAP" \
  --value '{"info@letiende.co":["letiende.co@gmail.com"],"eventos@letiende.co":["leteatre.co@gmail.com"],"reservas@letiende.co":["letiende.co@gmail.com"],"libreria@letiende.co":["enrique.izquierdo73@gmail.com"],"@letiende.co":["letiende.co@gmail.com"]}' \
  --type "String" --overwrite --region us-east-1
```

**Formato del JSON:**
- Clave exacta: `"cuenta@letiende.co": ["destino@gmail.com"]`
- Catch-all del dominio: `"@letiende.co": ["destino@gmail.com"]`
- Múltiples destinos: `["dest1@gmail.com", "dest2@gmail.com"]`

> Alternativa sin CLI: AWS Console → Systems Manager → Parameter Store → `/letiende/prod/EMAIL_FORWARD_MAP`

---

## 2. Flujo de Envío (Outbound)

```
Angular App / Formulario de contacto
  --> POST https://api.letiende.co/{id}
      Body: { destinatario, asunto, html, texto }  (id = "mensaje")
  --> Lambda: letiende-api (nodejs22.x)
      Source: process.env.SES_FROM_ADDRESS
  --> Amazon SES
  --> Destinatario final
```

### Direcciones de envío verificadas en SES

| Dirección | Propósito |
|---|---|
| `info@letiende.co` | Dirección de reenvío (FORWARDER_ADDRESS) |
| `no-responder@letiende.co` | Correos transaccionales automáticos |
| `admin@letiende.co` | Notificaciones internas |
| `eventos@letiende.co` | Comunicaciones sobre Le Teatre |
| `reservas@letiende.co` | Confirmaciones de reservas |

---

## 3. Recursos AWS

### Lambdas

| Nombre | Propósito | Runtime | Código fuente |
|---|---|---|---|
| `letiende-api` | API backend (`api.letiende.co`) | nodejs22.x | `external_resources/AWS_Lambda/` |
| `letiende-email-forwarder` | Reenvío de emails inbound | nodejs22.x | `external_resources/AWS_Lambda_EmailForwarder/` |

### API Gateway

| Nombre | ID | Stage | Custom domains |
|---|---|---|---|
| `letiende-api` | `uklz2j4u38` | `prod` | `api.letiende.co`, `api.ocastelblanco.com` |
| `nicoledickman-api` | `irbd766vff` | `prod` | `api.nicoledickman.com` |

### SNS

| Topic | ARN |
|---|---|
| `letiende-email-inbound` | `arn:aws:sns:us-east-1:696912647258:letiende-email-inbound` |

### IAM Roles

| Rol | Usado por |
|---|---|
| `letiende-email-forwarder-role` | Lambda `letiende-email-forwarder` |
| `service-role/generica-role-o1869of8` | Lambda `letiende-api` |

### SSM Parameter Store

| Parámetro | Propósito |
|---|---|
| `/letiende/prod/EMAIL_FORWARD_MAP` | Mapa de redirecciones inbound (JSON) |
| `/letiende/prod/SES_FROM_ADDRESS` | Remitente para envíos outbound |

### SES

| Atributo | Valor |
|---|---|
| Región | `us-east-1` |
| Dominio verificado | `letiende.co` — `Success` |
| DKIM | Habilitado — `Success` (3 CNAME en Route 53) |
| Producción | `ProductionAccessEnabled: true` |
| Rule Set activo | `default-rule-set` |
| Regla inbound | `letiende-inbound-forward` |

### Route 53

| Registro | Tipo | Valor | Propósito |
|---|---|---|---|
| `letiende.co` | MX | `10 inbound-smtp.us-east-1.amazonaws.com` | Recepción SES |
| `letiende.co` | TXT | `"v=spf1 include:amazonses.com ~all"` | SPF |
| `letiende.co` | TXT | `"google-site-verification=..."` | Verificación Google |
| `_dmarc.letiende.co` | TXT | `"v=DMARC1; p=none; rua=mailto:admin@letiende.co; fo=1"` | DMARC (modo monitor) |
| `*._domainkey.letiende.co` | CNAME x3 | `*.dkim.amazonses.com` | DKIM |

> **Pendiente:** Cambiar DMARC a `p=quarantine` tras 2-4 semanas de monitoreo sin problemas.

---

## 4. Convención de nombres (plantilla para otros dominios)

Patrón aplicado: `{slug}-{componente}`

| Componente | Patrón | Ejemplo |
|---|---|---|
| Lambda API backend | `{slug}-api` | `letiende-api` |
| Lambda email forwarder | `{slug}-email-forwarder` | `letiende-email-forwarder` |
| SNS Topic inbound | `{slug}-email-inbound` | `letiende-email-inbound` |
| IAM Role forwarder | `{slug}-email-forwarder-role` | `letiende-email-forwarder-role` |
| SES Receipt Rule | `{slug}-inbound-forward` | `letiende-inbound-forward` |
| SSM FORWARD_MAP | `/{slug}/prod/EMAIL_FORWARD_MAP` | `/letiende/prod/EMAIL_FORWARD_MAP` |
| API Gateway | `{slug}-api` | `letiende-api` |
| API Gateway Stage | `prod` | `prod` |

### Slugs por dominio

| Dominio | Slug |
|---|---|
| `letiende.co` | `letiende` ✓ migrado |
| `adi.com.co` | `adi` ✓ migrado |
| `bar23.co` | `bar23` ✓ migrado |
| `nicoledickman.com` | `nicoledickman` ✓ migrado (API) |
| `mediateca-se.com` | `mediateca-se` |
| `ocastelblanco.com` | `ocastelblanco` |
| `acgcalidad.co` | `acgcalidad` |
| `conectatech.co` | `conectatech` |

---

## 5. Redespliegue de la Lambda de reenvío

```bash
cd external_resources/AWS_Lambda_EmailForwarder
zip -j function.zip index.mjs

aws lambda update-function-code \
  --function-name letiende-email-forwarder \
  --zip-file fileb://function.zip \
  --region us-east-1

aws lambda wait function-updated \
  --function-name letiende-email-forwarder \
  --region us-east-1
```

## 6. Redespliegue de la Lambda API

```bash
cd external_resources/AWS_Lambda
zip -r /tmp/letiende-api.zip index.mjs libs/

aws lambda update-function-code \
  --function-name letiende-api \
  --zip-file fileb:///tmp/letiende-api.zip \
  --region us-east-1
```

---

## 7. Monitoreo

- **Logs forwarder:** CloudWatch → `/aws/lambda/letiende-email-forwarder`
- **Logs API:** CloudWatch → `/aws/lambda/letiende-api`
- **Métricas SES:** Consola SES → Account dashboard (bounces, complaints)
