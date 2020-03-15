import React, {useState, useEffect} from 'react';
import './process.css'
import AuthApi from './AuthApi'
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
    const [priorArtList, setPriorArtList] = useState({})
    const [rejectionList, setRejectionList] = useState([])

    let { filename, user:email } = props.location.state

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
            return AuthApi('/adminApi/saveOaObject', getTokenSilently, formData)
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
                  <OaInput fileData={props.location.state} oaObject={oaObject} setOaObject={setOaObject} setShowPriorArt={setShowPriorArt} savePaToCloud={(formData) => savePaToCloud(formData)} priorArtList={priorArtList} setPriorArtList={setPriorArtList} rejectionList={rejectionList} setRejectionList={setRejectionList} />
              </div>
              <div className='rightCol'>
                  <PdfView downloadedData={downloadedData} fileData={props.location.state} panePosition={panePosition} setShowPriorArt={setShowPriorArt} showPriorArt={showPriorArt} priorArtList={priorArtList} setPriorArtList={setPriorArtList} rejectionList={rejectionList} setRejectionList={setRejectionList} />
              </div> 
            </SplitPane>
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
