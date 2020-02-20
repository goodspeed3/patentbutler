import React, { Component } from 'react';
import { HashLink as Link } from 'react-router-hash-link';
import { withRouter } from 'react-router-dom';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';

import './ClaimArgumentList.css'

const reactStringReplace = require('react-string-replace');

class ClaimArgumentList extends Component {
  constructor(props) {
    super(props);
    this.state = { uiData: this.props.uiData };
  }

  render() {
    var claimArgumentList = this.state.uiData.rejectionList;
    return <div className="claimArgumentListBlock">{this.claimArgumentUi(claimArgumentList)}</div>;
  }
  claimArgumentUi = claimArgumentList => {
    // console.log(claimArgumentList);
    return claimArgumentList.map(rejectionObject => (
      <div className="rejectionBlock" key={'r' + rejectionObject.type}>
        <div className="anchor" id={rejectionObject.type}></div>
        <h2 className="rejectionTitle" >
          <b>{rejectionObject.typeText}</b>
        </h2>
        {(rejectionObject.type === '101') && (
          <div className='blurbBlock'>{this.sec101Blurb(rejectionObject)}</div>
        )}

        {(rejectionObject.type === '102' || rejectionObject.type === '103') && (
          <div>{this.snippetListUi(rejectionObject.claimArgumentList)}</div>
        )}
      </div>
    ));
  };
  sec101Blurb = (rejectionObject) => {
    return rejectionObject.blurb
  }
  snippetListUi = (rejectionObject) => {
    // console.log(rejectionObject);
    //using index b/c I'm assuming order of items does not change
    return rejectionObject.map((claimArgumentObject, index) => (
      <Container className="claimBlock" key={'claimArgument' + index}>
        <Row>
          <Col>
            <b>Claim {claimArgumentObject.number}:</b>
          </Col>
          <Col>
            <b>Examiner Comments:</b>
          </Col>
        </Row>
        <hr />        
        {claimArgumentObject.snippetList.map((snippetObject, index) => (
          <Container key={'snippetText' + index}>
          <Row>
              <Col >
                  {snippetObject.snippetText}
              </Col>
              <Col>
                  {this.linkifySnippetBlock(snippetObject)}
              </Col>
          </Row>
          <hr />     
          </Container>   
        ))}
        </Container>
    ));
  };

  linkifySnippetBlock = (snippetObject) => {
    var regMappedCitations = [];
    var mappedCitations = {};
    for (var i = 0; i < snippetObject.citationList.length; i++) {
      var citationObj = snippetObject.citationList[i];
      var escapedRegExp = citationObj.citation.replace(
        /[-[\]{}()*+?.,\\^$|#\s]/g,
        '\\$&'
      );
      regMappedCitations.push(escapedRegExp);
      mappedCitations[citationObj.citation] = citationObj.publicationNumber;
    }

    var re = new RegExp('(' + regMappedCitations.join('|') + ')', 'gi');
    var linkifiedText = reactStringReplace(
      snippetObject.examinerText,
      re,
      (match, i) => (
        <Link
          key={'l'+ i}
          to={{
            pathname: '/view/' + mappedCitations[match] + '/' + match,
            // state: { updateMe: true }
          }}
        >
          {match}
        </Link>
      )
    );
    return linkifiedText;
  };
}
export default withRouter(ClaimArgumentList);
