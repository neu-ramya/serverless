import mailgun from 'mailgun-js';

const mg = mailgun({
  apiKey: process.env.mailgunAPIKey,
  domain: 'ramyadevie.me',
});

async function getMailData(from, to, subject, body) {
  return {
    from: from,
    to: to,
    subject: subject,
    text: body,
  };
}

async function sendEmail(to) {
  console.log('8. Sending email');
  try {
    const mailData = await getMailData('Ramya Devie <noreply@ramyadevie.me>', to, "Assignment submission email", 'Your zip file is uploaded \n This is needed to work.');

    await mg.messages().send(mailData);
    console.log('9. resolving email send');
    console.log('Email sent:', mailData);
  } catch (error) {
    console.error(`Error sending email: ${error}`);
    throw error;
  }
}

export default sendEmail;
