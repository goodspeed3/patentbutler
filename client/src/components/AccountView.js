import React, { useState, useEffect } from 'react';
import './AccountView.css'
// import { Link } from 'react-router-dom';
// import moment from 'moment-timezone'
import AuthApi from './AuthApi'
import { useAuth0 } from "../react-auth0-spa";
import Table from 'react-bootstrap/Table'
import Spinner from 'react-bootstrap/Spinner'


function AccountView () {
    const { getTokenSilently, user } = useAuth0();
    const [pbUser, setPbUser] = useState({})

    useEffect(() => {
        if (!user)
            return
        //update user state
        var formData = new FormData();
        formData.append('userEmail', user.email);

        AuthApi('/api/user', getTokenSilently, formData, true)
        .then(res => {
            setPbUser(res.user)
        })

    }, [user])
    if (!user || Object.keys(pbUser).length === 0) {
        return <div style={{display: "flex", justifyContent: "center", marginTop: "1rem"}}><Spinner animation="border" /></div>
    }
    return (
    <div className='account'>
        <h1 className='header'>Account</h1>
        <Table responsive className='accountTable'>
        <tbody>
            <tr>
            <td width="40%">Email</td>
            <td>{user.email}</td>
            </tr>
            { pbUser.oaCredits > 0 && 
            <tr>
            <td>Office Action Credits</td>
            <td>{pbUser.oaCredits}</td>
            </tr>
            }
            <tr>
            <td>Office Actions Processed</td>
            <td>{pbUser.numOaProcessed}</td>
            </tr>
            <tr>
            <td>Payment</td>
            <td>None</td>
            </tr>
        </tbody>
        </Table>
    </div>
    )
}

export default AccountView;
