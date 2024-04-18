import jsonwebtoken from 'jsonwebtoken'
import {createLogger} from '../../utils/logger.mjs'
import {configuration} from "../../config/index.js";
import jwksRsa from 'jwks-rsa'

const logger = createLogger('auth')

const jwksUrl = `${configuration.auth0Domain}/.well-known/jwks.json`
const {verify} = jsonwebtoken;

export async function handler(event) {
    try {
        const jwtToken = await verifyToken(event.authorizationToken)
        console.log('jwtToken', jwtToken)
        return {
            principalId: jwtToken.sub,
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: 'Allow',
                        Resource: '*'
                    }
                ]
            }
        }
    } catch (e) {
        logger.error('User not authorized', {error: e.message})

        return {
            principalId: 'user',
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: 'Deny',
                        Resource: '*'
                    }
                ]
            }
        }
    }
}

async function getKeys() {
    const jwks = jwksRsa({jwksUri: jwksUrl})
    return (header, callback) => {
        jwks.getSigningKey(header.kid, (err, key) => {
            callback(null, key.publicKey ?? key.rsaPublicKey);
        })
    }
}


async function verifyToken(authHeader) {
    const token = getToken(authHeader)
    const keys = await getKeys();
    return await new Promise((resolve, reject) => {
        verify(token, keys, (err, decoded) => {
            if (err) {
                reject(err)
            } else {
                resolve(decoded)
            }
        })
    });
}

function getToken(authHeader) {
    if (!authHeader) throw new Error('No authentication header')

    if (!authHeader.toLowerCase().startsWith('bearer '))
        throw new Error('Invalid authentication header')

    const split = authHeader.split(' ')
    return split[1]
}
