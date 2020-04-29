import React, {useEffect, useState} from 'react';
import './BlogView.css'
import { Link } from 'react-router-dom';
import Jumbotron from 'react-bootstrap/Jumbotron'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Card from 'react-bootstrap/Card'
import FooterView from './FooterView';

import GhostContentAPI from '@tryghost/content-api'
const blog = new GhostContentAPI({
    url: 'https://blog.patentbutler.com',
    key: 'dabb5e4bdd54d4c638b9bb10bc',
    version: "v3"
  });
  
function BlogView () {
    const [posts, setPosts] = useState([])
    // const [featuredPost, setFeaturedPost] = useState({})

    useEffect(() => {
        blog.posts
        .browse({limit: 10,})
        .then((posts_res) => {
            // console.log(posts_res)
            setPosts(posts_res)
        })
        .catch((err) => {
            console.error(err);
        });

      }, []);

    var htmlToRender = (<div className='blog'>
        <Jumbotron fluid>
        <Container>
            <h1>Welcome to the Blog!</h1>
            <p>Our mission is to develop a service that transforms the patent prosecution experience.</p>
        </Container>
        </Jumbotron>
        <Container>
            <Col>
            {
            posts.map(p => 
                <Row key={p.id}>
                <Card>
                <Card.Header as="h5" className='blogTitle'><Link to={`/blog/${p.slug}`}>{p.title}</Link></Card.Header>
                <Card.Body>
                    {/* <Card.Title>Special title treatment</Card.Title> */}
                    <Card.Text className='blogExcerpt'>{p.excerpt}</Card.Text>
                </Card.Body>
                </Card>

                </Row>
            )
        }                
            
            </Col>
        </Container>
        <FooterView />
        </div>)
    
    return htmlToRender
}

export default BlogView;
