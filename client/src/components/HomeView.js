import React, { useState, useEffect } from 'react';
import './HomeView.css'
import UploadView from './UploadView';

import AuthApi from './AuthApi'
import { useAuth0 } from "../react-auth0-spa";

function HomeView() {
  const { getTokenSilently, user } = useAuth0();
  const [homeData, setHomeData] = useState({})
  useEffect(() => {
    triggerListRefresh();
  }, [user]);

  function triggerListRefresh() {
    if (!user) {
      console.log('no user yet')
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


    return <div><pre>{JSON.stringify(homeData)}</pre></div>
  }
  function showProcessingOa() {



    return <div><pre>{JSON.stringify(homeData)}</pre></div>
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
