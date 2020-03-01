// import axios from 'axios';

//ONLY POSTS TO API
const AuthApi = (url, getTokenSilently, body) => {
  try {

    return getTokenSilently().then( token => {
      return fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        method: 'POST',
        body: body
      })
    }).then( res => {
      return res.json()
    });
  
      
  } catch (error) {
    console.error(error);
  }
};

export default AuthApi;