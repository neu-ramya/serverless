import https from "https";
import fs from "fs";
import path from 'path';


import { Storage } from '@google-cloud/storage';

const bucketName = 'ramya-csye6225';
const projectId = 'arcane-transit-406119';
const gcsKey = './gcp.json';

const localZipFileName = '/tmp/assign.zip'

const downloadFile = (url, dest) => {
  const file = fs.createWriteStream(dest);

  return new Promise((resolve, reject) => {
    https.get(url, response => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', error => {
      fs.unlink(dest, () => reject(error));
    });
  });
};

const createDestinationDirectory = (filePath) => {
  const directory = path.dirname(filePath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

async function uploadFile(bucketName, projectId, keyFilename, fileName) {
  fileName = './some.md'
  const storage = new Storage({ keyFilename: keyFilename });
  const gcsBucket = storage.bucket(bucketName);
  console.log("@@@@@@@@@@@@@@@@ UPLOAD @@@@@@@@@@@@@@@@")
  gcsBucket.upload(
    fileName,
    {
      destination: `assign9/some.md`,
    },
    function (err, file) {
      if (err) {
        console.log('------------- UPLOAD ERRROR !!!!!!!!!!!!!!!!!')
        console.error(`Error uploading image image_to_upload.jpeg: ${err}`)
      } else {
        console.log(`Image image_to_upload.jpeg uploaded to ${bucketName}.`)
      }
    })
}

const downloadZipFile = async (fileUrl, destinationPath) => {
  try {
    createDestinationDirectory(destinationPath);
    await downloadFile(fileUrl, destinationPath);
    console.log(`File downloaded to ${destinationPath}`);
  } catch (error) {
    console.error('Error:', error.message);
  }
};

async function uploadToGCP (fileUrl) {
  try {
    console.log("*********** BEFORE DOWNLOAD *****************")
    await downloadZipFile(fileUrl, localZipFileName);
    console.log("*********** AFTER DOWNLOAD *****************")
    await uploadFile(bucketName, projectId, gcsKey, localZipFileName);
        console.log("*********** AFTER GCP UPLOAD CALL *****************")

  } catch (error) {
    console.error('Error:', error.message);
  }
}

export default uploadToGCP;