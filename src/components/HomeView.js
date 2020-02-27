import React, { Component } from 'react';
import './HomeView.css'
import {   
  withRouter
 } from 'react-router-dom';

class HomeView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      uiData: this.props.uiData,
    };
  }


  render() {
    return (
      <div>Hi
          
      </div>
    );
  }



}

export default withRouter(HomeView);
