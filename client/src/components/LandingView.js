import React from 'react';
import './LandingView.css'
import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button'

function LandingView () {

    return (
    <div className='landing'>
        <div className='block1'>
            <div>
                <h1 className='tagline'>The fastest way to respond to Office Actions</h1>
                <h4 className='subTagline'>Upload an OA (.pdf), get a new experience</h4>
                <div className='cta'><Button>Sign Up for Free</Button></div>
            </div>
            <img className='landingImg' width='1200' alt='landingA' src={process.env.PUBLIC_URL + '/landingA.png'} />
        </div>    
        <div className='block2' id="features">
            <div >
                <h1 className='secondTagline'>See USPTO Examiner remarks side-by-side with cited art</h1>
                <h4 className='subTagline'>Read everything in one place</h4>
            </div>
            <div>
                <div>
                <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52"><circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/><path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/></svg>
                </div>
                <div class="desc"><b>Be a more efficient patent practitioner</b><br />PatentButler immediately identifies what the examiner is arguing so you can effectively respond.</div>
                <div>
                <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52"><circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/><path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/></svg>
                </div>
                <div class="desc"><b>Spend less time searching and more time lawyering</b><br />PatentButler automatically gathers all relevant § 102 and §103 art and highlights key focus areas.
                </div>
                <img className='landingImg' width='1000' alt='landingB' src={process.env.PUBLIC_URL + '/landingB.png'} />

            </div>
        </div>
        <div className='block1'>
            <div>
                <h1 className='secondTagline'>FAQ</h1>
                <p>
                    How does PatentButler work?
                </p>
                <p>Through a combination of machine learning and human optimization, PatentButler takes an office action, gathers relevant art, and highlights actionable areas for a practitioner to focus on.</p>
            </div>
        </div>    
        <div className='block2'>
            <div>
                <h1 className='secondTagline'>You're in great company.</h1>
                <h4 className='subTagline'>See what people say about us</h4>
            </div>
            <div>
                <div>I save hours for each office action I handle using PatentButler.  - Lawyer at Fish & Richardson, P.C.</div>
                <div>PatentButler makes it easy to come up with OA responses because I see everything in one place.  - Agent at Sheppard Mullin, LLP</div>
                <div>Where was PatentButler when I started practicing patent law?  - Lawyer at Baker Botts, LLP</div>

            </div>
        </div>
        <div className='block1'>
            <div>
                <h1 className='secondTagline'>Ready to get started?</h1>
                <div className='cta'><Button>Sign Up for Free</Button></div>
            </div>
        </div>    
        <div className='block2'>
            <div>© 2020 PatentButler &#183; <Link to='/about'>About</Link></div>
        </div>            

    </div>
    )
}

export default LandingView;
