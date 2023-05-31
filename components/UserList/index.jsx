import React, { Component } from "react";
import {
  Badge,
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import axios from "axios";

import "./styles.css";

class UserList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      users: [],
    };
  }

  

  componentDidMount() {
    this.fetchUserList();
  }
  componentWillUnmount() {
    this.cancelTokenSource.cancel("Component unmounted");
  }

  fetchUserList = async () => {
    try {
      const resp = await axios.get("/user/list");
      if (resp.status === 200) {
        this.setState({ users: resp.data });
        console.log(resp.data);
      }
    } catch (err) {
      console.error("Error attempting to fetch user list:", err);
    }
  };


  renderUserList() {
    return (
      <List component="nav">
        {this.state.users.map((user) => {
          const { _id, first_name, last_name } = user;
          return (
            <div key={_id}>
              <ListItem
                button
                component={Link}
                to={`/users/${_id}`}
                onClick={(e) => this.props.setDetails(e, user)}
                key={_id}
              >
              <Badge badgeContent={4} color="secondary"> </Badge>
                <ListItemText primary={`${first_name} ${last_name}`} />
              </ListItem>
              <Divider />
            </div>
          );
        })}
      </List>
    );
  }

  render() {
    return (
      <div>
        <Typography variant="body1">
          This is the user list, which takes up 3/12 of the window. You might
          choose to use <a href="https://mui.com/components/lists/">Lists</a>{" "}
          and <a href="https://mui.com/components/dividers/">Dividers</a> to
          display your users like so:
        </Typography>
        {this.renderUserList()}
        <Typography variant="body1">
          The model comes in from window.cs142models.userListModel() : )
        </Typography>
      </div>
    );
  }
}
export default UserList;
