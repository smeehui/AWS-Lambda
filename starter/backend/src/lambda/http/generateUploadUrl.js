import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {createLogger} from "../../utils/logger.mjs";
import {v4 as uuidv4} from 'uuid'
import {createResponse, getUserId} from "../utils.mjs";
import {createXrayDBClient} from "../../db/index.js";

const log = createLogger("image-url-processing")
const dbClient = createXrayDBClient();
const todosTable = process.env.TODOS_TABLE;
const imagesTable = process.env.IMAGES_TABLE;

const bucketName = process.env.S3_BUCKET;
const urlExpiration = parseInt(process.env.URL_EXPIRATION ?? '300');
const s3Client = new S3Client();


export async function handler(event) {
    const todoId = event.pathParameters.todoId;
    if (!todoId) {
        return createResponse(400, {message: 'Todo id is required'})
    }

    const userId = getUserId(event);
    if (!userId) {
        return createResponse(403, {message: 'Unauthorized'})
    }

    const existed = await todoExists({userId, todoId});
    if (!existed) {
        log.info(`Todo not found with id ${todoId}`)
        return createResponse(404, {message: "Todo not found"});
    }

    const imageId = uuidv4();
    log.info(`Generating image pre-signed url with id: ${imageId}`)
    const ext = JSON.parse(event.body);
    const uploadUrl = await getUploadUrl(imageId, ext);
    log.info(`Image pre-signed url generated with id: ${imageId}`);
    await createImage({imageId, todoId, uploadUrl, ...ext})

    return createResponse(201, {uploadUrl})
}

const createImage = async (image) => {
    try {
        log.info(`Creating image with id: ${image.imageId}`);
        await dbClient.put({
            TableName: imagesTable,
            Item: image
        })
        return image;
    } catch (e) {
        log.error(`Image created failed with id: ${image.imageId}, message: ${e.message}`);
        throw e;
    }
}


const getUploadUrl = async (imageId, {ext}) => {
    const s3putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: imageId + '.' + ext,
        ContentType: "image/png"
    })
    return await getSignedUrl(s3Client, s3putCommand, {
        expiresIn: urlExpiration
    });
}


const todoExists = async (keys) => {
    const result = await dbClient.get({
        TableName: todosTable,
        Key: {...keys}
    })
    return !!result.Item
}