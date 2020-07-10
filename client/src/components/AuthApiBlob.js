// import axios from 'axios';

//ONLY POSTS TO API
const AuthApiBlob = (url, getTokenSilently, body) => {
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
      return res.arrayBuffer()
    }).then(res => {
      const file = new Blob([res], {
        type: "application/pdf"
      });
      console.log(file)
      //Build a URL from the file
      const fileURL = URL.createObjectURL(file);
      //Open the URL on new Window
      window.open(fileURL);
    

    });
  
      
  } catch (error) {
    console.error(error);
  }
};

export default AuthApiBlob;