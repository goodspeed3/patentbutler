import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect, withRouter, Link } from 'react-router-dom';
import Navbar from 'react-bootstrap/Navbar';
import logo from './img/logo.svg'
import './App.css';
import UploadView from './components/UploadView';
import OaOverview from './components/OaOverview';

class App extends Component {
  constructor(props) {
    super(props);
    var SampleOfficeAction = {
      mailingDate: '2019-04-10T03:42:38.594Z',
      applicationNumber: '12/703143',
      attyDocket: 'MSFT-01328US0',
      rejectionList: [
        {
          typeText: '§ 101 Rejection',
          type: '101'
        },
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
              figureList: [
                {
                  reference: 'Fig. 1',
                  subreferenceList: ['104', '102', '100', '106', '108'],
                  pagePreviewUrl: 'http://'
                },
                {
                  reference: 'Fig. 2',
                  subreferenceList: [
                    '122',
                    '120',
                    '124',
                    '126',
                    '122a',
                    '126a'
                  ],
                  pagePreviewUrl: 'http://'
                },
                {
                  reference: 'Fig. 3',
                  subreferenceList: [
                    '141',
                    '142',
                    '140c',
                    '140d',
                    '140b',
                    '140a',
                    '140e',
                    '140f',
                    '140g',
                    '140h',
                    '140i'
                  ],
                  pagePreviewUrl: 'http://'
                },
                {
                  reference: 'Fig. 4A',
                  subreferenceList: [],
                  pagePreviewUrl: 'http://'
                },
                {
                  reference: 'Fig. 4B',
                  subreferenceList: [],
                  pagePreviewUrl: 'http://'
                },
                {
                  reference: 'Fig. 4C',
                  subreferenceList: [],
                  pagePreviewUrl: 'http://'
                }
              ],
              paragraphList: [
                {
                  citation: '[0002]',
                  page: 13,
                  text:
                    'This invention relates generally to video processing and more particularly to tracking depth of an image and/or a marker associated with the image to provide real time motion capture for video game applications.'
                },
                {
                  citation: '[0010]',
                  page: 13, 
                  text:
                    'In another embodiment, a method for controlling an object presented on a display screen in communication with a computing device through real time motion capture is provided. The method initiates with identifying a depth image associated with an object being tracked. Then, a model associated with both an object presented on a display screen and the object being tracked is identified. Next, the model is fit to the depth image to capture motion associated with the object being tracked. Then, the object presented on the display screen is controlled in real time according to the fitting of the model to the depth image.'
                },
                {
                  citation: '[0011]',
                  page: 13, 
                  text:
                    'In yet another embodiment, a method for controlling movements of an image presented on a display screen through real time motion capture is provided. The method initiates with defining a model of a person. Then, a location of a marker on the model of the person is identified. Next, a depth image corresponding to a portion of the model of the person is provided. The portion of the model includes the marker. Then, the location of the marker is associated with a point on the depth image. Next, the portion of the model is positioned based upon a configuration of the depth image. Then, a video character displayed on a display screen is controlled according to the positioning of the portion of the model.'
                },
                {
                  citation: '[0036]',
                  page: 15, 
                  text:
                    'It should be appreciated that the markers may take on various forms. For example, material having a certain shape, color, pattern, reflective capability, or some other distinguishing quality so that a video capture device can identify a point in space by the marker may be used. One skilled in the art will appreciate that retro-reflective material may be used to provide a distinguishing reflective capability. Additionally, a light associated with the video capture device may be used in combination with the retro-reflective tape to provide the location in space of the starting point for a particular appendage of the control object. In one embodiment, the markers may take the form of blinking lights. Here, the lights could be non-visible light, such as infrared light. The lights may blink at a set frequency where the set frequency corresponds to a particular person or team.'
                },
                {
                  citation: '[0037]',
                  page: 15, 
                  text:
                    'In one embodiment, the video capture device is configured to provide a depth image that can be used to fill in portion of the skeleton image and position the skeleton image in three dimensional space. Thus, markers 140 a-140 i provide data as to a starting location of an appendage or limb and the depth image from the video capture device can fill in the appendage or limb in three dimensional space. As used herein, the terms appendage and limb are not meant to be limiting as a person, i.e., control object, may be controlling an object that is also captured by the depth image. Thus, the appendage or limb may include the objects being controlled by the person acting as a control object. In another embodiment, the video capture device does not have depth capturing capability and the markers will indicate a known location in space for a starting point of an appendage or limb. Here, an arm, hand, leg, foot, or some other appendage may be filled in from a database storing a typical configuration of the associated appendage. For example, a depth image of the control object can be taken prior to starting the game and the depth image may be stored in a database as a model to be used as needed for the control of a video game character in real time. In yet another embodiment, a video capture device is used to capture motion of the person playing the video game without markers. Here, certain assumptions about the location of the object, e.g., which hand, foot, etc., are from the right side or left side are made in order to translate the captured motion for control of a video game character. Thus, in each embodiment described above, the captured motion is used to control motion associated with a character of a video game in real time.'
                },
                {
                  citation: '[0050]',
                  page: 18, 
                  text:
                    'In another embodiment, a method for controlling an object presented on a display screen in communication with a computing device through real time motion capture is provided. The method initiates with identifying a depth image associated with an object being tracked. Then, a model associated with both an object presented on a display screen and the object being tracked is identified. Next, the model is fit to the depth image to capture motion associated with the object being tracked. Then, the object presented on the display screen is controlled in real time according to the fitting of the model to the depth image.'
                }
              ],
              pageColumnLineEntriesList: []
            },
            {
              publicationNumber: 'US20080170123',
              abbreviation: 'Albertson',
              priorityDate: '1/12/07',
              figureThumb: process.env.PUBLIC_URL + '/pa_thumb2.png',
              abstract:
                'A computer-implemented method, system, and program product includes a movement processing system for capturing a first three-dimensional movement of a user and capturing at least another three-dimensional movement of the user, wherein the three-dimensional movement is determined using at the at least one image capture device aimed at the body of the user. A projected movement system predicts a movement baseline based on the first three-dimensional movement of the user and predicts at least one subsequent movement range based on the at least another three-dimensional movement of the user. Based on a comparison of the movement baseline with the at least one subsequent movement, the projected movement systems predicts a projected movement of a user for tracking changes in a range of body movement of a user.',
              title:
                'Tracking a range of body movement based on 3d captured image streams of a user',
              inventorList: [
                'Jacob C Albertson, Kenneth C. Arnold, Steven D. Goldman, Michael A. Paolini, Anthony J. Sessa '
              ],
              assignee: 'International Business Machines Corp',
              figureList: [
                {
                  reference: 'Fig. 3',
                  subreferenceList: [
                    '202',
                    '204',
                    '240',
                    '308',
                    '310',
                    '312',
                    '316',
                    '318',
                    '319',
                    '320',
                    '112',
                    '110',
                    '104'
                  ],
                  pagePreviewUrl: 'http://'
                }
              ],
              paragraphList: [
                {
                  citation: '[0057]',
                  page: 19, 
                  text:
                    'In the example, video processor 316, video processor 318, and sensor processor 319 each create and stream the properties, including positions, color, size, shape, and orientation, of the detected objects to a geometry processor 320. In one example, each processed frame streamed to geometry processor 320 may include, but is not limited to, a camera ID, a frame number, a time stamp, and combinations of two or more of X axis coordinates (x_loc), Y axis coordinates (y_loc), and Z axis coordinates (z_loc). It is important to note that x_loc, y_loc, and z_loc may each include multiple sets of points and other data that identify all the properties of an object. If multiple objects are detected and tracked within a single frame, the X axis coordinates and Y axis coordinates for each object may be included in a single streamed object property record or in multiple separate streamed object property records. In addition, a streamed property frame, such as the frame from sensor processor 319 for a SONAR detected position, may include Z axis location coordinates, listed as z_loc, for example.'
                }
              ],
              pageColumnLineEntriesList: []
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
        }
      ]
    };
    this.state = {
      uiData: SampleOfficeAction
    };
  }

  render() {
    return (
      <Router>
        <Navbar className="headerBar" bg="light" variant="light">
          <Navbar.Brand fixed="top">
            <Link to="/view">
              <img
                src={logo}
                width="160"
                className="d-inline-block align-top"
                alt="logo"
              />
            </Link>
          </Navbar.Brand>
        </Navbar>
        <Switch>
          <Route exact path="/" render={this.uploadFunc} />
          <Route path="/view" render={this.oaViewFunc} />
          {/* <Route
            path="/subview/:publicationNumber/:citation"
            render={this.oaSubviewFunc}
          /> */}
        </Switch>
      </Router>
    );
  }
  uploadFunc = props => {
    return <UploadView onReady={this.showUi} />;
  };
  oaViewFunc = props => {
    if (Object.keys(this.state.uiData).length === 0) return <Redirect to="/" />;

    return <OaOverview uiData={this.state.uiData} />;
  };
  // oaSubviewFunc = props => {
  //   if (Object.keys(this.state.uiData).length === 0) return <Redirect to="/" />;

  //   return (
  //     <OaSubview
  //       key={props.match.params.publicationNumber + props.match.params.citation}
  //       uiData={this.state.uiData}
  //     />
  //   );
  // };
  showUi = response => {
    this.setState({ uiData: response });
    /* Need to add link to /view/:hash to access specific uiData */
    this.props.history.push('/view');
  };
}

export default withRouter(App);
