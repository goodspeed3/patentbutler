import React, {useState, useEffect} from 'react';
import './process.css'
import AuthApi from './AuthApi'
import { Redirect } from 'react-router-dom';
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
    const [oaObject, setOaObject] = useState({})
    const [showPriorArt, setShowPriorArt] = useState(false)
    const [priorArtList, setPriorArtList] = useState([])
    const [rejectionList, setRejectionList] = useState([])
    const [redirectToHome, setRedirectToHome] = useState(false)
    let { filename, user:email, originalname } = props.location.state
    
    
    useEffect(() => {
        if (!user || !filename || !email ) {
            return
        }
        var formData = new FormData();
        formData.append('filename', filename);
        formData.append('email', email);
       
        //process as blob
        AuthApi('/adminApi/downloadOa', getTokenSilently, formData, true)
        .then(res => {
            setDownloadedData(res)
        })
      }, [user, getTokenSilently, filename, email]);

    useEffect(() => {
        if (oaObject.attyDocket) {
            var formData = new FormData();
            formData.append('oaObject', JSON.stringify(oaObject))
            AuthApi('/adminApi/saveOaObject', getTokenSilently, formData).then(res => {
                setRedirectToHome(true)
            })
        }
    }, [oaObject, getTokenSilently])
    const handlePane = (val) => {
        // localStorage.setItem('splitPos', size)
    
        setPanePosition(val)
      }

    const savePaToCloud = (formData) => {
        // formData.append('paObject', JSON.stringify(oaObject))
        return AuthApi('/adminApi/uploadPa', getTokenSilently, formData)

    }

    var elementsToShow = <div />;
    if (user && downloadedData) {
        elementsToShow = (
        <div className='leftAndRightCol'>
            <SplitPane 
              split="vertical" 
              defaultSize={'60%'} 
              // onDragFinished = {size => this.handlePane(size)}
              onChange={size => handlePane(size)} 
              maxSize={-200} 
              minSize={500}
            >
              <div className='leftCol'>
                  <OaInput fileData={props.location.state} setOaObject={setOaObject} setShowPriorArt={setShowPriorArt} savePaToCloud={(formData) => savePaToCloud(formData)} priorArtList={priorArtList} setPriorArtList={setPriorArtList} rejectionList={rejectionList} setRejectionList={setRejectionList} />
              </div>
              <div className='rightCol'>
                  <PdfView fileData={props.location.state} downloadedData={downloadedData} panePosition={panePosition} setShowPriorArt={setShowPriorArt} showPriorArt={showPriorArt} priorArtList={priorArtList} setPriorArtList={setPriorArtList} rejectionList={rejectionList} />
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
