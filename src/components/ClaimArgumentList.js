import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { withRouter } from 'react-router-dom';
const reactStringReplace = require('react-string-replace');

class ClaimArgumentList extends Component {
  constructor(props) {
    super(props);
    this.state = { uiData: this.props.uiData };
  }

  render() {
    var claimArgumentList = this.state.uiData.rejectionList;
    return <div>{this.claimArgumentUi(claimArgumentList)}</div>;
  }
  claimArgumentUi = claimArgumentList => {
    // console.log(claimArgumentList);
    return claimArgumentList.map(rejectionObject => (
      <div key={'r' + rejectionObject.type}>
        <h2 id={rejectionObject.type}>
          <b>{rejectionObject.typeText}</b>
        </h2>
        {(rejectionObject.type === '102' || rejectionObject.type === '103') && (
          <div>{this.snippetListUi(rejectionObject.claimArgumentList)}</div>
        )}
      </div>
    ));
  };

  snippetListUi = rejectionObject => {
    // console.log(rejectionObject);
    //using index b/c I'm assuming order of items does not change
    return rejectionObject.map((claimArgumentObject, index) => (
      <div key={'claimArgument' + index}>
        <h3>
          <b>Claim {claimArgumentObject.number}:</b>
        </h3>
        <div>
          {claimArgumentObject.snippetList.map((snippetObject, index) => (
            <p key={'snippetText' + index}>
              {this.linkifySnippetBlock(snippetObject)}
            </p>
          ))}
        </div>
      </div>
    ));
  };

  linkifySnippetBlock = snippetObject => {
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
      snippetObject.snippetText,
      re,
      (match, i) => (
        <Link
          key={'l'+ i}
          to={{
            pathname: '/subview/' + mappedCitations[match] + '/' + match,
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
