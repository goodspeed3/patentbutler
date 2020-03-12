import React, {useState, useEffect} from 'react';
import './process.css'
import AuthApi from './AuthApi'
import { useAuth0 } from "../react-auth0-spa";
import {Switch, Route} from 'react-router-dom'
import Spinner from 'react-bootstrap/Spinner'
import SplitPane from 'react-split-pane';
import PdfView from './PdfView'
import OaInput from './OaInput'

function ProcessView (props) {
    const { getTokenSilently, user } = useAuth0();
    const [downloadedData, setDownloadedData] = useState(null)
    const [panePosition, setPanePosition] = useState('60%')
    const [oaObject, setOaObject] = useState({})

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
            saveObjToCloud()
        }
    }, [oaObject])
    const handlePane = (val) => {
        // localStorage.setItem('splitPos', size)
    
        setPanePosition(val)
      }
    const saveObjToCloud = () => {
        var formData = new FormData();
        formData.append('oaObject', JSON.stringify(oaObject))
        AuthApi('/adminApi/saveOaObject', getTokenSilently, formData)
        .then(res => {
            console.log(res)
        })
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
                <PdfView downloadedData={downloadedData} fileData={props.location.state} panePosition={panePosition}/>
              </div>
              <div className='rightCol'>
                <Switch>
                  <Route exact path='/admin/process'>
                      <OaInput fileData={props.location.state} oaObject={oaObject} setOaObject={setOaObject} />
                  </Route>
                  {/* <Route path='/admin/process/priorArt'>
                      <PriorArtSubview />
                  </Route> */}
                </Switch>
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
