exports.handler = async function (event, context) {
  const {
    DynamoDBClient,
    PutItemCommand,
  } = require("@aws-sdk/client-dynamodb");

  const ddb = new DynamoDBClient({ region: "us-east-1" });

  console.log("********** IN HANDLER **********");
  const params = {
    TableName: process.env.tableName,
    Item: {
      id: { S: "asdb" },
      emailaddress: { S: "testing@gmail.com" },
    },
  };

  const command = new PutItemCommand(params);
  try {
    console.log("------- INSERTING ------");
    const data = await ddb.send(command);
    console.log("Item added: ", data);
  } catch (err) {
    console.log("------- ERRRRORRRRRRR ------");
    console.error(err);
  }
};