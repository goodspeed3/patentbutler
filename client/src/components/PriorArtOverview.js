import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import './PriorArtOverview.css'
import { Document, Page, pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = process.env.PUBLIC_URL + '/pdf.worker.min.js'

class PriorArtOverview extends Component {
  constructor(props) {
    super(props);
    this.paDiv = React.createRef()
    this.state = { uiData: this.props.uiData, pdfWidth: 0 };
  }
  render() {
    // console.log(this.state.uiData.priorArtList)
    return <div className="PAView" ref={this.paDiv}>{this.displayOverview(this.state.uiData.priorArtList)}</div>;
  }
  componentDidMount() {
    this.setState({
      pdfWidth: this.paDiv.current.clientWidth
    })
  }
  displayOverview = listOfPriorArt => {
    return listOfPriorArt.map(priorArt => (
      <Card key={priorArt.publicationNumber} className="card">
        <Card.Header className='cardHeader'>{priorArt.abbreviation} ({priorArt.publicationNumber})</Card.Header>
        {/* <Card.Img className='cardImg' variant="top" src={priorArt.figureThumb} /> */}
        <Document 
          file={priorArt.cloudUrl}
          cMapUrl={process.env.PUBLIC_URL + '/cmaps/'}
          cMapPacked={true} >
        <Page 
          pageNumber={1}
          width={this.state.pdfWidth}
         /></Document>
        <Card.Body className='cardBody'>
          <Card.Text className='cardAssignee'>{priorArt.assignee}</Card.Text>
          <Card.Text>{priorArt.title}</Card.Text>
        </Card.Body>
      </Card>
    ));
  };
}

export default withRouter(PriorArtOverview);
