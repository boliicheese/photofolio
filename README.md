# PhotoFolio

Portfolio personal de fotografía — Bolivar Barrios.

Stack: Node.js + Express · Drizzle ORM · PostgreSQL (RDS) · S3 · EJS · Vite

---

## Requisitos locales

- Node.js 20+
- PostgreSQL (local o acceso a RDS)
- Cuenta AWS con S3 y SES configurados

---

## Setup local

```bash
cp .env.example .env
# Edita .env con tus credenciales

npm install

# Build de assets (Vite)
npm run build

# Generar y correr migrations
npm run migrate:generate   # genera SQL en /migrations
npm run migrate            # aplica migrations a la DB

# Crear admin user
npm run seed

# Iniciar servidor
npm run dev
```

El servidor corre en `http://localhost:3000`.

---

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto del servidor (default: 3000) |
| `NODE_ENV` | `development` o `production` |
| `SESSION_SECRET` | Secret para firmar cookies (mín. 32 chars aleatorios) |
| `DB_HOST` | Endpoint de RDS |
| `DB_PORT` | Puerto Postgres (default: 5432) |
| `DB_NAME` | Nombre de la base de datos |
| `DB_USER` | Usuario de Postgres |
| `DB_PASSWORD` | Password de Postgres |
| `AWS_REGION` | Región AWS (e.g., `us-east-1`) |
| `S3_BUCKET` | Nombre del bucket S3 |
| `AWS_ACCESS_KEY_ID` | Solo en desarrollo local — usa IAM role en EC2 |
| `AWS_SECRET_ACCESS_KEY` | Solo en desarrollo local |
| `ADMIN_EMAIL` | Email del admin (usado por `npm run seed`) |
| `ADMIN_PASSWORD` | Password del admin (mín. 12 chars) |
| `MAIL_FROM` | Dirección verificada en SES para enviar notificaciones |
| `CONTACT_TO` | Dirección que recibe los mensajes de contacto |

En EC2 en producción, **no** uses `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`.
Adjunta un IAM instance role con permisos mínimos al EC2.

---

## Migrations

```bash
# Generar migration a partir del schema
npm run migrate:generate

# Aplicar migrations pendientes
npm run migrate
```

Los archivos SQL generados viven en `/migrations`. Commitearlos al repo es lo correcto.

---

## Pipeline de imágenes

Cada foto sube a S3 con 4 archivos:

| Archivo | Tamaño máx | Calidad |
|---------|-----------|---------|
| `original.jpg` | Como viene (máx 10 MB) | Sin procesar (privado) |
| `thumb.jpg` | 400px long edge | JPEG q75 mozjpeg |
| `medium.jpg` | 1200px long edge | JPEG q82 mozjpeg |
| `full.jpg` | 2400px long edge | JPEG q85 mozjpeg |

**Capacidad estimada:** 5 GB S3 free tier ÷ ~10–13 MB/foto ≈ **~400–500 fotos** antes del límite de almacenamiento.
PUT requests: 4 por foto → 2,000/mes free tier → ~500 fotos/mes de capacidad de subida.

---

## Despliegue en AWS (Free Tier)

### Infraestructura
- **EC2** `t3.micro` + Elastic IP — compute (750 hrs/mes gratis × 12 meses)
- **RDS** `db.t3.micro` PostgreSQL single-AZ — base de datos
- **S3** — almacenamiento de fotos
- **SES** — email de notificaciones (gratuito desde EC2)
- **Nginx** — reverse proxy + HTTPS
- **PM2** — process manager

### En el EC2

```bash
# Instalar dependencias del sistema
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2 globalmente
sudo npm install -g pm2

# Clonar repo
git clone git@github.com:tu-usuario/photofolio.git
cd photofolio

# Configurar variables de entorno
cp .env.example .env
nano .env   # llenar todos los valores reales; eliminar las claves AWS (se usa IAM role)

# Instalar dependencias y buildar
npm install
npm run build
npm run migrate
npm run seed

# Iniciar con PM2
pm2 start src/server.js --name photofolio
pm2 save
pm2 startup   # seguir las instrucciones que imprime
```

### Nginx config (`/etc/nginx/sites-available/photofolio`)

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/photofolio /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# HTTPS con Let's Encrypt (gratis)
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

### S3 bucket policy (variantes públicas únicamente)

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadVariants",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": [
      "arn:aws:s3:::TU_BUCKET/photos/*/thumb.jpg",
      "arn:aws:s3:::TU_BUCKET/photos/*/medium.jpg",
      "arn:aws:s3:::TU_BUCKET/photos/*/full.jpg"
    ]
  }]
}
```

`original.jpg` **no** está en esta policy → acceso privado solo desde EC2 vía IAM role.

### CORS del bucket S3 (para pre-signed PUT desde el browser)

```json
[{
  "AllowedHeaders": ["*"],
  "AllowedMethods": ["PUT"],
  "AllowedOrigins": ["https://tudominio.com"],
  "ExposeHeaders": []
}]
```

### IAM role del EC2 (política mínima)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::TU_BUCKET/photos/*"
    },
    {
      "Effect": "Allow",
      "Action": "ses:SendEmail",
      "Resource": "*"
    }
  ]
}
```

---

## SES: de sandbox a producción

Por defecto SES está en **sandbox** (solo puede enviar a direcciones verificadas).
Para enviar a cualquier email:

1. Ir a AWS Console → SES → Account dashboard
2. Solicitar "Production access"
3. Explicar el caso de uso (portfolio personal, formulario de contacto, ~1 email/día)
4. Aprobar tarda 24–48 horas

Mientras estés en sandbox: verifica tu email personal en SES para probar.

---

## Costo mensual estimado (Free Tier)

| Recurso | Costo |
|---------|-------|
| EC2 `t3.micro` (750 hrs/mes) | **$0.00** |
| RDS `db.t3.micro` single-AZ | **$0.00** |
| S3 (≤ 5 GB, ≤ 20k GET, ≤ 2k PUT) | **$0.00** |
| SES (enviado desde EC2) | **$0.00** |
| Egress (≤ 100 GB/mes) | **$0.00** |
| Let's Encrypt (HTTPS) | **$0.00** |
| **Total** | **$0.00** |

### Plan para el mes 13 (fin del free tier de EC2 + RDS)

A partir del mes 13, EC2 `t3.micro` cuesta ~$8.50/mes y RDS ~$13/mes.

**Opciones:**

1. **AWS Lightsail** ($7/mes por bundle de 2 GB RAM): mover toda la app (Node + Nginx + Postgres) a una sola instancia Lightsail. Lightsail incluye Postgres gestionado opcional o puedes correr Postgres en la misma instancia.

2. **Postgres en el mismo EC2**: eliminar RDS, instalar Postgres directamente en el EC2 `t3.micro`. El EC2 ya no es free pero cuesta ~$8.50/mes (sin RDS). Tradeoff: sin backups automáticos → configurar `pg_dump` con cron a S3.

3. **Fly.io o Railway**: migrar la app Node a Fly.io (free tier generoso) y mantener RDS o Supabase para Postgres.

---

## Comandos útiles en producción

```bash
# Ver logs
pm2 logs photofolio

# Reiniciar después de deploy
git pull && npm install && npm run build && pm2 restart photofolio

# Monitorear
pm2 monit

# Conectar a RDS via SSH tunnel (desde local)
ssh -L 5433:TU_RDS_ENDPOINT:5432 ec2-user@TU_EC2_IP -N &
psql -h localhost -p 5433 -U DB_USER -d photofolio
```
