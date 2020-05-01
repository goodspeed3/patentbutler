import React, {useEffect, useState} from 'react';
import './BlogView.css'
import { useParams } from 'react-router-dom';
import Jumbotron from 'react-bootstrap/Jumbotron'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
// import Card from 'react-bootstrap/Card'
import FooterView from './FooterView';
import Image from 'react-bootstrap/Image'

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
            // console.log(post.html)
        })

      }, []);

    var htmlToRender = (<div className='singlePost'>
        <Jumbotron fluid>
        <Container>
        <Col md={{ span: 8, offset: 2 }} >
            <h1 className='singlePostTitle'>{singlePost.title}</h1>
            <p className='text-muted'>{new Date(singlePost.updated_at).toLocaleDateString('en-US', {
                    month: 'numeric',
                    day: 'numeric',
                    year: 'numeric'
                })}</p>
        </Col>
        </Container>
        </Jumbotron>
        <Container>
            <Col className='singlePostBody' md={{ span: 8, offset: 2 }} >
                {singlePost.feature_image && 
                <Row style={{paddingBottom: '1.5rem'}}>
                    <Image src={singlePost.feature_image} fluid />
                </Row>                
                }

                <Row dangerouslySetInnerHTML={{__html: singlePost.html}} />
            </Col>
        </Container>
        <FooterView />
        </div>)

    return htmlToRender
}

export default BlogPostView;
