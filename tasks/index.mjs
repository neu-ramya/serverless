import util from 'util';
import fs from 'fs';
import path from 'path';
import sendEmail from './mailgun.mjs';
import gcpModule from './gcp.mjs';
const { uploadToGCP, updateDynamoDB } = gcpModule;

const writeFileAsync = util.promisify(fs.writeFile);

async function createGcpJSON() {
  const envVariableContent = process.env.gcpSaJSON;
  const fileName = 'gcp.json';
  const filePath = path.join('/tmp', fileName);

  if (envVariableContent === undefined) {
    console.error(`Environment variable 'gcpSaJSON' not set. Unable to create the file.`);
  } else {
    try {
      await writeFileAsync(filePath, envVariableContent);
      console.log(`File '${fileName}' created successfully with content from 'gcpSaJSON'.`);
    } catch (err) {
      console.error(`Error writing to file: ${err}`);
    }
  }
}

export const handler = async (event, context) => {
  try {
    await createGcpJSON();
    let message;
    event.Records.forEach(async (record) => {
      message = JSON.parse(record.Sns.Message);
    });

    console.log("Received event:", message);

    console.log("1. Starting handler");
    let downloadURL = message.url;
    let email = message.email;

    let assignmentDetails = {
      id: message.assignmentID,
      attempt: message.attempt,
      name: message.assignmentName,
      deadlineExceeded: message.deadlineExceeded,
      url: message.url,
      deadlineDate: deadlineDate.deadlineDate,
    }

    if(assignmentDetails.deadlineExceeded){
      await sendEmail(email, 'deadline-missed', { 
        assignmentNumber: assignmentDetails.name,
        deadline: assignmentDetails.deadlineDate,
      });
      await updateDynamoDB(email, assignmentDetails, 'deadline-missed');
      return;
    }

    let attemptExceeded = (assignmentDetails.attempt.attemptCount >= assignmentDetails.attempt.limit);

    if(attemptExceeded) {
      await sendEmail(email, 'attempt-exceeded', { 
        assignmentNumber: assignmentDetails.name,
        assignmentLimit: assignmentDetails.attempt.limit
      });
      await updateDynamoDB(email, assignmentDetails, 'attempt-exceeded');
      return;
    }

    const gcpResponse = await uploadToGCP(downloadURL, email, assignmentDetails);
    console.log('COMPLETING LAMBDA EXECUTION');
  } catch (error) {
    console.error("Error in handler:", error);
  }
};