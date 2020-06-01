import React, { Component } from 'react';
import { HashLink as Link } from 'react-router-hash-link';
import './OaMetadata.css'
import {withRouter} from 'react-router-dom';

class OaMetadata extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    var metadata = this.props.uiData;
    return (
      <div className='OaMetadata'>
        <div className='metadata metadataTitle'>App No</div>
        <div className='metadata'>{metadata.applicationNumber}</div>
        <br />
        <div className='metadata metadataTitle'>Atty Docket</div>
        <div className='metadata'>{metadata.attyDocket}</div>
        <br />
        <div className='metadata metadataTitle'>Mailing Date</div>
        <div className='metadata'>{new Date(metadata.mailingDate).toLocaleDateString('en-US')}</div>
        <br />
        <div className='metadata metadataTitle'>Filing Date</div>
        <div className='metadata'>{new Date(metadata.filingDate).toLocaleDateString('en-US')}</div>
        <br />        
        <div className='divider'></div>
        <br />
        {
          metadata.rejectionList.map( (element) => {
            // let prefix = (this.props.demo ? '/demo' : '/view/' + metadata.filename)
            let prefix = this.props.location.pathname
            return (<div className="rejectionType" key={element.id}><Link to={prefix+'#' +element.typeText}>{element.typeText}</Link>
            {/* {
              element.type === '102' || element.type === '103'
              &&
              element
            } */}
            </div>)
          })
        }
        {/* //link should work, not in dev b/c request is proxied to server.  localhost:3001/.... should work */}

        <div className='divider'></div>
        <br />
        <div className='rejectionType external'><Link to={'/api/get/oa/'+metadata.filename} target='_blank'>Office Action</Link></div>
        <div className='divider'></div>
        <br />
        {
          metadata.priorArtList.map((pa) => {
            return <div key={pa.id || pa.filename} className='rejectionType external'><Link to={'/api/get/pa/'+pa.filename} target='_blank'>{pa.abbreviation}</Link></div>
          })
        }
      </div>
    );
  }
}

export default withRouter(OaMetadata);
