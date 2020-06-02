import React from 'react';
import './HomeView.css'
import { HashLink as Link } from 'react-router-hash-link';
// import Spinner from 'react-bootstrap/Spinner'
// import Alert from 'react-bootstrap/Alert'

// import AuthApi from './AuthApi'
// import { useAuth0 } from "../react-auth0-spa";
import CardDeck from 'react-bootstrap/CardDeck'
import Card from 'react-bootstrap/Card'

function HomeView() {
  // const { getTokenSilently, user } = useAuth0();

  // useEffect(() => {

  // }, [user]);



  return (
    <CardDeck className="homeButler">
      <Card>
        {/* <Card.Img variant="top" src="holder.js/100px160" /> */}
        <Card.Body>
          <Card.Title><Link to="/ids">Butler IDS</Link></Card.Title>
          <Card.Text>
            Easily create SB08s for your family of cases using IDS', 892's, and ISR's.
          </Card.Text>
        </Card.Body>
        {/* <Card.Footer>
          <small className="text-muted">Last updated 3 mins ago</small>
        </Card.Footer> */}
      </Card>
      <Card>
        {/* <Card.Img variant="top" src="holder.js/100px160" /> */}
        <Card.Body>
          <Card.Title><Link to="/oa">Butler OA</Link></Card.Title>
          <Card.Text>
            Easily navigate Office Actions from one single upload.
          </Card.Text>
        </Card.Body>
        {/* <Card.Footer>
          <small className="text-muted">Last updated 3 mins ago</small>
        </Card.Footer> */}
      </Card>
    </CardDeck>  
)



}

export default HomeView;
