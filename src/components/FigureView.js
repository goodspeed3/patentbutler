import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';

class FigureView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      uiData: this.props.uiData,
      publicationNumber: this.props.match.params.publicationNumber,
      citation: this.props.match.params.citation
    };

    console.log(this.state);
  }

  render() {
    return <h1>FigureView</h1>;
  }
}

export default withRouter(FigureView);
