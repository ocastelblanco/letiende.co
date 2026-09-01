---
name: letiende-serverless
description: |
  Gestión de despliegue y operaciones serverless para letiende.co - Angular 20 SSR en AWS Lambda con Serverless Framework 4.x.

  Usar cuando el usuario solicite:
  - Desplegar/deploy a dev o producción
  - Ver logs de Lambda/CloudWatch
  - Estado del servicio o verificar deploy
  - Gestionar secretos en AWS SSM
  - Build local para desarrollo
  - Problemas con Lambda, API Gateway, o SSR

  Triggers: "desplegar", "deploy", "deploy lambda", "logs lambda", "logs cloudwatch", "estado servicio", "verificar deploy", "secretos ssm", "build local", "serverless"
---

# letiende-serverless

Operaciones serverless para letiende.co (Angular SSR + AWS Lambda + Serverless Framework).

## Stack

| Componente | Tecnología |
|------------|------------|
| Frontend | Angular 20 SSR (zoneless) |
| Deploy | Serverless Framework 4.x |
| Runtime | AWS Lambda (Node.js 22.x) |
| Gateway | AWS API Gateway |
| Secretos | AWS SSM Parameter Store |
| Assets | AWS S3, Cloudinary |
| Backend | Firebase (Auth, Firestore) |

## Comandos principales

### Build local (desarrollo)

```bash
npm start                    # Servidor de desarrollo
npm run build:ssr:dev        # Build SSR para dev (base-href /dev/)
npm run build:ssr:prod       # Build SSR para prod (base-href /)
```

### Deploy

```bash
npm run deploy:dev           # Build + deploy a stage dev
npm run deploy:prod          # Build + deploy a producción
```

Equivalente manual:
```bash
npm run build:ssr:dev && sls deploy --stage dev
npm run build:ssr:prod && sls deploy --stage prod
```

### Logs de CloudWatch

```bash
# Logs en tiempo real (tail)
sls logs -f main --stage prod --tail
sls logs -f main --stage dev --tail

# Últimos logs (sin tail)
sls logs -f main --stage prod
sls logs -f main --stage dev

# Filtrar por tiempo
sls logs -f main --stage prod --startTime 1h
```

### Estado del servicio

```bash
# Info completa del stack
sls info --stage prod
sls info --stage dev

# Solo endpoints
sls info --stage prod | grep -A5 "endpoints"
```

### Gestión de secretos (AWS SSM)

Estructura de parámetros: `/letiende/{stage}/{NOMBRE_SECRETO}`

```bash
# Listar secretos de un stage
aws ssm get-parameters-by-path --path "/letiende/prod" --with-decryption
aws ssm get-parameters-by-path --path "/letiende/dev" --with-decryption

# Obtener un secreto específico
aws ssm get-parameter --name "/letiende/prod/FIREBASE_API_KEY" --with-decryption

# Crear/actualizar secreto
aws ssm put-parameter \
  --name "/letiende/prod/NUEVO_SECRETO" \
  --value "valor-secreto" \
  --type "SecureString" \
  --overwrite

# Eliminar secreto
aws ssm delete-parameter --name "/letiende/prod/SECRETO_OBSOLETO"
```

Script helper disponible:
```bash
./setup-secrets.sh prod      # Configura todos los secretos para prod
./setup-secrets.sh dev       # Configura todos los secretos para dev
```

Secretos requeridos:
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `FIREBASE_API_KEY`, `FIREBASE_APP_ID`, `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_MEASUREMENT_ID`, `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`

### Invocar función localmente

```bash
# Requiere Docker
sls invoke local -f main --path test-event.json
```

## Troubleshooting

### Cold start lento
- Verificar `memorySize` en serverless.yml (default: 1024MB recomendado)
- Reducir bundle size con tree-shaking

### Error "Cannot find module"
- Verificar patterns en `package.individually` de serverless.yml
- Agregar dependencia faltante a patterns

### CORS errors
- API Gateway maneja CORS automáticamente
- Verificar headers en respuesta del servidor Express

### Secretos no disponibles en Lambda
- Verificar que existen en SSM: `aws ssm get-parameter --name "/letiende/{stage}/NOMBRE"`
- Verificar región (debe ser us-east-1)
- Re-desplegar después de crear secretos

## Estructura serverless.yml

```yaml
service: letiende
provider:
  name: aws
  runtime: nodejs22.x
  region: us-east-1
  stage: ${opt:stage, 'dev'}
  environment:
    # Variables desde SSM
    CLOUDINARY_API_KEY: ${ssm:/letiende/${sls:stage}/CLOUDINARY_API_KEY}
    # ... más secretos

functions:
  main:
    handler: dist/letiende.co/server/server.handler
    events:
      - http: { method: any, path: / }
      - http: { method: any, path: /{proxy+} }
```
