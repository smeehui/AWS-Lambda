import {v4 as uuidv4} from 'uuid'
import {createLogger} from "../../utils/logger.mjs";
import {createResponse, getUserId} from "../utils.mjs";
import {createXrayDBClient} from "../../db/index.js";

const log = createLogger("create-todos")
const dbClient = createXrayDBClient();
const todosTable = process.env.TODOS_TABLE;

export async function handler(event) {
    const userId = getUserId(event)
    if (!userId) {
        return createResponse(403, {message: 'Unauthorized'})
    }
    const todoId = uuidv4();
    log.info("Creating todo, id: ", todoId);
    const newTodoBody = JSON.parse(event.body)
    const newTodo = {...newTodoBody, todoId, userId, done: false}
    try {
        await dbClient.put({
            TableName: todosTable,
            Item: newTodo
        })
        log.info(`New to do created id: ${todoId}, userId: ${userId}`)
        return createResponse(201, {item: newTodo})
    } catch (e) {
        log.error(e)
        log.error(`Error creating todo with userId: ${userId}, message: ${e.message}`)
        return createResponse(500, {message: "Internal server error"})
    }
}

