const { Storage } = require('@google-cloud/storage')

// Initialize storage
const storage = new Storage({
  keyFilename: `./gcp.json`,
})

const bucketName = 'ramya-csye6225'
const bucket = storage.bucket(bucketName)

// Sending the upload request
bucket.upload(
  `./readme.txt`,
  {
    destination: `text/readme.txt`,
  },
  function (err, file) {
    if (err) {
      console.error(`Error uploading image readme.txt: ${err}`)
    } else {
      console.log(`Image readme.txt uploaded to ${bucketName}.`)
    }
  }
)