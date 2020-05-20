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
    key: '4ecdd0d401ff3dcbd92556fdde',
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
            <Col md={{ span: 8, offset: 2 }} >
            
            <h1>Welcome to the Blog!</h1>
            <p>Our mission is to transform the patent prosecution experience.</p>
            </Col>
        </Container>
        </Jumbotron>
        <Container>
            <Col md={{ span: 8, offset: 2 }} >
            {
            posts.map(p => 
                <Row key={p.id}>
                <Card>
                <Card.Header as="h5" className='blogTitle'><Link to={`/blog/${p.slug}`}>{p.title}</Link></Card.Header>
                <Card.Body>
                    {p.feature_image && <Link to={`/blog/${p.slug}`}><Card.Img style={{paddingBottom: "1rem"}} src={p.feature_image} /></Link>}
                    <Card.Text className='blogExcerpt' dangerouslySetInnerHTML={{__html: p.excerpt}} ></Card.Text>
                </Card.Body>
                <Card.Footer className="text-muted"><small>{new Date(p.updated_at).toLocaleDateString('en-US', {
                    month: 'numeric',
                    day: 'numeric',
                    year: 'numeric'
                })}</small></Card.Footer>
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
