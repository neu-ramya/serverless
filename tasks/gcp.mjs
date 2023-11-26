import { Storage } from '@google-cloud/storage';
import axios from 'axios';
import fs from 'fs';
import sendEmail from './mailgun.mjs'

const LOCAL_ZIP_FILE_NAME = '/tmp/downloaded.zip';
const BUCKET_NAME = 'ramya-csye6225';
const PROJECT_ID = 'arcane-transit-406119';
const GCP_KEY = './gcp.json';

async function moveFileToGCP(projectId, bucketName, keyFilename, filePath, gcpDestinationPath) {
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
      fileStream.pipe(stream)
        .on('error', (error) => {
          reject(`Error uploading file: ${error.message}`);
        })
        .on('finish', () => {
          console.log(`File uploaded to: gs://${bucketName}/${gcpDestinationPath}`);
          sendEmail('gowtham.uj@gmail.com')
          resolve();
        });
    });
  } catch (error) {
    console.error(`Error uploading file: ${error}`);
  }
}

async function downloadGitHubRelease(fileUrl, destinationPath) {
  try {
    const writer = fs.createWriteStream(destinationPath);
    const fileResponse = await axios({
      method: 'get',
      url: fileUrl,
      responseType: 'stream',
    });

    fileResponse.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(destinationPath));
      writer.on('error', (error) => reject(`Error writing to file: ${error.message}`));
    });
  } catch (error) {
    throw `Error downloading file: ${error.message}`;
  }
}

async function uploadToGCP (fileUrl) {
  try {
    let  downloadedZipFilePath = await downloadGitHubRelease(fileUrl, LOCAL_ZIP_FILE_NAME);
    await moveFileToGCP(PROJECT_ID, BUCKET_NAME, GCP_KEY, downloadedZipFilePath, 'assign10/newcode.zip')
  } catch (error) {
    console.error(error);
  }
}

export default uploadToGCP;