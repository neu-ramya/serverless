import mailgun from 'mailgun-js';

const mg = mailgun({
  apiKey: process.env.mailgunAPIKey,
  domain: 'ramyadevie.me',
});

async function sendMailgunEmail(to, template, variables) {
  return {
    to: to,
    from: 'noreply@ramyadevie.me',
    template: template,
    'h:X-Mailgun-Variables': JSON.stringify(variables),
  };
}

async function sendEmail(to, template, variables) {
  console.log('8. Sending email');
  try {
    const mailData = await sendMailgunEmail(to, template, variables);

    await mg.messages().send(mailData);
    console.log('9. resolving email send');
    console.log('Email sent:', mailData);
  } catch (error) {
    console.error(`Error sending email: ${error}`);
    throw error;
  }
}

export default sendEmail;
