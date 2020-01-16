import React, { Component } from 'react';
import Table from 'react-bootstrap/Table';
class OaMetadata extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    var metadata = this.props.uiData;
    return (
      <Table striped bordered hover size="sm">
        <tbody>
          <tr>
            <td>
              <b>App #:</b>
            </td>
            <td>{metadata.applicationNumber}</td>
          </tr>
          <tr>
            <td>
              <b>Mailing Date:</b>
            </td>
            <td>
              {new Date(metadata.mailingDate).toLocaleDateString('en-US')}
            </td>
          </tr>
          <tr>
            <td>
              <b>Due in:</b>
            </td>
            <td>5 days</td>
          </tr>
        </tbody>
      </Table>
    );
  }
}

export default OaMetadata;
