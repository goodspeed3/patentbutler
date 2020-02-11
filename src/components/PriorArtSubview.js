import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
// import Col from 'react-bootstrap/Col';
// import Row from 'react-bootstrap/Row';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import { Document, Page, pdfjs } from 'react-pdf'
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

var DEFAULT_URL = process.env.PUBLIC_URL + '/marks.pdf';


class PriorArtSubview extends Component {
  constructor(props) {
    super(props);

    var priorArt = this.getPriorArt(this.props.uiData);
    this.state = {
      uiData: this.props.uiData,
      publicationNumber: this.props.match.params.publicationNumber,
      citation: this.props.match.params.citation,
      priorArt: priorArt,
      numPages: null,
      pageNumber: 1,
  
      // selectedParagraphs: this.getSelectedPara(
      //   priorArt,
      //   this.props.match.params.citation
      // )
    };
  }
  getPriorArt(uiData) {
    var priorArt;
    for (var i = 0; i < this.props.uiData.rejectionList.length; i++) {
      var rejectionObj = this.props.uiData.rejectionList[i];
      if (rejectionObj.priorArtList) {
        for (var j = 0; j < rejectionObj.priorArtList.length; j++) {
          var candidatePriorArt = rejectionObj.priorArtList[j];
          if (
            candidatePriorArt.publicationNumber ===
            this.props.match.params.publicationNumber
          ) {
            priorArt = candidatePriorArt;
            return priorArt;
          }
        }
      }
    }
    return null;
  }
  // getSelectedPara(priorArt, citation) {
  //   var range = 1; //number of surrounding paragraphs to show
  //   var index = 0;
  //   var start = 0;
  //   var end = 0;
  //   for (var i = 0; i < priorArt.paragraphList.length; i++) {
  //     var paragraphObj = priorArt.paragraphList[i];
  //     if (paragraphObj.citation === citation) {
  //       index = i;
  //     }
  //   }
  //   if (index <= range) {
  //     start = 0;
  //   } else {
  //     start = index - range;
  //   }
  //   if (index + range >= priorArt.paragraphList.length - 1) {
  //     end = priorArt.paragraphList.length - 1;
  //   } else {
  //     end = index + range;
  //   }
  //   var selectedPara = [];
  //   for (var j = start; j <= end; j++) {
  //     selectedPara.push(priorArt.paragraphList[j]);
  //   }

  //   return selectedPara;
  // }

  onDocumentLoadSuccess = (document) => {
    const { numPages } = document;
    this.setState({
      numPages,
      pageNumber: 1,
    });
  };
  changePage = offset => this.setState(prevState => ({
    pageNumber: prevState.pageNumber + offset,
  }));

  previousPage = () => this.changePage(-1);

  nextPage = () => this.changePage(1);


  render() {
    const { numPages, pageNumber } = this.state;

    return (
      <div className="PAView">
        <Breadcrumb className='breadcrumb'>
          <Breadcrumb.Item href="/view">Prior Art Overview</Breadcrumb.Item>
          <Breadcrumb.Item active>{this.state.priorArt.abbreviation}, {this.state.priorArt.publicationNumber} @ {this.state.citation}</Breadcrumb.Item>
        </Breadcrumb>     
        <Document
          file={DEFAULT_URL}
          onLoadSuccess={this.onDocumentLoadSuccess}
        >
          <Page pageNumber={pageNumber} />
        </Document>
        <div>
          <p>
            Page {pageNumber || (numPages ? 1 : '--')} of {numPages || '--'}
          </p>
          <button
            type="button"
            disabled={pageNumber <= 1}
            onClick={this.previousPage}
          >
            Previous
          </button>
          <button
            type="button"
            disabled={pageNumber >= numPages}
            onClick={this.nextPage}
          >
            Next
          </button>
        </div>

        {/* {this.showPriorArt(this.state.selectedParagraphs)} */}
        </div>
    );
  }

  // showPriorArt = paragraphsToShow => {
  //   return paragraphsToShow.map(paParagraph => (
  //     <Row key={'p' + paParagraph.citation}>
  //       <Col>
  //         <h4>{paParagraph.citation}</h4>
  //       </Col>
  //       <Col md="auto">
  //         <p>{paParagraph.text}</p>
  //       </Col>
  //     </Row>
  //   ));
  // };


  
}

export default withRouter(PriorArtSubview);
