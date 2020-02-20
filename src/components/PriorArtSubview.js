import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
// import Col from 'react-bootstrap/Col';
// import Row from 'react-bootstrap/Row';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import { Document, Page, pdfjs } from 'react-pdf'
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'


class PriorArtSubview extends Component {
  constructor(props) {
    super(props);

    let priorArt = this.getPriorArt(this.props.uiData);
    this.state = {
      uiData: this.props.uiData,
      publicationNumber: this.props.match.params.publicationNumber,
      citation: this.props.match.params.citation,
      priorArt: priorArt,
      numPages: null,
      pageNumber: 1,
      scale: 1.0,
      originalPageWidth: 0,
      isScaleLocked: false,
      fitScale: 1.0
      // selectedParagraphs: this.getSelectedPara(
      //   priorArt,
      //   this.props.match.params.citation
      // )
    };
  }

  componentDidUpdate(prevProps){
    if(prevProps !== this.props){  
      let priorArt = this.getPriorArt(this.props.uiData);
      let pageToLoad = this.getPageToLoad(priorArt, this.props.match.params.citation)
      var updateStateObj = {
        publicationNumber: this.props.match.params.publicationNumber,
        citation: this.props.match.params.citation,
        pageNumber: pageToLoad,
        priorArt: priorArt
      }
      if (!this.state.isScaleLocked) {
        //this is needed for when user drags pane
        const parentDiv = document.querySelector('#PAView')
        let pageScale = parentDiv.clientWidth / this.state.originalPageWidth
        //only update scale if user did not zoom in or out
        updateStateObj['scale'] = pageScale
        updateStateObj['fitScale'] = pageScale
      }
      this.setState(updateStateObj);
    }
    // this.removeTextLayerOffset()
  }

  componentDidMount() {
    this.props.handler('50%');

  }
  componentWillUnmount() {
    this.props.handler('70%');


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
  getPageToLoad(priorArt, citation) {
    var paList = priorArt.citationList
    for (var i=0; i<paList.length; i++) {
      var citationObj = paList[i]
      if (citationObj.citation === citation) {
        return citationObj.page || 1
      }
    }

  }

  // getSelectedPara(priorArt, citation) {
  //   var range = 1; //number of surrounding paragraphs to show
  //   var index = 0;
  //   var start = 0;
  //   var end = 0;
  //   for (var i = 0; i < priorArt.citationList.length; i++) {
  //     var paragraphObj = priorArt.citationList[i];
  //     if (paragraphObj.citation === citation) {
  //       index = i;
  //     }
  //   }
  //   if (index <= range) {
  //     start = 0;
  //   } else {
  //     start = index - range;
  //   }
  //   if (index + range >= priorArt.citationList.length - 1) {
  //     end = priorArt.citationList.length - 1;
  //   } else {
  //     end = index + range;
  //   }
  //   var selectedPara = [];
  //   for (var j = start; j <= end; j++) {
  //     selectedPara.push(priorArt.citationList[j]);
  //   }

  //   return selectedPara;
  // }

  onDocumentLoadSuccess = (document) => {
    const { numPages } = document;
    this.setState({
      numPages,
    });
  };

  onPageLoad = (page) => {
    const parentDiv = document.querySelector('#PAView')
    let pageScale = parentDiv.clientWidth / page.originalWidth
    console.log("pagescale: " + pageScale + " parentDiv width: " + parentDiv.clientWidth)
    if (this.state.scale !== pageScale && !this.state.isScaleLocked) {
      this.setState({ scale: pageScale,
        fitScale: pageScale,
      originalPageWidth: page.originalWidth });
    }
  }
  onRenderSuccessHandler = () => {
    this.removeTextLayerOffset()
  }
  onLoadProgress = (data) => {
    console.log('onloadprogress: ' + data)
  }

  removeTextLayerOffset = () => {

    const textLayers = document.querySelectorAll(".react-pdf__Page__textContent");
      textLayers.forEach(layer => {
        const { style } = layer;
        style.top = "0";
        style.left = "0";
        style.transform = "";
    });
  }
  

  previousPage = () => this.changePage(-1);
  nextPage = () => this.changePage(1);
  changePage = offset => this.setState(prevState => ({
    pageNumber: prevState.pageNumber + offset,
  }));

  zoomIn = () => this.changeZoom(0.25);
  zoomOut = () => this.changeZoom(-0.25);
  changeZoom = offset => {
    var newState = {}
    newState['scale'] = this.state.scale + offset
    if (newState['scale'] > this.state.fitScale) {
      newState['isScaleLocked'] = true
    } else {
      newState['isScaleLocked'] = false
    }
    this.setState(newState) 
    // console.log(newState)   
  }
  handlePageEntry = (event) => {
    let pageNo = parseInt(event.target.value)
    if ( isNaN(pageNo) || pageNo > this.state.numPages || pageNo <= 0) {
      
    } else {
      this.setState({
        pageNumber: pageNo
      })  
    }
  }
  /*
  makeTextRenderer = searchText => textItem => this.highlightPattern(textItem.str, searchText);

  highlightPattern = (text, pattern) => {
    const splitText = text.split(pattern);
    
    if (splitText.length <= 1) {
      return text;
    }

    const matches = text.match(pattern);
  
    return splitText.reduce((arr, element, index) => (matches[index] ? [
      ...arr,
      element,
      <mark key={"found"+matches[index]+index}>
        {matches[index]}
      </mark>,
    ] : [...arr, element]), []);
  };
  */
  
  /*
    UIs needed: previous, enxt 
  */
  render() {
    const { numPages, pageNumber, scale } = this.state;
    return (
      <div id="PAView" className="PAView">
        <div className='subviewHeader'>
        <Breadcrumb>
          <Breadcrumb.Item href="/view">Prior Art Overview</Breadcrumb.Item>
    <Breadcrumb.Item active>{this.state.priorArt.abbreviation}, {this.state.priorArt.priorityDate}, {this.state.priorArt.publicationNumber} @ {this.state.citation}</Breadcrumb.Item>
        </Breadcrumb>
          <p>
            Page {pageNumber || (numPages ? 1 : '--')} of {numPages || '--'}
          </p>
          <input type="text" size={5} placeholder='Page #' onChange={this.handlePageEntry}/>
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
          <button
            type="button"
            disabled={scale >= 3}
            onClick={this.zoomIn}
          >
            Bigger
          </button>
          <button
            type="button"
            disabled={scale <= 0.5}
            onClick={this.zoomOut}
          >
            Smaller
          </button>              
        </div> 
        <Document
          file={this.state.priorArt.pdfUrl}
          cMapUrl={process.env.PUBLIC_URL + '/cmaps/'}
          cMapPacked={true}
          onLoadSuccess={this.onDocumentLoadSuccess}
        >
          <Page 
            pageNumber={pageNumber} 
            onLoadSuccess={this.onPageLoad}
            scale={this.state.scale}
            onLoadProgress={this.onLoadProgress}
            onRenderSuccess={this.onRenderSuccessHandler}
            // customTextRenderer={this.makeTextRenderer("0030")}
          />
        </Document>
        

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
