import uploadToGCP from "./gcp.mjs";

export const handler = async (event, context) => {
  try {
    console.log("Received event:", JSON.stringify(event, null, 2));

    event.Records.forEach(async(record) => {
      const message = JSON.parse(record.Sns.Message);
      
      console.log("SNS Message:", message);
      console.log("DOWNLOAD URL:", message.url);
      console.log("1. Starting handler");
      const gcpResponse = await uploadToGCP(message.url);
      console.log('COMPLETING LAMBDA EXECUTION');
    });
  } catch (error) {
    console.error("Error in handler:", error);
  }
};
