import Axios from 'axios'
import {config} from "../config";

const apiEndpoint = `https://${config.apiId}.execute-api.us-east-1.amazonaws.com/dev`

export async function getTodos(idToken) {
    console.log('Fetching todos')

    const response = await Axios.get(
        `${apiEndpoint}/todos`,
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${idToken}`
            }
        }
    )
    console.log('Todos:', response.data)
    return response.data.items
}

export async function createTodo(idToken, newTodo) {
    const response = await Axios.post(
        `${apiEndpoint}/todos`,
        JSON.stringify(newTodo),
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${idToken}`
            }
        }
    )
    return response.data.item
}

export async function patchTodo(idToken, todoId, updatedTodo) {
    await Axios.patch(
        `${apiEndpoint}/todos/${todoId}`,
        JSON.stringify(updatedTodo),
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${idToken}`
            }
        }
    )
}

export async function deleteTodo(idToken, todoId) {
    await Axios.delete(`${apiEndpoint}/todos/${todoId}`, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`
        }
    })
}

export async function getUploadUrl(idToken, todoId, ext) {
    const response = await Axios.post(
        `${apiEndpoint}/todos/${todoId}/attachment`,
        ext,
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${idToken}`
            }
        }
    )
    return response.data.uploadUrl
}

export async function uploadFile(uploadUrl, file) {
    await Axios.put(uploadUrl, file, {headers: {'Content-Type': 'image/png'}})
}
