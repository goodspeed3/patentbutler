import React, { Component } from 'react';
import { HashLink as Link } from 'react-router-hash-link';
import './OaMetadata.css'
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
            let prefix = (this.props.demo ? '/demo' : '/view/' + metadata.filename)
            return (<div className="rejectionType" key={element.type}><Link to={prefix+'#' +element.type}>{element.typeText}</Link></div>)
          })
        }
        {/* //link should work, not in dev b/c request is proxied to server.  localhost:3001/.... should work */}
        <div className='rejectionType external'><Link to={'/api/getOa/'+metadata.filename} target='_blank'>Office Action</Link></div>

      </div>
    );
  }
}

export default OaMetadata;
