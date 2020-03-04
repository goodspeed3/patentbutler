// import axios from 'axios';

//ONLY POSTS TO API
const AuthApi = (url, getTokenSilently, body, blob = false) => {
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
      if (blob) {
        return res.blob()
      } else {
        return res.json()
      }
    }).catch(error => console.error(error));
  
      
  } catch (error) {
    console.error(error);
  }
};

export default AuthApi;