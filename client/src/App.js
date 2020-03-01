import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect, Link } from 'react-router-dom';
import Navbar from 'react-bootstrap/Navbar';
import logo from './img/logo.svg'
import './App.css';
import OaOverview from './components/OaOverview';
import HomeView from './components/HomeView';
import ProfileView from './components/ProfileView';
// import history from "./utils/history";
import PrivateRoute from "./components/PrivateRoute";

import { Auth0Context } from "./react-auth0-spa";

class App extends Component {
  constructor(props) {
    super(props);
    var SampleOfficeAction = {
      mailingDate: '2019-04-10T03:42:38.594Z',
      applicationNumber: '12/703143',
      attyDocket: 'MSFT-01328US0',
      rejectionList: [
        {
          type: '103',
          typeText: '§ 103 Rejection',
          priorArtList: [
            {
              publicationNumber: 'US20040155962',
              abbreviation: 'Marks',
              priorityDate: '8/12/04',
              abstract:
                'Methods for real time motion capture for control of a video game character is provided. In one embodiment, a method initiates with defining a model of a control object. Then, a location of a marker on the model is identified. Next, movement associated with the control object is captured. Then, the movement associated with the control object is interpreted to change a position of the model. Next, movement of the character being presented on the display screen is controlled according to the change of position of the model. A computer readable media and a processing system enabling control of video character through real time motion capture are also provided.',
              title: 'Method and apparatus for real time motion capture',
              assignee: 'Sony Interactive Entertainment, Inc',
              inventorList: ['Richard Marks'],
              figureThumb: process.env.PUBLIC_URL + '/pa_thumb1.png',
              pdfUrl: process.env.PUBLIC_URL + '/marks.pdf',
              citationList: [
                {
                  citation: '[0002]',
                  page: 13,
                  boundingBox: {
                    x: 12,
                    y: 21,
                    width: 38,
                    height: 5.5
                  }
                },
                {
                  citation: '[0010]',
                  page: 13, 
                  boundingBox: {
                    x: 50,
                    y: 24,
                    width: 38,
                    height: 14.2

                  }                  
                },
                {
                  citation: '[0011]',
                  page: 13, 
                  boundingBox: {
                    x: 50,
                    y: 38,
                    width: 38,
                    height: 16

                  }                  
                },
                {
                  citation: '[0035]',
                  page: 15, 
                  boundingBox: {
                    x: 12,
                    y: 88,
                    width: 38,
                    height: 8
                  }                  
                },
                {
                  citation: '[0035]',
                  page: 15, 
                  boundingBox: {
                    x: 50,
                    y: 13,
                    width: 38,
                    height: 37
                  }                  
                },
                {
                  citation: '[0036]',
                  page: 15, 
                  boundingBox: {
                    x: 50,
                    y: 50,
                    width: 38,
                    height: 38
                  }
                },
                {
                  citation: '[0037]',
                  page: 15, 
                  boundingBox: {
                    x: 50,
                    y: 88,
                    width: 38,
                    height: 8
                  }
                },
              ],
            },
            {
              publicationNumber: 'US20080170123',
              abbreviation: 'Albertson',
              priorityDate: '1/12/07',
              figureThumb: process.env.PUBLIC_URL + '/pa_thumb2.png',
              pdfUrl: process.env.PUBLIC_URL + '/albertson.pdf',
              abstract:
                'A computer-implemented method, system, and program product includes a movement processing system for capturing a first three-dimensional movement of a user and capturing at least another three-dimensional movement of the user, wherein the three-dimensional movement is determined using at the at least one image capture device aimed at the body of the user. A projected movement system predicts a movement baseline based on the first three-dimensional movement of the user and predicts at least one subsequent movement range based on the at least another three-dimensional movement of the user. Based on a comparison of the movement baseline with the at least one subsequent movement, the projected movement systems predicts a projected movement of a user for tracking changes in a range of body movement of a user.',
              title:
                'Tracking a range of body movement based on 3d captured image streams of a user',
              inventorList: [
                'Jacob C Albertson, Kenneth C. Arnold, Steven D. Goldman, Michael A. Paolini, Anthony J. Sessa '
              ],
              assignee: 'International Business Machines Corp',
              citationList: [
                {
                  citation: '[0057]',
                  page: 19, 
                  boundingBox: {
                    x: 12,
                    y: 41,
                    width: 38,
                    height: 20
                  }
                }
              ]
            }
          ],
          claimArgumentList: [
            {
              number: 1,
              snippetList: [
                {
                  snippetText:
                    'comprising the processor-implemented steps of: tracking a body in a field of view of the motion capture system',
                  citationList: [
                    {
                      citation: '[0002]',
                      publicationNumber: 'US20040155962'
                    }
                  ],
                  examinerText: '(e.g., tracking depth of an image and/or a marker associated with the image to provvide real time motion capture, [0002], Marks).'
                },
                {
                  snippetText:
                    'including determining a model of the body ',
                  citationList: [
                    {
                      citation: '[0010]',
                      publicationNumber: 'US20040155962'
                    },
                  ],
                  examinerText: '(e.g., identifying a depth image associated with an object being tracked.  Then, a model associatd with both an object presented on a display screen and the object being tracked is identified.  Next, the model is fit to the depth image to capture motion associated with the object being tracked, [0010], Marks);'
                },            
                {
                  snippetText:
                    'determining reference points of the model',
                  citationList: [
                    {
                      citation: '[0011]',
                      publicationNumber: 'US20040155962'
                    },
                  ],
                  examinerText: '(e.g., the portion of the model includes the marker. Then, the location of the marker is associated with a point on the depth image. Next, the portion of the model is positioned based upon a configuration of the depth image, [0011], Marks)'
                },                             
                {
                  snippetText:
                    'determining a size and position of a zone based on the reference points ',
                  citationList: [
                    {
                      citation: '[0037]',
                      publicationNumber: 'US20040155962'
                    },
                  ],
                  examinerText: '(e.g., the markers may take on various forms. For example, material having a certain shape, color, pattern, reflective capability, or some other distinguishing quality so that a video capture device can identify a point in space by the marker may be used, [0037], Marks)'
                },                   
                {
                  snippetText:
                    'thezoneisa3-Dvolumeinthefieldofviewandhasacoordinatesystem which is defined relative to at least one of the reference points ',
                  citationList: [
                    {
                      citation: '[0036]',
                      publicationNumber: 'US20040155962'
                    }
                  ],
                  examinerText: '(e.g., the video capture device is configured to provide a depth image that can be used to fill in portion of the skeleton image and position the skeleton image in three dimensional space. Thus, markers 140a-140i provide data as to a starting location of an appendage or limb and the depth image from the video capture device can fill in the appendage or limb in three dimensional space,[0036], Marks)'
                },                     
                {
                  snippetText:
                    'based on the tracking, translating the movement of the hand in the zone to a corresponding action on a display',
                  citationList: [
                    {
                      citation: '[0010]',
                      publicationNumber: 'US20040155962'
                    },
                  ],
                  examinerText: '(e.g., identifying a depth image associated with an object being tracked. Then, a model associated with both an object presented on a display screen and the object being tracked is identified. Next, the model is fit to the depth image to capture motion associated with the object being tracked, [0010], Marks)'
                },      
                {
                  snippetText:
                    'tracking movement of a hand of the body in the zone relative to the coordinate system of the zone ',
                  citationList: [
                    {
                      citation: '[0057]',
                      publicationNumber: 'US20080170123'
                    }
                  ],
                  examinerText: '(e.g., In the example, video processor 316, video processor 318, and sensor processor 319 each create and stream the properties, including positions, color, size, shape, and orientation, of the detected objects to a geometry processor 320. In one example, each processed frame streamed to geometry processor 320 may include, but is not limited to, a camera ID, a frame number, a time stamp, and combinations of two or more of X axis coordinates (xloc), ¥Y axis coordinates (y _loc), and 4 axis coordinates (zloc). It is important to note that xloc, y loc, and zloc may each include multiple sets of points and other data that identifY all the properties of an object, [0057], Albertson).'
                },                                      
              ],
              summary: ''
            },
            {
              number: 2,
              snippetList: [
                {
                  snippetText:
                    'wherein the zone is offset from a center of the body, and is curved according to a natural biomechanical range of movement of the body',
                  citationList: [
                    {
                      citation: '[0035]',
                      publicationNumber: 'US20040155962'
                    }
                  ],
                  examinerText: '(e.g., the Skeleton image may be defined with varying precision, e.g., a variety of joint constraints. Of course, the more joints and limbs associated with the skeleton image or the model, correlates to more data required to be tracked. Here, markers 140a-140i are distributed over skeleton image 142. Markers 140a and 140d correspond to the wrist location; markers 140b and 140c correspond to an elbow location while marker 140c corresponds to the torso. Markers 140g and 1401 correspond to the knees and markers 140h and 140i correspond to the ankles, [0035], Marks)'
                },                 
              ]
            }
          ]
        },
        {
          typeText: '§ 101 Rejection',
          type: '101',
          blurb: '5. Claims 18-20 are rejected under 35 U.S.C. 101 as being directed to non-statutory subject matter. Claims 18-20 are rejected undeer 35 usc 101 since the claims are directed to non-statutory subject matter.  Claims 18-20 recite tangible computer-readable storage, which appear to cover both transitory and non-transitory embodiments.  The USPTO is required to give claims their broadest reasonable interpretation consistent with the specification during proceedings before the USPTO.  The BRI of a claim drawn to a CRM typically covers non-transitory and transitory propagating signals.  The examer suggests adding non-transitory to the claim.'
        },

      ]
    };
    this.state = {
      uiData: SampleOfficeAction
    };
  }
  static contextType = Auth0Context;

  render() {
    const { isAuthenticated, loginWithRedirect, logout } = this.context;

    return (
      <Router>
        <Navbar className="headerBar" bg="light" variant="light">
          <Navbar.Brand fixed="top">
            <Link to="/">
              <img
                src={logo}
                width="160"
                className="d-inline-block align-top"
                alt="logo"
              />
            </Link>
            {!isAuthenticated && (
        <button onClick={() => loginWithRedirect({})}>Log in</button>
          )}
          {isAuthenticated && <button onClick={() => logout()}>Log out</button>}

          </Navbar.Brand>
        </Navbar>
        <Switch>
          <Route exact path="/" render={this.homeFunc} />
          <PrivateRoute path="/home" component={HomeView} />
          <Route path="/view" render={this.oaViewFunc} />
          <PrivateRoute path="/profile" component={ProfileView} />
        </Switch>
      </Router>
    );
  }
  homeFunc = props => {
    return <div>Landing Page</div>;
  };

  oaViewFunc = props => {
    if (Object.keys(this.state.uiData).length === 0) return <Redirect to="/" />;

    return <OaOverview uiData={this.state.uiData} />;
  };
}


// export default withRouter(App);

export default App;
