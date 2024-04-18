import {DynamoDBDocument} from "@aws-sdk/lib-dynamodb";
import {DynamoDB} from "@aws-sdk/client-dynamodb";
import AWSXRay from 'aws-xray-sdk-core'
import {createLogger} from "../utils/logger.mjs";

const log = createLogger("create-todos")

export const createXrayDBClient = () => {
    log.info("Initializing db client with XRay tracing")
    const dynamoDb = new DynamoDB()
    const dynamoDbXRay = AWSXRay.captureAWSv3Client(dynamoDb)
    const dynamoDBDocument = DynamoDBDocument.from(dynamoDbXRay);
    log.info("Db client with XRay created")
    return dynamoDBDocument;
}