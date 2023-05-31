import React from "react";
import ReactDOM from "react-dom";
import { Grid, Paper } from "@mui/material";
import { HashRouter, Route, Switch } from "react-router-dom";

import "./styles/main.css";
import TopBar from "./components/TopBar";
import UserDetail from "./components/UserDetail";
import UserList from "./components/UserList";
import UserPhotos from "./components/UserPhotos";

class PhotoShare extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      appContext: "",
    };
  }

  // Handle app context for user photos.
  setAppContextPhotos = (event, user) => {
    this.setState({ appContext: `Photos of ${user.first_name} ${user.last_name}` });
  };

  // Handle app context for user details.
  setAppContextDetails = (event, user) => {
    this.setState({ appContext: `${user.first_name} ${user.last_name}'s Details` });
  };

  render() {
    return (
      <HashRouter>
        <div>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TopBar appContext={this.state.appContext} />
            </Grid>
            <div className="cs142-main-topbar-buffer" />
            <Grid item sm={3}>
              <Paper className="cs142-main-grid-item">
                <UserList setDetails={this.setAppContextDetails} />
              </Paper>
            </Grid>
            <Grid item sm={9}>
              <Paper className="cs142-main-grid-item">
                <Switch>
                  <Route
                    path="/users/:userId"
                    render={(props) => (
                      <UserDetail
                        setPhotos={this.setAppContextPhotos}
                        setDetails={this.setAppContextDetails}
                        {...props}
                      />
                    )}
                  />
                  <Route
                    path="/photos/:userId"
                    render={(props) => (
                      <UserPhotos
                        setPhotos={this.setAppContextPhotos}
                        setDetails={this.setAppContextDetails}
                        {...props}
                      />
                    )}
                  />
                  <Route path="/users" component={UserList} />
                </Switch>
              </Paper>
            </Grid>
          </Grid>
        </div>
      </HashRouter>
    );
  }
}

ReactDOM.render(<PhotoShare />, document.getElementById("photoshareapp"));
