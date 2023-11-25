import * as fetch from "node-fetch";
import { Storage } from '@google-cloud/storage';
import * as fs from "fs";

const bucketName = 'ramya-csye6225';
const projectId = 'arcane-transit-406119';
const keyFilename = 'path/to/your/keyfile.json';

async function downloadFile(url) {
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to download file, status ${response.status}`);
  }

  return response.buffer();
}

async function uploadFile(bucketName, projectId, keyFilename, fileName, fileBuffer) {
  const storage = new Storage({ projectId, keyFilename });
  const bucket = storage.bucket(bucketName);

  const file = bucket.file(fileName);
  const stream = file.createWriteStream({
    metadata: {
      contentType: 'application/octet-stream',
    },
  });

  return new Promise((resolve, reject) => {
    stream.on('error', reject);
    stream.on('finish', () => {
      console.log(`File ${fileName} uploaded to Google Cloud Storage.`);
      resolve();
    });

    stream.end(fileBuffer);
  });
}

async function uploadToGCP (fileUrl) {
  try {
    const fileBuffer = await downloadFile(fileUrl);

    await uploadFile(bucketName, projectId, keyFilename, 'uploaded-file.pdf', fileBuffer);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// module.exports = {
//     uploadToGCP: uploadToGCP,
// }

export default uploadToGCP;