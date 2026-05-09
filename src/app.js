import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import helmet from 'helmet';
import pg from 'pg';
import { publicRouter } from './routes/public.js';
import { adminRouter } from './routes/admin.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { langMiddleware } from './middleware/lang.js';

const { Pool } = pg;
const PgStore = connectPgSimple(session);

export function createApp() {
  const app = express();

  // Nginx sits in front in production
  app.set('trust proxy', 1);
  app.set('view engine', 'ejs');
  app.set('views', new URL('../views', import.meta.url).pathname);

  // ── Security ──────────────────────────────────────────────────────────────
  const s3Origin = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`;

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:  ["'self'"],
        scriptSrc:   ["'self'"],
        styleSrc:    ["'self'", 'https://fonts.googleapis.com'],
        fontSrc:     ["'self'", 'https://fonts.gstatic.com'],
        imgSrc:      ["'self'", s3Origin, 'data:', 'blob:'],
        connectSrc:  ["'self'", s3Origin],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }));

  // ── Parsing ───────────────────────────────────────────────────────────────
  app.use(express.json({ limit: '50kb' }));
  app.use(express.urlencoded({ extended: false, limit: '50kb' }));

  // ── Static files ──────────────────────────────────────────────────────────
  app.use(express.static(new URL('../public', import.meta.url).pathname));

  // ── Rate limiting ─────────────────────────────────────────────────────────
  app.use(globalLimiter);

  // ── Sessions ──────────────────────────────────────────────────────────────
  const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL ||
      `postgresql://${process.env.DB_USER}:${encodeURIComponent(process.env.DB_PASSWORD)}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  app.use(session({
    store: new PgStore({
      pool: pgPool,
      tableName: 'sessions',
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    name: 'sid',
    cookie: {
      secure:   process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge:   7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    },
  }));

  // ── i18n ──────────────────────────────────────────────────────────────────
  app.use(langMiddleware);

  // ── Routes ────────────────────────────────────────────────────────────────
  app.use('/', publicRouter);
  app.use('/admin', adminRouter);

  // ── 404 ───────────────────────────────────────────────────────────────────
  app.use((req, res) => {
    res.status(404).render('error', { title: 'No encontrado', message: 'La página no existe.', code: 404 });
  });

  // ── Error handler ─────────────────────────────────────────────────────────
  app.use((err, req, res, _next) => {
    console.error(err);
    const code = err.status || 500;
    const message = process.env.NODE_ENV === 'production'
      ? 'Algo salió mal. Intenta de nuevo.'
      : err.message;
    res.status(code).render('error', { title: 'Error', message, code });
  });

  return app;
}
