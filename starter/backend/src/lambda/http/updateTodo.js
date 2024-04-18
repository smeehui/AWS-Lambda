import {createLogger} from "../../utils/logger.mjs";
import {createResponse, getUserId} from "../utils.mjs";
import {createXrayDBClient} from "../../db/index.js";

const log = createLogger("update-todos")
const dbClient = createXrayDBClient();
const todosTable = process.env.TODOS_TABLE;


export async function handler(event) {
    const todoId = event.pathParameters.todoId

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

    const updatedTodo = JSON.parse(event.body)

    try {
        log.info(`Updating todo id: ${todoId}, userId: ${userId}`)
        await dbClient.update({
            TableName: todosTable,
            Key: {
                todoId,
                userId
            },
            UpdateExpression: "set #name = :name, #done = :done, #dueDate = :dueDate",
            ExpressionAttributeNames: {
                "#name": "name",
                "#done": "done",
                "#dueDate": "dueDate"
            },
            ExpressionAttributeValues: {
                ":name": updatedTodo.name,
                ":done": updatedTodo.done,
                ":dueDate": updatedTodo.dueDate,
            }
        })
        log.info(`Todo updated with id: ${todoId}, userId: ${userId}`)
        return createResponse(200, {item: updatedTodo})
    } catch (e) {
        log.error(e)
        log.error(`Error updating todo with userId: ${userId}, message: ${e.message}`)
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
