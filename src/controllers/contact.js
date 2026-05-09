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
    title: res.locals.t.meta.contact,
    success: false,
    error: null,
    formData: {},
  });
}

export async function postContact(req, res, next) {
  try {
    const { t } = res.locals;
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(422).render('contact', {
        title: t.meta.contact,
        success: false,
        error: t.contact.validationError,
        formData: req.body,
      });
    }

    const { name, email, message, website } = result.data;

    if (website) {
      return res.render('contact', {
        title: t.meta.contact,
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

    sendContactNotification({ name, email, message }).catch((err) => {
      console.error('[SES] Failed to send notification:', err.message);
    });

    res.render('contact', {
      title: t.meta.contact,
      success: true,
      error: null,
      formData: {},
    });
  } catch (err) {
    next(err);
  }
}
