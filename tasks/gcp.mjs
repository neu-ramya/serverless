import { Storage } from '@google-cloud/storage';
import axios from 'axios';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { promises as fsPromises } from 'fs';
import sendEmail from './mailgun.mjs';
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const ddb = new DynamoDBClient({ region: "us-east-1" });
const LOCAL_ZIP_FILE_NAME = '/tmp/downloaded.zip';
const BUCKET_NAME = process.env.gcpBucketName;
const PROJECT_ID = process.env.gcpProjectID;
const GCP_KEY = '/tmp/gcp.json';

async function updateDynamoDB(emailID, assignmentDetails, status) {
  let uid = uuidv4()
  const params = {
    TableName: process.env.tableName,
    Item: {
      id: { S: uid }, 
      emailaddress: { S: emailID },
      assignmentAttempt: { N: assignmentDetails.attempt.attemptCount.toString() },
      assignmentNumber:  { S: assignmentDetails.id },
      emailSent: { S: status },
      deadlineExceeded: { S: assignmentDetails.deadlineExceeded.toString() },
    },
  };

  const command = new PutItemCommand(params);
  try {
    console.log('11. Insert Into DynamoDB');
    const ddbData = await ddb.send(command);
    console.log("Item added: ", ddbData);
    return ddbData;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function moveFileToGCP(projectId, bucketName, keyFilename, filePath, email, assignmentDetails) {
  let newBucketPath = `${assignmentDetails.name}/${assignmentDetails.id}/${email}/${assignmentDetails.attempt.attemptCount}/submission.zip`;

  console.log('5.0 Checking file size');

  await updateDynamoDB(email, assignmentDetails, 'failed-download');
  let fileSize = await fs.statSync(filePath);

  if(fileSize.size === 0){
    console.log(`------ INSIDE file size check - ${fileSize.size} ------`)
    await sendEmail(email, 'invalid-submission', {
      assignmentNumber: assignmentDetails.name,
      submissionURL: assignmentDetails.url
    });
    await updateDynamoDB(email, assignmentDetails, 'invalid-submission');
    throw 'file size is 0';
  }

  console.log('5. Starting move to GCP');

  const storage = new Storage({ projectId, keyFilename });
  const bucket = storage.bucket(bucketName);

  try {
    const fileStream = fs.createReadStream(filePath);
    const file = bucket.file(newBucketPath);
    const stream = file.createWriteStream({
      metadata: {
        contentType: 'application/zip',
      },
    });

    await new Promise((resolve, reject) => {
      console.log('6. Starting filestream');
      fileStream.pipe(stream)
        .on('error', async (error) => {
          // await sendEmail(email, 'failed-download', {assignmentNumber: assignmentDetails.name});
          reject(`Error uploading file: ${error.message}`);
        })
        .on('finish', async () => {
          console.log('7. finishing GCP upload');
          console.log(`File uploaded to: gs://${bucketName}/${newBucketPath}`);
          try {
            await sendEmail(email, 'successful-download', {assignmentNumber: assignmentDetails.name, bucketPath: `gs://${bucketName}/${newBucketPath}`});
            console.log('10. Starting update to DynamoDB');
          } catch(errror){
            await updateDynamoDB(email, assignmentDetails, 'unable-to-download');
          }
          try {
            await updateDynamoDB(email, assignmentDetails, 'success');
            console.log('NN. Dynamo successfully resolved');
            resolve();
          } catch (error) {
            reject(error);
          }
        });
    });
  } catch (error) {
    console.error(`Error uploading file: ${error}`);
    throw error;
  }
}

async function downloadGitHubRelease(fileUrl, destinationPath, email, assignmentDetails) {
  console.log('3. Starting download of zip file');

  try {
    const submissionHead = await axios.head(fileUrl);
    console.log(`3.1 Checking if submission is of type zip ${submissionHead.headers['content-type']}`)

    if(!((submissionHead.headers['content-type']) === 'application/zip')){
      await sendEmail(email, 'invalid-submission', {
        assignmentNumber: assignmentDetails.name,
        submissionURL: assignmentDetails.url
      });
      await updateDynamoDB(email, assignmentDetails, 'invalid-submission');
      return 'non-zip-file';
    }
  } catch(error) {
    console.log(`3.2 failed in zip type check`)
    await sendEmail(email, 'failed-download', {
      assignmentNumber: assignmentDetails.name,
      submissionURL: assignmentDetails.url
    });
    await updateDynamoDB(email, assignmentDetails, 'failed-download');

    console.log(`error checking url ${fileUrl}`, error);
    throw error;
  }
  
  try {
    const response = await axios({
      method: 'get',
      url: fileUrl,
      responseType: 'arraybuffer',
    });

    await fsPromises.writeFile(destinationPath, Buffer.from(response.data));
    // try {
    //   await fsPromises.stat(destinationPath);
    // } catch (error) {
    //   console.error(`Error checking file size: ${error.message}`);
    //   throw error;
    // }
  
    console.log('4. Finishing download of zip file');

    return destinationPath;
  } catch (error) {
    await updateDynamoDB(email, assignmentDetails, 'unable-to-download');
    throw `Error downloading file: ${error.message}`;
  }
}

async function uploadToGCP(downloadURL, email, assignmentDetails) {
  console.log('2. Starting upload to GCP');
  try {
    const downloadedZipFilePath = await downloadGitHubRelease(downloadURL, LOCAL_ZIP_FILE_NAME, email, assignmentDetails);
    if(!(downloadedZipFilePath === "non-zip-file")) {
      await moveFileToGCP(PROJECT_ID, BUCKET_NAME, GCP_KEY, downloadedZipFilePath, email, assignmentDetails);
    }
  } catch (error) {
    console.error(`Parent catch ---- ${error}`);
    throw error;
  }
}

export default { 
  uploadToGCP: uploadToGCP,
  updateDynamoDB: updateDynamoDB,
}