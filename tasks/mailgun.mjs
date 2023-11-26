import mailgun from 'mailgun-js';

const mg = mailgun({
  apiKey: 'a039b8e55885211cee0acf28fafe3076-5d2b1caa-a42912d1',
  domain: 'ramyadevie.me',
});

async function getMailData(from, to, subject, body){
    return {
        from: from,
        to: to,
        subject: subject,
        text: body,
      };
}

async function sendEmail(to) {
    let mailData =  await getMailData('Ramya Devie <noreply@ramyadevie.me>', to, "Assignment submission email", 'Your zip file is uploaded \n This is needed to work.')
    
    mg.messages().send(mailData, (error, body) => {
        if (error) {
          console.error(`Error sending email: ${error}`);
        } else {
          console.log('Email sent:', body);
        }
      });
  }
  
  export default sendEmail;
