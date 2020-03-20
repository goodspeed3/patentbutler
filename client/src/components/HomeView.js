import React, { useState, useEffect } from 'react';
import './HomeView.css'
import UploadView from './UploadView';
import Table from 'react-bootstrap/Table'
import { HashLink as Link } from 'react-router-hash-link';
import Spinner from 'react-bootstrap/Spinner'
import Alert from 'react-bootstrap/Alert'

import AuthApi from './AuthApi'
import { useAuth0 } from "../react-auth0-spa";

function HomeView() {
  const { getTokenSilently, user } = useAuth0();
  const [homeData, setHomeData] = useState(null)
  const [pbUser, setPbUser] = useState({})

  useEffect(() => {
    triggerListRefresh();
  }, [user]);

  function triggerListRefresh() {
    if (!user) {
      // no user ye
      return
    }
    var formData = new FormData();
    formData.append('userEmail', user.email);
   
    AuthApi('/api/home', getTokenSilently, formData)
    .then(res => {
      setHomeData(res)
      setPbUser(res.user)
    })  
  }
  function showFinishedOa() {
    if (homeData.finishedOa && homeData.finishedOa[0].length === 0 ) {
      return <div><pre>None yet</pre></div>
    }
    //first element is the list, second element is cursor data
    return <Table className='oaTable' striped bordered hover>
      <thead>
        <tr>
          <th>Attorney Docket</th>
          <th>Mailing Date</th>
        </tr>
      </thead>
      <tbody>
        {homeData.finishedOa[0].map( oaEntity => {
          return (
              <tr key={oaEntity.finishedProcessingTime} >
                <td><Link to={"/view/" + oaEntity.filename}>{oaEntity.attyDocket}</Link></td>
                <td>{timeHelper(oaEntity.mailingDate)}</td>
              </tr>
          )
        })}        
      </tbody>      
    </Table>
  }
  function showProcessingOa() {
    if (homeData.processingOa && homeData.processingOa[0].length === 0 ) {
      return <div><pre>None yet</pre></div>
    }

    return <div>
      <div className='procNotice'>* We will email you when processing completes.</div>
      {homeData.processingOa[0].map (processedOaEntity => {
        return <div key={processedOaEntity.uploadTime}><b>{timeHelper(processedOaEntity.uploadTime, true)}</b> - Uploaded {processedOaEntity.originalname} </div>
      })}
    </div>
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
      var date = new Date(timestamp);
      return (1+date.getMonth()) + "/" + date.getDate() + "/" + date.getFullYear()
    }
  }

  let elementsToShow;
  if (!user || !homeData) {
    elementsToShow = <div style={{display: "flex", justifyContent: "center", marginTop: "1rem"}}><Spinner animation="border" /></div>
  } else {
    elementsToShow = <div className='oaList'>
    <div className='oaColumn'>
      <div className='columnHeader'>Office Actions</div>
      {showFinishedOa()}
    </div>
    <div className='processingColumn'>
      <div className='columnHeader'>Processing</div>
      {showProcessingOa()}
    </div>
  </div>
  }

  return (
    <div className='homeLayout'>
        {pbUser.oaCredits > 0 && <Alert className="mb-0" variant='success'>
            You have <b>{pbUser.oaCredits}</b> Office Action processing credit{pbUser.oaCredits > 1 && 's'} remaining.
        </Alert>}
        {pbUser.oaCredits <=0 && !pbUser.customerId && <Alert className="mb-0" variant='warning'>
            Please add <Link to='/account'>payment information</Link> to upload more office actions.
        </Alert>}        
        <div className='uploadOa'>
          <UploadView triggerListRefresh={triggerListRefresh} pbUser={pbUser} />
        </div>
        {elementsToShow}
    </div>
  )



}

export default HomeView;
