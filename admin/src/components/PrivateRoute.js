import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { Route, withRouter } from "react-router-dom";
import { useAuth0 } from "../react-auth0-spa";

const PrivateRoute = ({ component: Component, path, ...rest }) => {
  const { loading, isAuthenticated, loginWithRedirect, user } = useAuth0();

  useEffect(() => {
    if (loading || isAuthenticated) {
      return;
    }
    const fn = async () => {
      await loginWithRedirect({
        appState: { targetUrl: path }
      });
    };
    fn();
  }, [loading, isAuthenticated, loginWithRedirect, path]);

  const render = props => {
    //ONLY ALLOWED USERS HERE
    let allowedEmails = ['jon+1@patentbutler.com', 'jon@patentbutler.com']

    if (isAuthenticated && user && user.email && allowedEmails.includes(user.email)) {
      return <Component {...props} />
    } else {
      return <div />
    }
  }

  return <Route path={path} render={render} {...rest} />;
};

PrivateRoute.propTypes = {
  component: PropTypes.oneOfType([PropTypes.element, PropTypes.func])
    .isRequired,
  path: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string)
  ]).isRequired
};

export default withRouter(PrivateRoute);
