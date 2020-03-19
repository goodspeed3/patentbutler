import React from 'react';
import './AboutView.css'
// import { Link } from 'react-router-dom';
// import moment from 'moment-timezone'

function PrivacyView () {

    return (
    <div className='about'>
        <h1 className='header'>Privacy Policy</h1>
        <img className='profile' alt='profile' src={process.env.PUBLIC_URL + '/profile.jpg'} />
        <p className="name">Jon Liu</p>
        <p className="blurb">PatentButler was started by Jon Liu - a patent attorney, software builder, and efficiency enthusiast.  When practicing patent prosecution at a big law firm, Jon noticed that many hours and large client budgets were spent on tasks that could be solved quickly by technology instead of humans, yet technology was not being leveraged.  Jon created PatentButler to optimize patent law practice using the latest technology.</p>
    </div>
    )
}

export default PrivacyView;
