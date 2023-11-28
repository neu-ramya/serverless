import util from 'util';
import fs from 'fs';
import path from 'path';
import uploadToGCP from "./gcp.mjs";

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
    // console.log("Received event:", JSON.stringify(event, null, 2));
    await createGcpJSON();
    let message;
    event.Records.forEach(async (record) => {
      message = JSON.parse(record.Sns.Message);
    });

    

    console.log("1. Starting handler");
    let downloadURL = message.url;
    let email = message.email;
    let assignmentDetails = {
      id: message.assignmentID,
      attempt: message.attempt,
      name: message.assignmentName
    }

    console.log('-----------------')
    console.log(message)
    console.log(assignmentDetails)
    console.log('-----------------')

    const gcpResponse = await uploadToGCP(downloadURL, email, assignmentDetails);
    console.log('COMPLETING LAMBDA EXECUTION');
  } catch (error) {
    console.error("Error in handler:", error);
  }
};