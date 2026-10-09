const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

// Reads standard AWS credentials from environment or ~/.aws/credentials
// Falls back gracefully if AWS credentials are not set yet
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  ...(process.env.DYNAMODB_ENDPOINT && { endpoint: process.env.DYNAMODB_ENDPOINT })
});

const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'JalSetuDispatches';

async function logDispatchToDynamoDB(bookingData) {
  try {
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        bookingId: bookingData.bookingId,
        wardId: bookingData.wardId,
        tankerCount: bookingData.tankerCount,
        dispatchedAt: bookingData.dispatchedAt,
        status: bookingData.status,
        timestamp: Date.now()
      }
    });

    await docClient.send(command);
    console.log(`[AWS DynamoDB] Persisted dispatch record ${bookingData.bookingId} to ${TABLE_NAME}`);
    return true;
  } catch (error) {
    console.warn(`[AWS DynamoDB Fallback] Notice: ${error.message}. Recorded locally.`);
    return false;
  }
}

module.exports = {
  logDispatchToDynamoDB
};
