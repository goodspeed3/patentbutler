import React, {useState, useEffect} from 'react';
import './process.css'
import AuthApi from './AuthApi'
import { useAuth0 } from "../react-auth0-spa";
// import {useParams} from 'react-router-dom'
import Spinner from 'react-bootstrap/Spinner'

function ProcessView (props) {
    const { getTokenSilently, user } = useAuth0();
    const [processedData, setProcessedData] = useState(null)
    let { processedId, filename, user:email } = props.location.state

    useEffect(() => {
        makeApiCall()
      }, [user, processedId, filename, email]);

    function makeApiCall() {
        if (!user || !filename || !email || !processedId) {
            return
        }
        var formData = new FormData();
        if (processedId !== 'none') {
            formData.append('processedId', processedId);
        }
        formData.append('filename', filename);
        formData.append('email', email);
       
        //process as blob
        AuthApi('/adminApi/downloadOa', getTokenSilently, formData, true)
        .then(res => {
            console.log(res)
            setProcessedData(res)
        })
    }

    var elementsToShow = <div />;
    if (user && processedData) {
        elementsToShow = (
        <div> {JSON.stringify(processedData)}
        </div>
        )
    } else {
        elementsToShow = <Spinner animation="border" />
    }
    return (
    <div>
        {elementsToShow}
    </div>
    )
}

export default ProcessView;
