import React from "react";
import { AppBar, Toolbar, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import "./styles.css";

class TopBar extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const defaultName = "Matthew Vilaysack";
    const { appContext } = this.props;
    return (
      <AppBar className="cs142-topbar-appBar" position="absolute">
        <Toolbar>
          <Typography variant="h5" color="inherit" component={Link} to="/">
            {defaultName}
          </Typography>
          {this.props.appContext !== "" ? (
          <Typography className = "cs142-topbar-appBar-context" variant="h5" color="inherit">
            {appContext}
          </Typography> 
        ) : <span></span>}
        </Toolbar>
      </AppBar>
    );
  }
}

export default TopBar;
