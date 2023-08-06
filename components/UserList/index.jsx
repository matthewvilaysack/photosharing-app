import React, { Component } from "react";
import {
  Divider,
  List,
  ListItem,
  ListItemText,
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

  fetchUserList = async () => {
    try {
      const resp = await axios.get("/user/list");
      if (resp.status === 200) {
        this.setState({ users: resp.data });
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
                onClick={(e) => {
                  this.props.setDetails(e, user);
                  }}
                key={_id}
              >
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
        {this.renderUserList()}
      </div>
    );
  }
}
export default UserList;
