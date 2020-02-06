import React, { Component } from 'react';
// import { HashLink as Link } from 'react-router-hash-link';
import { withRouter } from 'react-router-dom';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';

// use same css as ClaimArgumentList
import './ClaimArgumentList.css'

class ClaimArgumentSublist extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      uiData: this.props.uiData,
      publicationNumber: this.props.match.params.publicationNumber,
      citation: this.props.match.params.citation,
    };
  }
  componentDidMount() {
    window.scrollTo(0, 0);
  }

  render() {
    var oaArgumentList = this.state.uiData.rejectionList;
    return <div>{this.claimArgumentUi(oaArgumentList)}</div>;
  }
  claimArgumentUi = oaArgumentList => {
    // console.log(oaArgumentList);

    // find the right snippets based on citation and publication number
    var subset = [];
    for (var i=0; i<oaArgumentList.length; i++) {
      var rejectionObj = oaArgumentList[i];
      var selectedRejection = this.findSnippetFromRejection(this.state.publicationNumber, this.state.citation, rejectionObj)
      if (selectedRejection) {
        subset.push(selectedRejection)
      }
    }
    // console.log(subset)
    return subset.map(rejectionObject => (
      <div className="parentDiv" key={'r1' + rejectionObject.type}>
        <div className="anchor" id={rejectionObject.type}></div>
        <h2 className="rejectionTitle" >
          <b>Claim Rejection - {rejectionObject.typeText}</b>
        </h2>
        {(rejectionObject.type === '102' || rejectionObject.type === '103') && (
          <div>{this.snippetListUi(rejectionObject.claimArgumentList)}</div>
        )}
      </div>
    ));
  };

  findSnippetFromRejection = (publicationNumber, citation, rejectionObject) => {
    if (rejectionObject.type === '102' || rejectionObject.type === '103') {
      var copiedObj = JSON.parse(JSON.stringify(rejectionObject));
      var claimArgumentList = copiedObj.claimArgumentList;
      // console.log(claimArgumentList)
      for (var i=0; i<claimArgumentList.length; i++) {
        var claimWithSnippetsObj = claimArgumentList[i];
        // console.log(claimWithSnippetsObj)
        claimWithSnippetsObj.snippetList = claimWithSnippetsObj.snippetList.filter(item => {
          var containsCitation = false; 
          for (var k=0; k<item.citationList.length; k++) {
            var citationObj = item.citationList[k];
            if (citationObj.publicationNumber === publicationNumber && citationObj.citation === citation) {
              containsCitation = true
            }  
          }
          return containsCitation;
        })
      }
      console.log(copiedObj)
      
      return copiedObj
    }
    return null;
  }

  snippetListUi = rejectionObject => {
    // console.log(rejectionObject);
    return rejectionObject.filter( claimArgumentObject => {
    //remove all empty snippetLists first
      return claimArgumentObject.snippetList.length > 0
    }).map((claimArgumentObject, index) => (
      <Container className="claimBlock" key={'claimArgument1' + index}>
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
          <Container key={'snippetText1' + index}>
          <Row>
              <Col >
                  {snippetObject.snippetText}
              </Col>
              <Col>
                  {snippetObject.examinerText}
              </Col>
          </Row> 
          <hr />     
          </Container>   
        ))}
      </Container>
    ));
  };

}
export default withRouter(ClaimArgumentSublist);
