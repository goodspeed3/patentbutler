import React, {useState, useEffect} from 'react';
import './home.css'
import AuthApi from './AuthApi'
import { useAuth0 } from "../react-auth0-spa";
import Table from 'react-bootstrap/Table'
import { Link } from 'react-router-dom';
import moment from 'moment-timezone'
import Spinner from 'react-bootstrap/Spinner'
import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'

function HomeView () {
    const { getTokenSilently, user } = useAuth0();
    const [homeData, setHomeData] = useState(null)
    const [fileToDelete, setFileToDelete] = useState({});
    const [showLoading, setShowLoading] = useState(false);

    const handleClose = () => setFileToDelete({});
  
    useEffect(() => {
        if (!user || !getTokenSilently) {
            return
        }
        var formData = new FormData();
        formData.append('userEmail', user.email);
       
        AuthApi('/adminApi/home', getTokenSilently, formData)
        .then(res => {
          setHomeData(res)
          
        })  
      }, [user, getTokenSilently]);
    

    function showFinishedOa() {
    if (homeData.finishedOa && homeData.finishedOa[0].length === 0 ) {
        return <div><pre>None yet</pre></div>
    }

    return <div>
        {homeData.finishedOa[0].map (processedOaEntity => {
            let linkWithState = {
                pathname: '/admin/process/' + processedOaEntity.filename,
                // state: processedOaEntity
            }

        return <div key={processedOaEntity.filename}><b>{timeHelper(processedOaEntity.finishedProcessingTime, true)}</b> - <Link to={linkWithState}>{processedOaEntity.attyDocket}</Link> for {processedOaEntity.user.includes("patentbutler") ? processedOaEntity.user : <b>{processedOaEntity.user}</b> } <Button size='sm' variant="link" onClick={() => showModal('processed',processedOaEntity.filename )}>Delete {processedOaEntity.forDemo && '(Demo)'}</Button></div>
        })}
    </div>

    }
    function showModal(type, filename) {
        setFileToDelete({type: type, filename: filename})
    }
    function deleteFromGoogle (type, filename) {
        var formData = new FormData();
        formData.append('filename', filename);
        formData.append('type', type);
        setShowLoading(true)
        AuthApi('/adminApi/delete', getTokenSilently, formData)
        .then(res => {
            AuthApi('/adminApi/home', getTokenSilently, formData)
            .then(res => {
                handleClose()
                setShowLoading(false)
                setHomeData(res)              
            })  
              
        })  

    }

    function showProcessingOa() {
    if (homeData.processingOa && homeData.processingOa[0].length === 0 ) {
        return <div><pre>None yet</pre></div>
    }

    //first element is the list, second element is cursor data
    return <Table className='procTable' striped bordered hover>
        <thead>
        <tr>
            <th>Upload Time</th>
            <th>Date</th>
            <th>User</th>
            <th>Original Name</th>
            <th>Action</th>
        </tr>
        </thead>
        <tbody>
        {homeData.processingOa[0].map( processingEntity => {
            let linkWithState = {
                pathname: '/admin/process/'+processingEntity.filename,
                // state: {
                //     ...processingEntity
                // }
            }
            return (
                <tr key={processingEntity.uploadTime} >
                <td>{timeHelper(processingEntity.uploadTime, true)}</td>
                <td>{timeHelper(processingEntity.uploadTime)}</td>
                <td>{processingEntity.user.includes("patentbutler") ? processingEntity.user : <b>{processingEntity.user}</b> }</td>
                <td><Link to={linkWithState}>{processingEntity.originalname}</Link></td>
                <td><Button size='sm' onClick={() => showModal('uploadedOa',processingEntity.filename )}>Delete</Button></td>
                </tr>
            )
        })}        
        </tbody>      
    </Table>
    }
    function timeHelper(timestamp, getDiff = false) {
    if (getDiff) { //get diff between timeestamp and now and return unit
        var diff = Math.floor(Date.now() - timestamp) / 1000
        if (diff < 60) {
        return Math.ceil(diff) + " secs ago"
        } else if (diff < 60 * 60) {
        return Math.ceil(diff / 60) + " min ago"
        } else if (diff < 60 * 60 * 24) {
        let numHr = Math.round (diff / 3600)
        return numHr + " hr" + ((numHr > 1) ? 's' : '')  + " ago"
        } else {
        let numDay = Math.round (diff / (3600 * 24))
        return numDay + " day" + ((numDay > 1) ? 's' : '')  + " ago"
        }
    } else {
        var date = new moment(timestamp);
        return date.tz('America/Los_Angeles').format('M/D/YY, h:mm:ss a')
    }
    }
        
    var elementsToShow = <div style={{display: "flex", justifyContent: "center", marginTop: "1rem"}}><Spinner animation="border" /></div>;
    if (user && homeData) {
        elementsToShow = (
        <div className='procList'>
        <div className='procColumn'>
          <div className='columnHeader'>Office Actions to be Processed</div>
          {showProcessingOa()}
        </div>
        <div className='oaColumn'>
          <div className='columnHeader'>Processed</div>
          {showFinishedOa()}
        </div>
      </div>
            )
    }
    return (
    <div className='homeLayout'>
        {elementsToShow}
        <Modal show={Object.keys(fileToDelete).length > 1} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Are you sure?</Modal.Title>
        </Modal.Header>
        <Modal.Body>Really delete {fileToDelete.type} - {fileToDelete.filename}?   { showLoading ? <div style={{display: "flex", justifyContent: "center", marginTop: "1rem"}}><Spinner animation="border" /></div> : null}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary" onClick={() => deleteFromGoogle(fileToDelete.type, fileToDelete.filename)}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
    )
}

export default HomeView;
