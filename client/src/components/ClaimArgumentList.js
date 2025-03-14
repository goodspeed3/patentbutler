import React, { Component } from 'react';
import { HashLink as Link } from 'react-router-hash-link';
import { withRouter } from 'react-router-dom';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Alert from 'react-bootstrap/Alert'
import { Auth0Context } from "../react-auth0-spa";

import './ClaimArgumentList.css'

const reactStringReplace = require('react-string-replace');

class ClaimArgumentList extends Component {
  static contextType = Auth0Context;

  constructor(props) {
    super(props);
    this.state = { uiData: this.props.uiData };
  }

  render() {
    var claimArgumentList = this.state.uiData.rejectionList;
    return <div>
      {this.props.demo && <Alert className='mb-0' variant='warning' style={{position: 'sticky', top: '0', zIndex: 10}}><Alert.Link onClick={() => this.context.loginWithRedirect()}>Sign up now - your first Office Action is free.</Alert.Link></Alert>}
      {this.claimArgumentUi(claimArgumentList)}

    </div>;
  }
  claimArgumentUi = claimArgumentList => {
    // console.log(claimArgumentList);
    return claimArgumentList.map(rejectionObject => (
      <div className="rejectionBlock" key={'r' + rejectionObject.id}>
        <div className="anchor" style={this.props.demo && {top: "-40px"}} id={rejectionObject.typeText}></div>
        <h2 className="rejectionTitle" >
          <b>{rejectionObject.typeText}</b>
        </h2>
        {(rejectionObject.type === '101' || rejectionObject.type === '112' || rejectionObject.type === 'otherRej') && (
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
            <b>{claimArgumentObject.number}:</b>
          </Col>
          <Col>
              <b></b>
          </Col>
        </Row>
        <hr />        
        {claimArgumentObject.snippetList.map((snippetObject, index) => (
          <Container key={'snippetText' + index}>
          {snippetObject.examinerBlob ?
          <Row className='oaImage'>
            <img src={snippetObject.examinerBlob} alt='oa'/>
          </Row>   
          :          
          <Row>
              {snippetObject.snippetText.length > 0 && 
              <Col >
                  {snippetObject.snippetText}
              </Col>
              }
              <Col>
                  {this.linkifySnippetBlock(snippetObject)}
              </Col>
          </Row>
          }
          <hr />     
          </Container>   
        ))}
        </Container>
    ));
  };

  linkifySnippetBlock = (snippetObject) => {
    var regMappedCitations = [];
    var mappedCitations = {};
    //need to sort by length descending so longest ones get linkified first which won't prevent shorter ones later prevent longer ones from getting linked
    snippetObject.citationList.sort((a, b) => {
      return (a.citation.length < b.citation.length) ? 1 : -1
    })

    for (var i = 0; i < snippetObject.citationList.length; i++) {
      var citationObj = snippetObject.citationList[i];
      var escapedRegExp = citationObj.citation.replace(
        /[-[\]{}()*+?.,\\^$|#\s]/g,
        '\\$&'
      );
      regMappedCitations.push(escapedRegExp);
      mappedCitations[citationObj.citation] = citationObj.abbreviation;
    }

    var re = new RegExp('(' + regMappedCitations.join('|') + ')', 'g');
    let prefix = (this.props.demo ? '/demo/' + this.props.match.params.filename : '/view/' + this.props.match.params.filename)
    
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
