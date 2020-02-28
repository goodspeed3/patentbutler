import React, { Component } from 'react';
import Jumbotron from 'react-bootstrap/Jumbotron';
import Form from 'react-bootstrap/Form';
import ProgressBar from 'react-bootstrap/ProgressBar';
import axios from 'axios';

class UploadView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      uiData: {},
      status: 'uploadOa' //uploadOa, OCR, getPriorArt, startUi, uiRdy
    };
  }

  render() {
    return (
      <div>
        <Jumbotron>
          <h1>
            {(() => {
              switch (this.state.status) {
                case 'uploadOa':
                  return 'Upload an Office Action';
                case 'OCR':
                  return 'Starting OCR...';
                case 'getPriorArt':
                  return 'Gathering Art...';
                case 'startUi':
                  return 'Generating UI...';
                default:
                  return '';
              }
            })()}
          </h1>
          <p>
            We will generate a unique link for you that will live for 14 days.
          </p>
          <div>
            {(() => {
              var progress = 0;
              switch (this.state.status) {
                case 'uploadOa':
                  return (
                    <Form>
                      <Form.Group controlId="formGroupFile">
                        <Form.Control
                          type="file"
                          onChange={this.handleUpload}
                          accept=".pdf"
                        />
                      </Form.Group>
                    </Form>
                  );
                case 'OCR':
                  progress = 20;
                  break;
                case 'getPriorArt':
                  progress = 50;
                  break;
                case 'startUi':
                  progress = 90;
                  break;
                default:
                  progress = 0;
              }
              return (
                <ProgressBar animated now={progress} label={`${progress}%`} />
              );
            })()}
          </div>
        </Jumbotron>
      </div>
    );
  }

  handleUpload = event => {
    var formData = new FormData();
    var oaFile = event.target.files[0];
    formData.append('file', oaFile);

    axios
      .post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      .then(response => {
        this.setState({ status: 'OCR' });
        // return true;
        return axios.get('/api/ocr', {
          params: {
            id: response.data
          }
        });
      })
      .then(response => {
        this.setState({ status: 'getPriorArt' });
        // return true;
        return axios.get('/api/getPriorArt');
      })
      .then(response => {
        this.setState({ status: 'startUi' });

        return axios.get('/api/startUI');
      })
      .then(response => {
        // console.log(response.data);
        this.props.onReady(response.data);
      })
      .catch(function(error) {
        console.log(error);
      });
  };
}

export default UploadView;
