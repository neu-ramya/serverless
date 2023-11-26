import uploadToGCP from "./gcp.mjs";

export const handler = async (event, context) => {
  try {
    console.log("Received event:", JSON.stringify(event, null, 2));

    let message;
    event.Records.forEach(async(record) => {
      message = JSON.parse(record.Sns.Message);
    });
    
    console.log("1. Starting handler");
    let downloadURL = message.url;
    let email = message.email;
    
    const gcpResponse = await uploadToGCP(downloadURL, email);
    console.log('COMPLETING LAMBDA EXECUTION');
  } catch (error) {
    console.error("Error in handler:", error);
  }
};