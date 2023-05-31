import React, { Component } from "react";
import { Typography, CardMedia, Box } from "@mui/material";
import { Link } from "react-router-dom";
import axios from "axios";

class UserPhotos extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: this.props.match.params.userId,
      users: [],
      userPhotos: [],
      options: {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric"
      },
    };
    this.cancelTokenSource = axios.CancelToken.source();
    this.fetchData = this.fetchData.bind(this);
  }

  componentDidMount() {
    this.fetchData();
    this.fetchUserList();
  }

  componentWillUnmount() {
    this.cancelTokenSource.cancel("Component unmounted");
  }

  componentDidUpdate(prevProps) {
    const { userId } = this.props.match.params;
    if (userId !== prevProps.match.params.userId) {
      this.setState({ id: userId }, this.fetchData);
    }
  }

  fetchData() {
    const { id } = this.state;
    axios
      .all([
        axios.get(`/user/${id}`, { cancelToken: this.cancelTokenSource.token }),
        axios.get(`/photosOfUser/${id}`, { cancelToken: this.cancelTokenSource.token })
      ])
      .then(
        axios.spread((userResponse, photosResponse) => {
          if (userResponse.status === 200 && photosResponse.status === 200) {
            this.setState({
              userPhotos: photosResponse.data
            });
            this.props.setPhotos(null, userResponse.data);
          } else {
            throw new Error("Error fetching user data");
          }
        })
      )
      .catch(error => {
        if (!axios.isCancel(error)) {
          console.error("Error fetching data:", error);
        }
      });
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

  formatDateTime(dateTime) {
    return  Date(dateTime).toLocaleString(undefined, this.state.options);
  }

  render() {
    const { userPhotos, users } = this.state;
    return (
      <>
        {userPhotos.map(photo => (
          <Box key={photo._id} display="flex" flexDirection="column" alignItems="center">
            <Typography variant="body1">Photo: {photo.file_name}</Typography>
            <CardMedia
              style={{ width: "500px" }}
              component="img"
              image={`/images/${photo.file_name}`}
              alt={photo.file_name}
            />
            <Typography variant="body2">Creation Date: {this.formatDateTime(photo.date_time)}</Typography>
            <Typography variant="body2">Comments:</Typography>
            {photo.comments &&
              photo.comments.map(comment => {
                const userComment = users.find(u => u._id === comment.user._id);
                if (userComment) {
                  return (
                    <div key={comment._id}>
                      <Typography
                        display="inline"
                        variant="body2"
                        component={Link}
                        to={`/users/${comment.user._id}`}
                      >
                        {`${userComment.first_name} ${userComment.last_name}`}
                      </Typography>
                      <Typography variant="body2">
                        {this.formatDateTime(comment.date_time)} - {comment.comment}
                      </Typography>
                    </div>
                  );
                }
              return userComment;
              }

              )}
          </Box>
        ))}
      </>
    );
  }
}

export default UserPhotos;
