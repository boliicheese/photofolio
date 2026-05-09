import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const ses = new SESClient({ region: process.env.AWS_REGION });

export async function sendContactNotification({ name, email, message }) {
  const cmd = new SendEmailCommand({
    Source: process.env.MAIL_FROM,
    Destination: { ToAddresses: [process.env.CONTACT_TO] },
    ReplyToAddresses: [email],
    Message: {
      Subject: { Data: `[PhotoFolio] Mensaje de ${name}` },
      Body: {
        Text: {
          Data: `Nombre: ${name}\nEmail: ${email}\n\n${message}`,
        },
      },
    },
  });
  await ses.send(cmd);
}
