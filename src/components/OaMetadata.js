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
        <div className='metadata metadataTitle'>Due</div>
        <div className='metadata'>5 days</div>
        <br />
        <div className='divider'></div>
        <br />
        {
          metadata.rejectionList.map( (element) => {
            return (<div className="rejectionType" key={element.type}><Link to={'/view#'+element.type}>{element.typeText}</Link></div>)
          })
        }
      </div>
    );
  }
}

export default OaMetadata;
