import React, { Component } from 'react';
import { HashLink as Link } from 'react-router-hash-link';
import { withRouter } from 'react-router-dom';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Alert from 'react-bootstrap/Alert'

import './ClaimArgumentList.css'

const reactStringReplace = require('react-string-replace');

class ClaimArgumentList extends Component {
  constructor(props) {
    super(props);
    this.state = { uiData: this.props.uiData };
  }

  render() {
    var claimArgumentList = this.state.uiData.rejectionList;
    return <div className="claimArgumentListBlock">
      {this.props.demo && <Alert className='mb-0' variant='warning' style={{position: 'sticky', top: '0', zIndex: 10}}>Demo includes 2 mapped claims. <Alert.Link onClick={() => this.context.loginWithRedirect()}>Sign up for free.</Alert.Link></Alert>}
      {this.claimArgumentUi(claimArgumentList)}

    </div>;
  }
  claimArgumentUi = claimArgumentList => {
    // console.log(claimArgumentList);
    return claimArgumentList.map(rejectionObject => (
      <div className="rejectionBlock" key={'r' + rejectionObject.type}>
        <div className="anchor" id={rejectionObject.type}></div>
        <h2 className="rejectionTitle" >
          <b>{rejectionObject.typeText}</b>
        </h2>
        {(rejectionObject.type === '101' || rejectionObject.type === 'exrem' || rejectionObject.type === '112' || rejectionObject.type === 'other') && (
          <Container><Row className='blurbBlock'>{rejectionObject.blurb}</Row></Container>
        )}

        {(rejectionObject.type === '102' || rejectionObject.type === '103') && (
          <div>{this.snippetListUi(rejectionObject.claimArgumentList)}</div>
        )}
      </div>
    ));
  };
  doesReformattedListHaveClaim = (list, obj) => {
    return list.some(e => e.number === obj.number)
  }
  snippetListUi = (rejectionObject) => {
    // console.log(rejectionObject);
    //create snippet list
    var reformattedClaimArgumentList = [] //group by same claim for formatting purposes
    for (var i=0; i<rejectionObject.length; i++) {
      var snippetObj = rejectionObject[i]
      //if reformatted claim arg list has NO claim number yet
      if (!this.doesReformattedListHaveClaim(reformattedClaimArgumentList, snippetObj)) {
        reformattedClaimArgumentList.push({
          number: snippetObj.number,
          snippetList: [snippetObj]
        })
      } else { //add it to the existing element
        for (var j=0; j<reformattedClaimArgumentList.length; j++) {
          var reformattedClaimObj = reformattedClaimArgumentList[j]
          if (reformattedClaimObj.number === snippetObj.number) {
            reformattedClaimObj.snippetList.push(snippetObj)
          }
        }
  
      }
    }
    // console.log(reformattedClaimArgumentList)
    //using index b/c I'm assuming order of items does not change
    return reformattedClaimArgumentList.map((claimArgumentObject, index) => (
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
    let prefix = (this.props.demo ? '/demo' : '/view/' + this.props.match.params.filename)
    var linkifiedText = reactStringReplace(
      snippetObject.examinerText,
      re,
      (match, i) => (
        <Link
          key={'l'+ i}
          to={{
            pathname: prefix + '/' + encodeURIComponent(mappedCitations[match]) + '/' + encodeURIComponent(match),
            state: { updateMe: true }
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
