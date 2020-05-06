import React from 'react';
import './FooterView.css'
import { HashLink as Link } from 'react-router-hash-link';
import Button from 'react-bootstrap/Button'

function FooterView () {

    return (
        <div className='footer'>
            <div><small>© 2020 PatentButler | Butler Services, LLC</small> <br />
            <a href='https://www.twitter.com/patentbutler'><Button variant='link'><small>Twitter</small></Button></a>
            <a href='https://www.facebook.com/patentbutler'><Button variant='link'><small>Facebook</small></Button></a>

            {/* <Link to='/about'><Button variant='link'>About</Button></Link> */}
            <Link to='/privacy'><Button variant='link'><small>Privacy</small></Button></Link>
            {/* <Link to='/terms'><Button variant='link'>Terms</Button></Link> */}
            </div>
        </div>            

    )
}
  
export default FooterView;
