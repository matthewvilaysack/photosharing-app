import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter, Route, Switch, Redirect } from 'react-router-dom';
import { Grid, Paper } from '@mui/material';
import './styles/main.css';

import TopBar from './components/TopBar';
import UserDetail from './components/UserDetail';
import UserList from './components/UserList';
import UserPhotos from './components/UserPhotos';
import LoginRegister from './components/LoginRegister';


class PhotoShare extends React.Component {
  constructor(props) {
    super(props);
    const storedState = localStorage.getItem('photoShareState');
    const initialState = storedState ? JSON.parse(storedState) : {
      updatePhotos: false,
      appContext: '',
      isLoggedIn: false,
      user: null,
      isLoading: true, 
    };
    this.state = initialState;
  }

  componentDidMount() {
    setTimeout(() => {
      this.setState({ isLoading: false });
    }, 1000);
  }

  componentDidUpdate() {
    localStorage.setItem('photoShareState', JSON.stringify(this.state));
  }

  isLoggedIn = () => {
    return this.state.isLoggedIn;
  };

  setUser = (event, loggedIn, user) => {
    this.setState({ user: user, isLoggedIn: loggedIn, appContext: '' });
  };

  setAppContextDetails = (event, user) => {
    this.setState({ appContext: `${user.first_name} ${user.last_name}'s Details` });
  };

  setAppContextPhotos = (event, user) => {
    this.setState({ appContext: `Photos of ${user.first_name} ${user.last_name}` });
  };

  setPhotos = (status) => {
    this.setState({ updatePhotos: status });
  };


  render() {
    if (this.state.isLoading) {
      return <div>Loading...</div>;
    }

    return (
      <HashRouter>
        <div>
          <Grid container spacing={8}>
            <Grid item xs={12}>
              <TopBar
                user={this.state.user}
                setPhotos={this.setPhotos}
                appContext={this.state.appContext}
                isLoggedIn={this.isLoggedIn()}
                logout={this.setUser}
              />
            </Grid>
            <div className="cs142-main-topbar-buffer" />

            <Grid item sm={3}>
              <Paper className="cs142-main-grid-item">
                {this.isLoggedIn() ? <UserList setDetails={this.setAppContextDetails} /> : null}
              </Paper>
            </Grid>
            <Grid item sm={9}>
              <Paper className="cs142-main-grid-item" style={{ overflow: 'auto' }}>
                <Switch>
                  <Route exact path="/" render={(props) => <LoginRegister {...props} login={this.setUser} />} />
                  {!this.isLoggedIn() ? (
                    <Route path="/login-register" render={(props) => <LoginRegister {...props} login={this.setUser} />} />
                  ) : (
                    <Redirect path="/login-register" to={'/users/' + this.state.user._id} />
                  )}

                  {this.isLoggedIn() ? (
                    <Route
                      path="/users/:userId"
                      render={(props) => (
                        <UserDetail {...props} setPhotos={this.setAppContextPhotos} setDetails={this.setAppContextDetails} />
                      )}
                    />
                  ) : (
                    <Redirect path="/users/:userId" to="/login-register" />
                  )}

                  {this.isLoggedIn() ? (
                    <Route
                      path="/photos/:userId"
                      render={(props) => (
                        <UserPhotos
                          {...props}
                          user={this.state.user}
                          isLoggedIn={this.isLoggedIn()}
                          updatePhotos={this.state.setPhotos}
                          setDetails={this.setAppContextDetails}
                          setPhotos={this.setAppContextPhotos}
                        />
                      )}
                    />
                  ) : (
                    <Redirect path="/photos/:userId" to="/login-register" />
                  )}

                  {this.isLoggedIn() ? (
                    <Route path="/users" component={UserList} />
                  ) : (
                    <Redirect path="/users" to="/login-register" />
                  )}
                  <Route path="/login-register" render={(props) => <LoginRegister {...props} login={this.setUser} />} />
                </Switch>
              </Paper>
            </Grid>
          </Grid>
        </div>
      </HashRouter>
    );
  }
}

ReactDOM.render(<PhotoShare />, document.getElementById('photoshareapp'));
