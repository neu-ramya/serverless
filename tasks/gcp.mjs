import { Storage } from '@google-cloud/storage';
import axios from 'axios';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import sendEmail from './mailgun.mjs';
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const ddb = new DynamoDBClient({ region: "us-east-1" });
const LOCAL_ZIP_FILE_NAME = '/tmp/downloaded.zip';
const BUCKET_NAME = 'ramya-csye6225';
const PROJECT_ID = 'arcane-transit-406119';
const GCP_KEY = './gcp.json';

async function updateDynamoDB(emailID) {
  const params = {
    TableName: process.env.tableName,
    Item: {
      id: { S: "12871974129" },
      emailaddress: { S: emailID },
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

async function moveFileToGCP(projectId, bucketName, keyFilename, filePath, email, gcpDestinationPath) {
  console.log('5. Starting move to GCP');

  const storage = new Storage({ projectId, keyFilename });
  const bucket = storage.bucket(bucketName);

  try {
    const fileStream = fs.createReadStream(filePath);
    const file = bucket.file(gcpDestinationPath);
    const stream = file.createWriteStream({
      metadata: {
        contentType: 'application/zip',
      },
    });

    await new Promise((resolve, reject) => {
      console.log('6. Starting filestream');
      fileStream.pipe(stream)
        .on('error', (error) => {
          reject(`Error uploading file: ${error.message}`);
        })
        .on('finish', async () => {
          console.log('7. finishing GCP upload');
          console.log(`File uploaded to: gs://${bucketName}/${gcpDestinationPath}`);
          try {
            await sendEmail(email);
            console.log('10. Starting update to DynamoDB');
            await updateDynamoDB(email);
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

async function downloadGitHubRelease(fileUrl, destinationPath) {
  console.log('3. Starting download of zip file');

  try {
    const response = await axios({
      method: 'get',
      url: fileUrl,
      responseType: 'arraybuffer',
    });

    await fsPromises.writeFile(destinationPath, Buffer.from(response.data));

    console.log('4. Finishing download of zip file');
    return destinationPath;
  } catch (error) {
    throw `Error downloading file: ${error.message}`;
  }
}

async function uploadToGCP(downloadURL, email) {
  console.log('2. Starting upload to GCP');
  try {
    const downloadedZipFilePath = await downloadGitHubRelease(downloadURL, LOCAL_ZIP_FILE_NAME);
    await moveFileToGCP(PROJECT_ID, BUCKET_NAME, GCP_KEY, downloadedZipFilePath, email, 'assign10/newcode.zip');
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export default uploadToGCP;
