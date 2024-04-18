import {Auth0Provider} from '@auth0/auth0-react'
import React from 'react'
import ReactDOM from 'react-dom'
import 'semantic-ui-css/semantic.min.css'
import App from './App'
import './index.css'
import {config} from "./config";

const {auth0Domain, authClientId} = config

ReactDOM.render(
    <Auth0Provider
        domain={auth0Domain}
        clientId={authClientId}
        redirectUri={window.location.origin}
        audience={`https://${auth0Domain}/api/v2/`}
        scope="read:todo write:todo delete:todo"
    >
        <App/>
    </Auth0Provider>,
    document.getElementById('root')
)
