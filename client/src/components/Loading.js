import React from "react";
import loading from "../img/loading.svg";

const Loading = () => (
  <div className="spinner" style={{display: 'flex',  justifyContent:'center', alignItems:'center', height: '100vh'}}>
    <img src={loading} alt="Loading" />
  </div>
);

export default Loading;
