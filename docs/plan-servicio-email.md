# Plan de Implementación: Servicio de Correo Electrónico para letiende.co

**Estado:** Pendiente de aprobación
**Fecha:** Marzo 2026
**Autor:** Claude Code (análisis y propuesta)

---

## 1. Levantamiento del Sistema Actual (verificado con AWS CLI)

### 1.1 Arquitectura real en producción

El sistema de recepción de correos ya está implementado en AWS y funciona con la siguiente arquitectura — **distinta** al patrón documentado en `AWS_EMAIL_SYSTEM.md` (que usa S3 como intermediario):

```
Remitente externo
  --> MX record (Route 53) --> SES Receipt Rule
  --> SNS Topic
  --> Lambda (EmailForwarding-info-letie-SESEmailForwardFunction-YnegcJHhg7Wi)
  --> SES SendEmail
  --> letiende.co@gmail.com  (único destino actual)
```

El sistema actual es funcional pero limitado: **todos los correos dirigidos a cualquier dirección `@letiende.co` llegan al mismo buzón Gmail** (`letiende.co@gmail.com`), sin diferenciación por cuenta.

### 1.2 Inventario de componentes AWS

#### Route 53 — Zona `letiende.co` (ID: `Z010633738KAGFIPOZVEW`)

| Registro | Tipo | Valor | Estado |
|---|---|---|---|
| `letiende.co` | MX | `10 inbound-smtp.us-east-1.amazonaws.com` | Activo (TTL: 60) |
| `letiende.co` | TXT | `google-site-verification=...` | Activo |
| `3eszvapvb2ml3h3bav63xi2g4bginyz3._domainkey` | CNAME | `*.dkim.amazonses.com` | Activo |
| `pb7a7epjxz6ishf3hxadold544kdcrcv._domainkey` | CNAME | `*.dkim.amazonses.com` | Activo |
| `u2dplvo2l3keqyu7b7hxcxzoiuoxzdx3._domainkey` | CNAME | `*.dkim.amazonses.com` | Activo |

**Ausentes:** Registro SPF (TXT), registro DMARC (`_dmarc.letiende.co`).

#### SES — Identidades y recepción

- **Verificación del dominio:** `Success`
- **DKIM:** Habilitado, `DkimVerificationStatus: Success` (3 tokens)
- **Producción (sandbox):** `ProductionAccessEnabled: True` — ya fuera del sandbox
- **Rule set activo:** `default-rule-set`
- **Regla activa para letiende.co:** `email-forwarding-letiende.co`
  - Recipients: `letiende.co` y `.letiende.co` (catch-all)
  - Acción: `SNSAction` → topic `EmailForwarding-info-letiende-co-SNSEmailReceiveTopic-sd44ENmKrbSZ`

#### SNS

| Topic | ARN | Propósito |
|---|---|---|
| `EmailForwarding-info-letiende-co-SNSEmailReceiveTopic-sd44ENmKrbSZ` | `arn:aws:sns:us-east-1:696912647258:...` | Intermediario SES → Lambda para letiende.co |

Suscripción: protocolo `lambda` → `EmailForwarding-info-letie-SESEmailForwardFunction-YnegcJHhg7Wi`

#### Lambda — Función de reenvío actual

| Atributo | Valor |
|---|---|
| Nombre | `EmailForwarding-info-letie-SESEmailForwardFunction-YnegcJHhg7Wi` |
| ARN | `arn:aws:lambda:us-east-1:696912647258:function:EmailForwarding-info-letie-SESEmailForwardFunction-YnegcJHhg7Wi` |
| Runtime | **nodejs14.x** (End of Life — obsoleto) |
| Timeout | 30 segundos |
| Memoria | 128 MB |
| Creada por | CloudFormation stack `EmailForwarding-info-letiende-co` |
| Variable `from_address` | `info@letiende.co` |
| Variable `to_address` | `letiende.co@gmail.com` (único destino, para todas las cuentas) |
| Última modificación | 2023-06-06 |

#### CloudFormation — Stack `EmailForwarding-info-letiende-co`

Gestiona la Lambda, el SNS topic y sus permisos. Los parámetros actuales son:
- `FromAddress`: `info@letiende.co`
- `ToAddress`: `letiende.co@gmail.com`

#### Lambda — Función de envío saliente

- **Nombre:** `letiende-api`
- **ARN:** `arn:aws:lambda:us-east-1:696912647258:function:letiende-api`
- **Endpoint relevante:** `POST /mensaje` — usa `@aws-sdk/client-ses` con `SendEmailCommand`
- **Problema:** Remitente hardcodeado en `funciones.mjs` como `'info@ocastelblanco.com'` (dominio personal, no de Le Tiende)

### 1.3 Diagnóstico del estado actual

| Componente | Estado | Brecha |
|---|---|---|
| MX record apuntando a SES | Activo y correcto | Ninguna |
| Verificación de dominio SES | `Success` | Ninguna |
| DKIM (3 CNAME) | Habilitado y verificado | Ninguna |
| SPF | **Ausente** | Agregar registro TXT |
| DMARC | **Ausente** | Agregar registro TXT |
| Producción SES (fuera de sandbox) | `True` | Ninguna |
| Recepción y reenvío (SNS → Lambda) | Funciona, pero solo a un Gmail | Agregar mapeo por cuenta |
| Runtime de la Lambda de reenvío | **nodejs14.x (EOL)** | Actualizar a nodejs20.x |
| Mapeo de cuentas (`info@`, `eventos@`, etc.) | **No existe** | Implementar FORWARD_MAP |
| Envío desde Lambda `letiende-api` | Funciona pero con remitente incorrecto | Cambiar `Source` a `@letiende.co` |

---

## 2. Arquitectura Propuesta

### 2.1 Cuentas de correo a implementar

#### Recepción (inbound)

| Dirección | Propósito | Redirige a Gmail |
|---|---|---|
| `info@letiende.co` | Información general | (confirmar con propietario) |
| `eventos@letiende.co` | Consultas sobre Le Teatre y eventos | (confirmar con propietario) |
| `reservas@letiende.co` | Reservas de espacio o mesa | (confirmar con propietario) |
| `libreria@letiende.co` | Consultas sobre la librería | (confirmar con propietario) |
| catch-all `@letiende.co` | Cualquier otra dirección | (confirmar con propietario) |

> **Accion requerida:** El propietario debe confirmar los destinos Gmail de cada cuenta antes de ejecutar.

#### Envío (outbound) — a verificar en SES

| Dirección | Propósito |
|---|---|
| `no-responder@letiende.co` | Correos transaccionales automáticos |
| `info@letiende.co` | Respuestas desde la interfaz admin |
| `admin@letiende.co` | Notificaciones internas del sistema |

### 2.2 Arquitectura propuesta (evolutiva, no disruptiva)

Se mantiene el patrón existente **SES → SNS → Lambda** por ser el que ya está en producción y validado. La mejora consiste en actualizar la Lambda existente para que soporte múltiples destinos según la cuenta receptora.

```
RECEPCION (sin cambios estructurales)
--------------------------------------
Remitente externo
  --> MX (ya apunta a SES, TTL: 60)
  --> SES Receipt Rule (default-rule-set)
  --> SNS Topic (existente)
  --> Lambda ACTUALIZADA (nodejs20.x + FORWARD_MAP)
  --> SES SendRawEmail
  --> Gmail correspondiente (info@, eventos@, reservas@, etc.)

ENVIO (corrección puntual)
--------------------------------------
Angular App / Formulario de contacto
  --> POST /mensaje (api.letiende.co)
  --> Lambda `letiende-api` (corrección de Source)
  --> SES SendEmailCommand
  --> Destinatario
```

### 2.3 Cambios requeridos por componente

| Componente | Tipo de cambio | Impacto en producción |
|---|---|---|
| Lambda de reenvío | Actualizar runtime + lógica de FORWARD_MAP | Hay ventana breve sin reenvío durante deploy |
| `funciones.mjs` (Lambda `letiende-api`) | Cambiar `Source` hardcodeado a variable de entorno | Bajo |
| SSM Parameter Store | Agregar `/letiende/{stage}/SES_FROM_ADDRESS` | Ninguno |
| SES — verificar identidades de email | Verificar nuevas direcciones (`eventos@`, `reservas@`, etc.) | Ninguno |
| Route 53 — SPF | Agregar registro TXT SPF | Ninguno (mejora reputación) |
| Route 53 — DMARC | Agregar registro TXT DMARC | Ninguno (modo monitor inicial) |

**No se requiere:**
- Cambiar el registro MX (ya correcto)
- Verificar el dominio en SES (ya verificado, `Success`)
- Configurar DKIM (ya configurado)
- Crear bucket S3 (la arquitectura SNS no lo requiere)
- Solicitar salida del sandbox (ya está en producción)

---

## 3. Plan de Ejecución por Fases

### Fase 0 — Diagnóstico (COMPLETADO)

Los hallazgos del levantamiento con AWS CLI confirman:

- [x] MX correcto (`inbound-smtp.us-east-1.amazonaws.com`, TTL 60)
- [x] Dominio verificado en SES (`Success`)
- [x] DKIM habilitado y verificado (`Success`)
- [x] SES fuera de sandbox (`ProductionAccessEnabled: True`)
- [ ] SPF — **Ausente**
- [ ] DMARC — **Ausente**

---

### Fase 1 — SPF y DMARC (sin impacto en producción)

**Objetivo:** Completar la autenticación de correo para mejorar la reputación del dominio y evitar que los reenvíos caigan en spam.

**Paso 1.1 — Agregar registro SPF en Route 53:**

> Atención: el registro TXT actual de `letiende.co` contiene solo `google-site-verification`. SPF debe ir en el **mismo registro TXT** (un solo registro TXT con múltiples valores, o un segundo string dentro del mismo registro). Verificar primero el estado exacto antes de modificar.

```bash
# Verificar el registro TXT actual completo
aws route53 list-resource-record-sets \
  --hosted-zone-id Z010633738KAGFIPOZVEW \
  --query "ResourceRecordSets[?Type=='TXT' && Name=='letiende.co.']" \
  --output json
```

Luego, mediante la consola de Route 53 o un `change-resource-record-sets`, actualizar el registro TXT de `letiende.co` para que contenga **ambos** valores:
```
"google-site-verification=URTZs6K9MIUY3U0dNyINjHv7xA9tjgyqe05RMhN-uzE"
"v=spf1 include:amazonses.com ~all"
```

**Paso 1.2 — Agregar registro DMARC en Route 53:**

Crear un nuevo registro TXT:
```
Nombre: _dmarc.letiende.co
Tipo:   TXT
TTL:    300
Valor:  "v=DMARC1; p=none; rua=mailto:admin@letiende.co; fo=1"
```

> Se usa `p=none` (modo monitoreo). Después de 2-4 semanas sin problemas, cambiar a `p=quarantine`.

---

### Fase 2 — Verificar nuevas identidades de email en SES

**Objetivo:** Habilitar las nuevas direcciones remitentes antes de usarlas.

```bash
aws ses verify-email-identity --email-address no-responder@letiende.co --region us-east-1
aws ses verify-email-identity --email-address eventos@letiende.co --region us-east-1
aws ses verify-email-identity --email-address reservas@letiende.co --region us-east-1
aws ses verify-email-identity --email-address admin@letiende.co --region us-east-1
```

> Los correos de verificación llegarán a `letiende.co@gmail.com` (el destino actual del catch-all) y deben confirmarse desde allí.

---

### Fase 3 — Corrección del envío saliente (Lambda `letiende-api`)

**Objetivo:** Corregir el remitente hardcodeado en `funciones.mjs`.

**Paso 3.1 — Agregar parámetro en SSM:**
```bash
aws ssm put-parameter \
  --name "/letiende/dev/SES_FROM_ADDRESS" \
  --value "no-responder@letiende.co" \
  --type "String" --region us-east-1

aws ssm put-parameter \
  --name "/letiende/prod/SES_FROM_ADDRESS" \
  --value "no-responder@letiende.co" \
  --type "String" --region us-east-1
```

**Paso 3.2 — Modificar `funciones.mjs`:**
```javascript
// Línea 86 actual:
Source: 'info@ocastelblanco.com',

// Cambiar a:
Source: process.env.SES_FROM_ADDRESS || 'no-responder@letiende.co',
```

**Paso 3.3 — Agregar variable al `serverless.yml` de la Lambda `letiende-api`** y redesplegar.

**Paso 3.4 — Verificar permisos IAM** del rol de `generica` (debe tener `ses:SendEmail` y `ses:SendRawEmail`).

---

### Fase 4 — Actualización de la Lambda de reenvío (cambio principal)

**Objetivo:** Reemplazar la lógica actual de destino único por un mapeo flexible de cuentas, y actualizar el runtime obsoleto (nodejs14.x → nodejs20.x).

> La Lambda actual fue desplegada via CloudFormation (`EmailForwarding-info-letiende-co`). Hay dos opciones:
>
> **Opción A (recomendada):** Actualizar el código directamente con `aws lambda update-function-code` y cambiar el runtime. Más simple, sin tocar la infraestructura CloudFormation.
>
> **Opción B:** Actualizar el stack CloudFormation para incluir el nuevo código y parámetros. Más limpio a largo plazo pero requiere modificar el template original.
>
> Se recomienda la **Opción A** para rapidez y menor riesgo.

**Paso 4.1 — Confirmar el FORWARD_MAP con el propietario:**

```json
{
  "info@letiende.co": ["<gmail-info>"],
  "eventos@letiende.co": ["<gmail-eventos>"],
  "reservas@letiende.co": ["<gmail-reservas>"],
  "libreria@letiende.co": ["<gmail-libreria>"],
  "@letiende.co": ["<gmail-catch-all>"]
}
```

**Paso 4.2 — Guardar el FORWARD_MAP en SSM:**
```bash
aws ssm put-parameter \
  --name "/letiende/prod/EMAIL_FORWARD_MAP" \
  --value '{"info@letiende.co":["..."],"eventos@letiende.co":["..."]}' \
  --type "String" --region us-east-1
```

**Paso 4.3 — Nuevo código de la Lambda (nodejs20.x):**

La función recibe eventos de SNS (no de S3). El evento contiene el correo completo como string en `event.Records[0].Sns.Message`. La nueva lógica debe:

1. Parsear el mensaje SNS (que contiene el raw email como JSON de SES)
2. Extraer el destinatario original del campo `mail.destination`
3. Buscar en el FORWARD_MAP el destino Gmail correspondiente
4. Reenviar usando `SES.SendRawEmail` preservando el asunto, remitente y cuerpo originales

**Paso 4.4 — Actualizar runtime y variables de entorno:**
```bash
# Actualizar runtime
aws lambda update-function-configuration \
  --function-name EmailForwarding-info-letie-SESEmailForwardFunction-YnegcJHhg7Wi \
  --runtime nodejs20.x \
  --environment "Variables={FORWARD_MAP='<json>',FORWARDER_ADDRESS=forwarder@letiende.co}" \
  --region us-east-1

# Subir nuevo código
zip -r function.zip index.mjs
aws lambda update-function-code \
  --function-name EmailForwarding-info-letie-SESEmailForwardFunction-YnegcJHhg7Wi \
  --zip-file fileb://function.zip \
  --region us-east-1
```

**Paso 4.5 — Prueba end-to-end:**

Enviar correos externos a cada cuenta (`info@`, `eventos@`, `reservas@`) y verificar que llegan al Gmail correcto. Monitorear CloudWatch Logs del grupo `/aws/lambda/EmailForwarding-info-letie-SESEmailForwardFunction-YnegcJHhg7Wi`.

---

### Fase 5 — Monitoreo y endurecimiento DMARC

**Objetivo:** Observabilidad y seguridad a largo plazo.

**Paso 5.1 — Alarmas en CloudWatch:**
- Errores en la Lambda de reenvío (`Errors` > 0 en 5 minutos)
- Tasa de bounces SES (> 5% es crítico según AWS)
- Tasa de complaints SES (> 0.1% es crítico)

**Paso 5.2 — Endurecer DMARC** (después de 2-4 semanas de monitoreo sin problemas):

Cambiar el registro DMARC de `p=none` a `p=quarantine`:
```
"v=DMARC1; p=quarantine; rua=mailto:admin@letiende.co; fo=1"
```

---

## 4. Riesgos y Medidas de Mitigación

### Riesgo 1 — Interrupción durante el deploy de la Lambda de reenvío
- **Impacto:** MEDIO — correos que lleguen durante el deploy pueden no ser reenviados
- **Probabilidad:** BAJA (el deploy de Lambda es rápido, generalmente < 30 segundos)
- **Mitigación:** Ejecutar el deploy en horario de baja actividad (noche). Los mensajes SNS que no sean procesados serán reintentados automáticamente (SNS tiene reintentos configurados por defecto).

### Riesgo 2 — Correos cayendo en spam al agregar múltiples destinos
- **Impacto:** MEDIO — correos reenviados marcados como spam en Gmail
- **Probabilidad:** BAJA con SPF y DKIM correctos
- **Mitigación:** Configurar SPF (Fase 1) antes de modificar la Lambda. DKIM ya está funcionando. Revisar headers en los correos de prueba.

### Riesgo 3 — Remitente `ocastelblanco.com` en correos salientes
- **Impacto:** MEDIO — daña la identidad de marca de Le Tiende
- **Probabilidad:** Está ocurriendo ahora mismo
- **Mitigación:** La Fase 3 corrige esto. Es prioritaria y de bajo riesgo.

### Riesgo 4 — Runtime nodejs14.x en la Lambda de reenvío
- **Impacto:** ALTO a largo plazo — seguridad y compatibilidad
- **Probabilidad:** Certeza (EOL desde abril 2023)
- **Mitigación:** Actualizar a nodejs20.x en la Fase 4. La API de SNS y SES SDK no ha cambiado de forma incompatible.

### Riesgo 5 — FORWARD_MAP incorrecto tras el deploy
- **Impacto:** ALTO — correos llegan al Gmail equivocado
- **Probabilidad:** BAJA si se confirma el mapa con el propietario antes
- **Mitigación:** Confirmar el mapa en el Paso 4.1. Probar cada cuenta individualmente en el Paso 4.5 antes de comunicar los cambios externamente.

### Riesgo 6 — SPF rompe configuración existente
- **Impacto:** MEDIO — si el registro TXT se sobrescribe incorrectamente, la verificación de Google puede fallar
- **Probabilidad:** BAJA si se sigue el procedimiento correcto (agregar valor, no reemplazar)
- **Mitigación:** Verificar el registro TXT exacto antes de modificarlo (Paso 1.1). Agregar el SPF como un valor adicional dentro del mismo registro, no como registro nuevo separado.

---

## 5. Consideraciones Adicionales

### Costos (sin cambios respecto al estado actual)
El sistema ya opera dentro del Free Tier de AWS. Las mejoras propuestas no incrementan el costo:
- Lambda, SNS, SES: sin costo adicional para el volumen de Le Tiende
- Route 53: registros adicionales (SPF, DMARC) sin costo extra por registro

### Deuda técnica identificada (fuera del alcance de este plan)
- Runtime **nodejs14.x** en las Lambdas `EmailForwarding-adi-com-co-*` y `SESEmailForward-*` (para otros dominios del propietario — no de letiende.co)
- El stack CloudFormation `EmailForwarding-info-letiende-co` quedará desactualizado si se actualiza el código directamente (Opción A). Considerar reconciliarlo con el estado real en el futuro.

### Futuras mejoras (fuera del alcance de este plan)
- Interfaz admin en Angular para enviar correos desde `info@letiende.co` usando el endpoint `/mensaje` ya existente
- Soporte para correos con adjuntos en el reenvío
- Panel de métricas de bounces/complaints

---

## 6. Checklist de Ejecución

### Preparación (antes de empezar)
- [ ] Propietario confirma lista de cuentas y destinos Gmail
- [ ] Propietario confirma destino catch-all

### Fase 1 — SPF y DMARC
- [ ] Verificar registro TXT actual de `letiende.co` (no sobreescribir google-site-verification)
- [ ] Registro SPF agregado al TXT existente
- [ ] Registro `_dmarc.letiende.co` creado con `p=none`
- [ ] Propagación confirmada con `dig TXT letiende.co` y `dig TXT _dmarc.letiende.co`

### Fase 2 — Identidades SES
- [ ] `no-responder@letiende.co` verificado
- [ ] `eventos@letiende.co` verificado
- [ ] `reservas@letiende.co` verificado
- [ ] `admin@letiende.co` verificado
- [ ] Emails de verificación confirmados desde `letiende.co@gmail.com`

### Fase 3 — Corrección de envío
- [ ] Parámetro SSM `SES_FROM_ADDRESS` creado en dev y prod
- [ ] `funciones.mjs` modificado (línea 86: `Source` desde variable de entorno)
- [ ] Lambda `letiende-api` redesplegada
- [ ] Prueba: correo de prueba llega desde `no-responder@letiende.co`

### Fase 4 — Lambda de reenvío actualizada
- [ ] FORWARD_MAP confirmado con propietario
- [ ] FORWARD_MAP guardado en SSM
- [ ] Nuevo código `index.mjs` escrito para Node.js 20.x con soporte SNS + FORWARD_MAP
- [ ] Runtime actualizado a nodejs20.x
- [ ] Variables de entorno actualizadas
- [ ] Prueba: correo a `info@letiende.co` llega al Gmail correcto
- [ ] Prueba: correo a `eventos@letiende.co` llega al Gmail correcto
- [ ] Prueba: correo a dirección desconocida llega al catch-all

### Fase 5 — Monitoreo
- [ ] Alarmas CloudWatch configuradas
- [ ] (2-4 semanas después) DMARC cambiado a `p=quarantine`

---

## 7. Información Pendiente del Propietario

1. **Destinos Gmail por cuenta de recepción:**
   - `info@letiende.co` → ?
   - `eventos@letiende.co` → ?
   - `reservas@letiende.co` → ?
   - `libreria@letiende.co` → ? (¿se necesita?)
   - catch-all `@letiende.co` → ¿sigue siendo `letiende.co@gmail.com`?

2. **Ventana de mantenimiento preferida** para el deploy de la Lambda de reenvío (Fase 4).
