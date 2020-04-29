import React, {useEffect, useState} from 'react';
import './BlogView.css'
import { useParams } from 'react-router-dom';
import Jumbotron from 'react-bootstrap/Jumbotron'
import Container from 'react-bootstrap/Container'
// import Row from 'react-bootstrap/Row'
// import Col from 'react-bootstrap/Col'
// import Card from 'react-bootstrap/Card'
import FooterView from './FooterView';

import GhostContentAPI from '@tryghost/content-api'
const blog = new GhostContentAPI({
    url: 'https://blog.patentbutler.com',
    key: 'dabb5e4bdd54d4c638b9bb10bc',
    version: "v3"
  });
  
function BlogPostView () {
    const [singlePost, setSinglePost] = useState({})
    let { slug } = useParams();

    useEffect(() => {
        blog.posts.read({slug: slug}).then(post => {
            setSinglePost(post)
            console.log(post)
        })

      }, []);

    var htmlToRender = (<div className='singlePost'>
        <Jumbotron fluid>
        <Container>
            <h1 className='singlePostTitle'>{singlePost.title}</h1>
        </Container>
        </Jumbotron>
        <Container dangerouslySetInnerHTML={{__html: singlePost.html}} >
        </Container>
        <FooterView />
        </div>)

    return htmlToRender
}

export default BlogPostView;
