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
    let { filename, user:email } = props.location.state
    const [citationObj, setCitationObj] = useState({})

    
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
    const copyCitations = (c, rejectionList) => {

        //copy citations over
        var newCitationList=[]
        for (var i=0; i<rejectionList.length; i++) {
          const rejection = rejectionList[i]
          if (!rejection.claimArgumentList) continue
          for (var j=0; j<rejection.claimArgumentList.length; j++) {
            const claimArgument = rejection.claimArgumentList[j]
            if (!claimArgument.citationList) continue
            for (var k=0; k<claimArgument.citationList.length; k++) {
              const citationObj = claimArgument.citationList[k]
              
              let preExistingData = c[citationObj.publicationNumber]
              var boundingBoxes = [];
              if (preExistingData) {
                for (var x = 0; x<preExistingData.length; x++) {
                  var preExistingCitation = preExistingData[x]
                  if (preExistingCitation.citation === citationObj.citation) {
                    boundingBoxes = preExistingCitation.boundingBoxes
                  }
                }
              }
              var newObj = {
                ...citationObj,
                boundingBoxes: boundingBoxes
              }
              newCitationList.push(newObj)
            }
          }
        }
        if (newCitationList.length === 0) return c
        var newCitationObj = {}
        //clear citationObj 
        for (i=0; i<newCitationList.length; i++) {
          const co = newCitationList[i]
          if (!co.publicationNumber) continue
          newCitationObj[co.publicationNumber] = []
        }

        let keyObj = Object.keys(newCitationObj) 
        for (i=0; i<keyObj.length; i++) {
          const pubnum = keyObj[i]
          const citList = newCitationObj[pubnum]
          for (j=0; j<newCitationList.length; j++) {
            const co = newCitationList[j]
            if (co.publicationNumber === pubnum) {
              //only add to list if it doesn't already exist
              let tCit = co.citation
              if (!citList.some(o => o.citation === tCit )) {
                // delete co.publicationNumber //don't need it anymore
                citList.push(co)
              }
            }
          }
          //sort the citations
          newCitationObj[pubnum].sort((first, second) => (second.citation < first.citation) ? 1 : -1 )
        }
        return newCitationObj
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
                  <OaInput fileData={props.location.state} setOaObject={setOaObject} setShowPriorArt={setShowPriorArt} savePaToCloud={(formData) => savePaToCloud(formData)} priorArtList={priorArtList} setPriorArtList={setPriorArtList} rejectionList={rejectionList} setRejectionList={setRejectionList} copyCitations={copyCitations} setCitationObj={setCitationObj} />
              </div>
              <div className='rightCol'>
                  <PdfView fileData={props.location.state} downloadedData={downloadedData} panePosition={panePosition} setShowPriorArt={setShowPriorArt} showPriorArt={showPriorArt} priorArtList={priorArtList} setPriorArtList={setPriorArtList} rejectionList={rejectionList} citationObj={citationObj} setCitationObj={setCitationObj} copyCitations={copyCitations} />
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
