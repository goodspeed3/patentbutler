import React, { Component } from 'react';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Card from 'react-bootstrap/Card';
import './PriorArtOverview.css'

class PriorArtOverview extends Component {
  constructor(props) {
    super(props);
    this.state = { uiData: this.props.uiData };
  }
  render() {
    var listOfPriorArt = this.getListOfPriorArt(
      this.state.uiData.rejectionList
    );
    return <div>{this.displayOverview(listOfPriorArt)}</div>;
  }

  getListOfPriorArt = rejectionList => {
    var listPa = [];
    for (var i = 0; i < rejectionList.length; i++) {
      if (rejectionList[i].priorArtList) {
        for (var j = 0; j < rejectionList[i].priorArtList.length; j++) {
          if (!this.doesContainPa(rejectionList[i].priorArtList[j], listPa)) {
            listPa.push(rejectionList[i].priorArtList[j]);
          }
        }
      }
    }
    return listPa;
  };

  doesContainPa(pa, listPa) {
    for (var i = 0; i < listPa.length; i++) {
      if (listPa[i].publicationNumber === pa.publicationNumber) {
        return true;
      }
    }
    return false;
  }

  displayOverview = listOfPriorArt => {
    // console.log(listOfPriorArt);
    return listOfPriorArt.map(priorArt => (
      <Card className="card">
        <Card.Header className='cardHeader'>{priorArt.abbreviation} ({priorArt.publicationNumber})</Card.Header>
        <Card.Img className='cardImg' variant="top" src={priorArt.figureThumb} />
        <Card.Body className='cardBody'>
          <Card.Text className='cardAssignee'>{priorArt.assignee} &#183; {priorArt.priorityDate}</Card.Text>
          <Card.Text>{priorArt.title}</Card.Text>
        </Card.Body>
      </Card>
    ));
  };
}

export default PriorArtOverview;
