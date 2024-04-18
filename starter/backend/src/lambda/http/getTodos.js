import {createLogger} from "../../utils/logger.mjs";
import {createResponse, getUserId} from "../utils.mjs";
import {createXrayDBClient} from "../../db/index.js";

const dbClient = createXrayDBClient();
const todosTable = process.env.TODOS_TABLE;
const imagesTable = process.env.IMAGES_TABLE;
const log = createLogger("get-todo");

async function getTodoImages(allTodos) {
    let imgs = {Items: []}

    if (allTodos.Items.length > 0) {
        log.info(`Getting todos images`)
        const keyConditions = [];
        const valueExpression = {};
        let key = ':tdId';
        allTodos.Items.forEach((todo, index) => {
            key += (index + 1);
            keyConditions.push(key);
            valueExpression[key] = todo.todoId
        })

        imgs = await dbClient.scan({
            TableName: imagesTable,
            FilterExpression: `todoId IN (${keyConditions.join(', ')})`,
            ExpressionAttributeValues: {
                ...valueExpression
            }
        })
    }

    let imageMap = {};
    if (imgs.Items.length > 0) {
        imageMap = imgs.Items.reduce((mapped, current) => {
            if (!mapped[current.todoId]) {
                mapped[current.todoId] = [current]
            } else {
                mapped[current.todoId].push(current)
            }
            return mapped;
        }, {})
    }
    return imageMap;
}

export async function handler(event) {
    const userId = getUserId(event);
    if (!userId) {
        return createResponse(403, {message: 'Unauthorized'})
    }
    log.info(`Getting all todos for user ${userId}`)

    const all = await dbClient.query({
        TableName: todosTable,
        ExpressionAttributeValues: {
            ':uId': userId
        },
        KeyConditionExpression: 'userId = :uId'
    })

    let imageMap = await getTodoImages(all);

    const items = all.Items.map(todo => {
        let todoImages = imageMap[todo.todoId];
        if (todoImages) {
            return {...todo, images: todoImages}
        }
        return {...todo, images: []}
    })
    log.info(`Returning all todos with mapped images`)
    return createResponse(200, {items})
}
