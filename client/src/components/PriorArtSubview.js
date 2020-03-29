import React, { Component } from 'react';
import { HashLink as Link } from 'react-router-hash-link';
import { withRouter } from 'react-router-dom';
// import Col from 'react-bootstrap/Col';
// import Row from 'react-bootstrap/Row';
import { Document, Page, pdfjs } from 'react-pdf'
import Spinner from 'react-bootstrap/Spinner'
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'


class PriorArtSubview extends Component {
  constructor(props) {
    super(props);
    let priorArt = this.getPriorArt(this.props.uiData);
    this.state = {
      uiData: this.props.uiData,
      publicationNumber: decodeURIComponent(this.props.match.params.publicationNumber),
      citation: decodeURIComponent(this.props.match.params.citation),
      priorArt: priorArt,
      numPages: null,
      pageNumber: 0,
      scale: 1.0,
      originalPageWidth: 0,
      isScaleLocked: false,
      fitScale: 1.0,
      didFinishRenderingPage: false,
      showTutorial: (localStorage.getItem('showTutorial') == null)
    };
  }
  handleClose = () => {
    this.setState({showTutorial: false});
    localStorage.setItem('showTutorial', false)
  };

  componentDidUpdate(prevProps){
    if(prevProps !== this.props){  
      let priorArt = this.getPriorArt(this.props.uiData);
      let pageToLoad = this.getPageToLoad(priorArt, decodeURIComponent(this.props.match.params.citation), prevProps.match.url !== this.props.match.url)
      var updateStateObj = {
        publicationNumber: decodeURIComponent(this.props.match.params.publicationNumber),
        citation: decodeURIComponent(this.props.match.params.citation),
        pageNumber: pageToLoad,
        priorArt: priorArt,
      }

      if (!this.state.isScaleLocked) {
        //this is needed for when user drags pane
        const parentDiv = document.querySelector('#PAView')
        let pageScale = parentDiv.clientWidth / this.state.originalPageWidth
        //only update scale if user did not zoom in or out
        updateStateObj['scale'] = pageScale
        updateStateObj['fitScale'] = pageScale
      }
      this.setState(updateStateObj, () => {
        this.scrollToFocus()
      });
    }
    // this.removeTextLayerOffset()
  }

  componentDidMount() {
    this.props.handler('50%');
  }
  componentWillUnmount() {
    this.props.handler('70%');

  }
  
  scrollToFocus = () => {
      //scroll accordingly
      var highlightedElement = document.getElementById('focusHighlight');
      if (highlightedElement) {
        highlightedElement.scrollIntoView();
      }

  }


  getPriorArt(uiData) {
    var priorArt;
    for (var i = 0; i < this.props.uiData.priorArtList.length; i++) {
      var candidatePriorArt = this.props.uiData.priorArtList[i];
      if (
        candidatePriorArt.publicationNumber ===
        decodeURIComponent(this.props.match.params.publicationNumber)
      ) {
        priorArt = candidatePriorArt;
        return priorArt;
      }
    }
    return null;
  }
  getPageToLoad(priorArt, citation, didUserChangeUrl) {
    //don't remember why i had this if statement
    // if (!didUserChangeUrl && this.state.pageNumber !== 0) {
    //   console.log("needed")
    //   return this.state.pageNumber
    // }
    // console.log(priorArt)
    var paList = priorArt.citationList
    for (var i=0; i<paList.length; i++) {
      var citationObj = paList[i]
      if (citationObj.citation === citation) {
        var citFirstPage;
        if (citationObj.boundingBoxes.length >0) {
          citFirstPage = citationObj.boundingBoxes[0].page
        }
        return citFirstPage || 1
      }
    }
    return 1
  }

  onDocumentLoadSuccess = (document) => {
    const { numPages } = document;
    this.setState({
      numPages,
    });
  };

  onPageLoad = (page) => {
    const parentDiv = document.querySelector('#PAView')
    let pageScale = parentDiv.clientWidth / page.originalWidth
    // console.log("pagescale: " + pageScale + " parentDiv width: " + parentDiv.clientWidth)
    if (this.state.scale !== pageScale && !this.state.isScaleLocked) {
      this.setState({ scale: pageScale,
        fitScale: pageScale,
      originalPageWidth: page.originalWidth });
    }
  }
  onRenderSuccessHandler = () => {

    this.setState({
      didFinishRenderingPage: true
    }, () => { this.scrollToFocus() })
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
    didFinishRenderingPage: false,
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
    newState['didFinishRenderingPage'] = false
    this.setState(newState) 
    // console.log(newState)   
  }
  handlePageEntry = (event) => {
    let pageNo = parseInt(event.target.value)
    if ( isNaN(pageNo) || pageNo > this.state.numPages || pageNo <= 0) {
      
    } else {
      this.setState({
        pageNumber: pageNo,
        didFinishRenderingPage: false
      })  
    }
  }

  generateOverlay = () => {
    const pdfDiv = document.querySelector('#pdfDiv')

    if (!this.state.didFinishRenderingPage || !pdfDiv) {
      return
    }
    var styleArray = []
    for (var i=0; i<this.state.priorArt.citationList.length; i++) {
      let citationBox = this.state.priorArt.citationList[i]
      for (var j=0; j<citationBox.boundingBoxes.length; j++) {
        let citationBoxIndividual = citationBox.boundingBoxes[j]
        if (citationBoxIndividual.page !== this.state.pageNumber) {
          continue;
        }
        var styleObj = {}
        styleObj.id=citationBox.id
        styleObj.idName=""
        styleObj.citation=citationBox.citation
        styleObj.position = "absolute"
        styleObj.top = citationBoxIndividual.boundingBox.y + "%"
        styleObj.left = citationBoxIndividual.boundingBox.x + "%"
        styleObj.width = citationBoxIndividual.boundingBox.width + "%"
        styleObj.height = citationBoxIndividual.boundingBox.height + "%"
        if (citationBox.citation === this.state.citation) {
          styleObj.backgroundColor = "#FF4241"
          //store the farthest down highlighted element, b/c that's likely the start of the highlighted portion
          styleObj.idName="focusHighlight"
        } else {
          styleObj.backgroundColor = "#FFE18F"
        }
        styleObj.opacity = "0.15"
        styleObj.zIndex= "10"
        styleArray.push(styleObj)

      }
    }

    
    var dimensions = {}
    if (!this.state.isScaleLocked) {
      dimensions.width = pdfDiv.clientWidth
      dimensions.height = pdfDiv.clientHeight
    } else {
      dimensions.width = pdfDiv.scrollWidth
      dimensions.height = pdfDiv.scrollHeight

    }

    return <div className='overlay' style={dimensions}>
      {
        styleArray.map((styleObj, i) =>  (
          <div id={styleObj.idName} style={styleObj} key={i + styleObj.top + '-' + styleObj.left + '-' + styleObj.width + '-' + styleObj.height}></div>
        ))
      }
    </div>
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
    const { numPages, pageNumber, scale} = this.state;

    return (
      <div id="PAView" className="PAView">
        <div className='subviewHeader' id="subviewHeader">
        <div className="pageMetadata"><Link to={this.props.demo ? '/demo' : "/view/" + this.props.uiData.filename }>Prior Art Overview</Link>
     &nbsp;| {this.state.priorArt.abbreviation},  {this.state.priorArt.publicationNumber} | (Page {pageNumber || (numPages ? 1 : '--')} of {numPages || '--'})</div>
          <div>
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
            <input type="text" size={5} placeholder='Page #' onChange={this.handlePageEntry}/>

          </div>      
        </div> 
        <div className='pdfDiv' id="pdfDiv" >
          <Document
            file={this.state.priorArt.cloudUrl}
            cMapUrl={process.env.PUBLIC_URL + '/cmaps/'}
            cMapPacked={true}
            onLoadSuccess={this.onDocumentLoadSuccess}
            loading=""
          >
            {!this.state.didFinishRenderingPage && <div style={{display: "flex", justifyContent: "center", marginTop: "1rem"}}><Spinner animation="border" /></div> }
            <Page 
              loading=""
              pageNumber={pageNumber} 
              onLoadSuccess={this.onPageLoad}
              scale={this.state.scale}
              onLoadProgress={this.onLoadProgress}
              onRenderSuccess={this.onRenderSuccessHandler}
              // customTextRenderer={this.makeTextRenderer("0030")}
            />
          </Document>
          {this.generateOverlay()}
        </div>
        {/* {this.showPriorArt(this.state.selectedParagraphs)} */}
        <Modal show={this.state.showTutorial} onHide={this.handleClose} dialogClassName="custom-dialog">
        <Modal.Header closeButton>
          <Modal.Title>Quick Tip</Modal.Title>
        </Modal.Header>
        <Modal.Body>Adjust the pane to focus on either the Office Action or the cited art.<img className='landingImg' width='1200' alt='nuxA' src={process.env.PUBLIC_URL + '/nuxA.png'} /></Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={this.handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>        
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
