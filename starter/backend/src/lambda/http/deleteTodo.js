import {createResponse, getUserId} from "../utils.mjs";
import {createLogger} from "../../utils/logger.mjs";
import {createXrayDBClient} from "../../db/index.js";

const dbClient = createXrayDBClient();
const todosTable = process.env.TODOS_TABLE;
const log = createLogger("delete-todo")

export async function handler(event) {
    const todoId = event.pathParameters?.todoId;
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

    try {
        log.info(`Deleting todo with id ${todoId}, userId: ${userId}`)
        await dbClient.delete({
            TableName: todosTable,
            Key: {
                todoId,
                userId
            }
        })
        log.info(`Todo with id ${todoId} is deleted, userId: ${userId}`)
        return createResponse(200, {})
    } catch (e) {
        log.error(e)
        log.error(`Error deleting todo with userId: ${userId}, message: ${e.message}`)
        return createResponse(500, {message: "Internal server error"})
    }
}

const todoExists = async (keys) => {
    const result = await dbClient.get({
        TableName: todosTable,
        Key: {...keys}
    })
    return !!result.Item
}