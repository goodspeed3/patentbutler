import React, {useState} from 'react';
import { Redirect } from 'react-router-dom'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import './components.css'

function LoginView( props ) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [disabled, setDisabled] = useState(false)
    const [loginStatus, setLoginStatus] = useState(0) //0 is inital state, 1 is incorrect login, 2 is correct login

    const handleSubmit = event => {
        
        event.preventDefault();
        setDisabled(true)
        fetch('/adminApi/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
            headers: new Headers({ 'Content-Type': 'application/json' }),
        }).then( response => {
            setDisabled(false)
            if (response.status < 200 || response.status >= 300) {
                setLoginStatus(1)
            } else {
                props.setIsAuthenticated(true)
                setLoginStatus(2)
            }
        })
    };

    return (
        <div>
        { loginStatus === 1 && (<Alert variant="danger">Incorrect login</Alert>)}
        { loginStatus === 2 && (<Redirect to='/home' />)}

        <Form className='loginSubmission' onSubmit={handleSubmit}>
        <Form.Group controlId="formBasicEmail">
            <Form.Label>Username</Form.Label>
            <Form.Control type="text" value={username} onChange={(event) => { setUsername(event.target.value)}} placeholder="Enter username" />
        </Form.Group>

        <Form.Group controlId="formBasicPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" value={password} onChange={(event) => { setPassword(event.target.value)}} placeholder="Password" />
        </Form.Group>
        <Button disabled={disabled} variant="primary" type="submit">
            Submit
        </Button>
        </Form>
        </div>
    )
}

export default LoginView;
