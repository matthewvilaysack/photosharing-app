import React from "react";
import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import axios from "axios";
import "./styles.css";

class TopBar extends React.Component {
  handleLogout = () => {
    axios.post("/admin/logout", { login_name: this.props.user.login_name })
      .then((res) => {
        if (res.status === 200) {
          this.props.logout(null, false, null);
        }
      })
      .catch((err) => {
        console.log("Logout failed:", err);
      });
  };

  handleDeleteAccount = () => {
    axios.post("/user/delete")
      .then((res) => {
        if (res.status === 200) {
          this.props.logout(null, false, null);
        }
      })
      .catch((err) => {
        console.log("Account deletion failed:", err);
      });
  };

  render() {
    const { user, appContext, isLoggedIn } = this.props;
    // const id = user._id;

    return (
      <AppBar className="cs142-topbar-appBar" position="absolute">
        <Toolbar>
          {!isLoggedIn ? (
            <Typography style={{ display: "inline-block", margin: "5px" }} variant="h5" color="inherit">
              {"Please Login"}
            </Typography>
          ) : (
            <div style={{ display: "inline-block" }}>
              <Typography style={{ margin: "5px" }} variant="h6" color="inherit">
                {"Hi " + user.login_name}
              </Typography>
              <Button style={{ display: "inline-block", margin: "5px" }} variant="contained" onClick={this.handleLogout}>
                Logout
              </Button>
              <Button style={{ display: "inline-block", margin: "5px" }} variant="contained" color="secondary" onClick={this.handleDeleteAccount}>
                Delete Account
              </Button>
            </div>
          )}

          <div className="cs142-topbar-appBar-context">
            {appContext && (
              <Typography className="cs142-topbar-text" style={{ display: "inline-block" }} variant="h5" color="inherit">
                {appContext}
              </Typography>
            )}
          </div>
        </Toolbar>
      </AppBar>
    );
  }
}

export default TopBar;
