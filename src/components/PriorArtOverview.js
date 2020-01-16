import React, { Component } from 'react';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import './PriorArtOverview.css';
import Button from 'react-bootstrap/Button';
import Tooltip from 'react-bootstrap/Tooltip';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

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
      <Container key={'i' + priorArt.abbreviation}>
        <Row>
          <Col>
            <h3>{priorArt.abbreviation}</h3>
          </Col>
          <Col>
            <OverlayTrigger
              trigger="click"
              placement="bottom"
              overlay={
                <Tooltip id={`tooltip-bottom`}>{priorArt.abstract}</Tooltip>
              }
            >
              <Button variant="primary">Abstract</Button>
            </OverlayTrigger>
          </Col>
        </Row>
        <Row>
          <Col>
            <b>Pub #</b>
          </Col>
          <Col md="auto">{priorArt.publicationNumber}</Col>
        </Row>
        <Row>
          <Col>
            <b>Title</b>
          </Col>
          <Col md="auto">{priorArt.title}</Col>
        </Row>
        <Row>
          <Col>
            <b>Assignee</b>
          </Col>
          <Col md="auto">{priorArt.assignee}</Col>
        </Row>
      </Container>
    ));
  };
}

export default PriorArtOverview;
