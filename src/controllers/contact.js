import { z } from 'zod';
import { db } from '../db/client.js';
import { contactSubmissions } from '../db/schema.js';
import { sendContactNotification } from '../services/ses.js';

const schema = z.object({
  name:    z.string().min(1).max(255).trim(),
  email:   z.string().email().max(255).trim(),
  message: z.string().min(1).max(5000).trim(),
  website: z.string().max(0), // honeypot — bots fill this, humans don't
});

export function getContact(req, res) {
  res.render('contact', {
    title: 'Contacto — Bolivar Barrios',
    success: false,
    error: null,
    formData: {},
  });
}

export async function postContact(req, res, next) {
  try {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(422).render('contact', {
        title: 'Contacto — Bolivar Barrios',
        success: false,
        error: 'Por favor revisa los campos del formulario.',
        formData: req.body,
      });
    }

    const { name, email, message, website } = result.data;

    // Honeypot triggered — silent success to not reveal detection
    if (website) {
      return res.render('contact', {
        title: 'Contacto — Bolivar Barrios',
        success: true,
        error: null,
        formData: {},
      });
    }

    await db.insert(contactSubmissions).values({
      name,
      email,
      message,
      ip: req.ip,
    });

    // Fire-and-forget — a SES failure should not break the user experience
    sendContactNotification({ name, email, message }).catch((err) => {
      console.error('[SES] Failed to send notification:', err.message);
    });

    res.render('contact', {
      title: 'Contacto — Bolivar Barrios',
      success: true,
      error: null,
      formData: {},
    });
  } catch (err) {
    next(err);
  }
}
