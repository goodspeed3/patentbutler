import React, { useState, useEffect } from 'react';
import './HomeView.css'
import UploadView from './UploadView';
import Table from 'react-bootstrap/Table'
import { HashLink as Link } from 'react-router-hash-link';

import AuthApi from './AuthApi'
import { useAuth0 } from "../react-auth0-spa";

function HomeView() {
  const { getTokenSilently, user } = useAuth0();
  const [homeData, setHomeData] = useState(null)
  useEffect(() => {
    triggerListRefresh();
  }, [user]);

  function triggerListRefresh() {
    if (!user) {
      // no user yet
      return
    }
    var formData = new FormData();
    formData.append('userEmail', user.email);
   
    AuthApi('/api/home', getTokenSilently, formData)
    .then(res => {
      setHomeData(res)
      
    })  

  }
  function showFinishedOa() {
    if (homeData.finishedOa && homeData.finishedOa.length === 0 ) {
      return <div><pre>None yet</pre></div>
    }
    //first element is the list, second element is cursor data
    return <Table className='oaTable' striped bordered hover>
      <thead>
        <tr>
          <th>Attorney Docket</th>
          <th>Due Date</th>
        </tr>
      </thead>
      <tbody>
        {homeData.finishedOa[0].map( oaEntity => {
          return (
              <tr key={oaEntity.finishedProcessingTime} >
                <td><Link to="/view">{oaEntity.attorneyDocket}</Link></td>
                <td>{timeHelper(oaEntity.dueDate)}</td>
              </tr>
          )
        })}        
      </tbody>      
    </Table>
  }
  function showProcessingOa() {
    if (homeData.processingOa && homeData.processingOa.length === 0 ) {
      return <div><pre>None yet</pre></div>
    }

    return <div>
      <div className='procNotice'>* We will email you when processing completes.</div>
      {homeData.processingOa[0].map (processedOaEntity => {
        return <div key={processedOaEntity.uploadTime}><b>{timeHelper(processedOaEntity.uploadTime, true)}</b> - Uploaded {processedOaEntity.origname} </div>
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
      } else {
        let numHr = Math.ceil (diff / 3600)
        return numHr + " hr" + ((numHr > 1) ? 's' : '')  + " ago"
      }
    } else {
      var date = new Date(timestamp);
      return date.getMonth() + "/" + date.getDate() + "/" + date.getFullYear()
    }
  }

  if (!user || !homeData) {
    return <div />
  }

  return (
    <div className='homeLayout'>
        <div className='uploadOa'>
          <UploadView triggerListRefresh={triggerListRefresh} />
        </div>
        <div className='oaList'>
          <div className='oaColumn'>
            <div className='columnHeader'>Office Actions</div>
            {showFinishedOa()}
          </div>
          <div className='processingColumn'>
            <div className='columnHeader'>Processing</div>
            {showProcessingOa()}
          </div>
        </div>
    </div>
  )



}

export default HomeView;
