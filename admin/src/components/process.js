import React, {useState, useEffect} from 'react';
import './process.css'
import AuthApi from './AuthApi'
import { Redirect, useParams } from 'react-router-dom';
import { useAuth0 } from "../react-auth0-spa";
// import {Switch, Route} from 'react-router-dom'
import Spinner from 'react-bootstrap/Spinner'
import SplitPane from 'react-split-pane';
import PdfView from './PdfView'
import OaInput from './OaInput'

function ProcessView (props) {
    const { getTokenSilently, user } = useAuth0();
    const [downloadedData, setDownloadedData] = useState(null)
    const [panePosition, setPanePosition] = useState('60%')
    // const [oaObject, setOaObject] = useState({})
    const [showPriorArt, setShowPriorArt] = useState(false)
    const [priorArtList, setPriorArtList] = useState([])
    const [rejectionList, setRejectionList] = useState([])
    const [redirectToHome, setRedirectToHome] = useState(false)
    let { filename } = useParams()
    const [citationObj, setCitationObj] = useState({})
    const [fileData, setFileData] = useState(null)

    
    useEffect(() => {
        if (!user || !filename  ) {
            return
        }
        var formData = new FormData();
        formData.append('filename', filename);

        //process as blob
        AuthApi('/adminApi/downloadOa', getTokenSilently, formData, true)
        .then(res => {
            setDownloadedData(res)
        })

        AuthApi('/adminApi/getOaObj', getTokenSilently, formData)
        .then(res => {
            setFileData(res.fileData)
          })

      }, [user, getTokenSilently, filename]);

    const handlePane = (val) => {
        // localStorage.setItem('splitPos', val)
    
        setPanePosition(val)
      }

    const savePaToCloud = (formData) => {
        // formData.append('paObject', JSON.stringify(oaObject))
        return AuthApi('/adminApi/uploadPa', getTokenSilently, formData)

    }

    const saveOaToCloud = (obj, sendEmail = false) => {
      var formData = new FormData();
      formData.append('oaObject', JSON.stringify(obj))
      formData.append('sendEmail', sendEmail)

      AuthApi('/adminApi/saveOaObject', getTokenSilently, formData).then(res => {
          if (sendEmail) {
            setRedirectToHome(true)
          }
      })
    }


    var elementsToShow = <div />;
    if (user && downloadedData && fileData) {
        elementsToShow = (
        <div className='leftAndRightCol'>
            <SplitPane 
              split="vertical" 
              defaultSize={"50%"} 
              // onDragFinished = {size => this.handlePane(size)}
              onChange={size => handlePane(size)} 
              maxSize={-200} 
              minSize={500}
            >
              <div className='leftCol'>
                  <OaInput fileData={fileData} saveOaToCloud={saveOaToCloud} setShowPriorArt={setShowPriorArt} savePaToCloud={(formData) => savePaToCloud(formData)} priorArtList={priorArtList} setPriorArtList={setPriorArtList} rejectionList={rejectionList} setRejectionList={setRejectionList} setCitationObj={setCitationObj} />
              </div>
              <div className='rightCol'>
                  <PdfView fileData={fileData} downloadedData={downloadedData} panePosition={panePosition} setShowPriorArt={setShowPriorArt} showPriorArt={showPriorArt} priorArtList={priorArtList} setPriorArtList={setPriorArtList} rejectionList={rejectionList} citationObj={citationObj} setCitationObj={setCitationObj} />
              </div> 
            </SplitPane>
        </div>
        )
    } else {
        elementsToShow = <div style={{display: "flex", justifyContent: "center", marginTop: "1rem"}}><Spinner animation="border" /></div>
    }
    return (
    <div>
        {redirectToHome && <Redirect to='/admin' />}
        {elementsToShow}
    </div>
    )
}

export default ProcessView;
