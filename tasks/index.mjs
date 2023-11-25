import { DynamoDBClient, PutItemCommand }  from "@aws-sdk/client-dynamodb";
const ddb = new DynamoDBClient({ region: "us-east-1" });
import uploadToGCP from "./gcp.mjs" ;


export const handler = async (event, context) => {
  const params = {
    TableName: process.env.tableName,
    Item: {
      id: { S: "ramyuayuuuu" },
      emailaddress: { S: "ramuuu@gmail.com" },
    },
  };

  uploadToGCP ("https://github.com/tparikh/myrepo/archive/refs/tags/v1.0.0.zip")
  const command = new PutItemCommand(params);
  try {
    const data = await ddb.send(command);
    console.log("Item added: ", data);
  } catch (err) {
    console.error(err);
  }
};
