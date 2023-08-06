import React, { Component } from "react";
import { MentionsInput, Mention } from 'react-mentions';
import { Typography, CardMedia, Box, Snackbar, Button, FormControlLabel, Checkbox } from "@mui/material";
import { HashLink } from 'react-router-hash-link';
import { Link } from "react-router-dom";
import axios from "axios";

class UserPhotos extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedUsers: [],
      newComments: {},
      permissionsAdd: false,
      notification: "",
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
  uploadInput = React.createRef();

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
      .catch((error) => {
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

  handlecheckbox = (userId) => (e) => {
    const { selectedUsers } = this.state;
    const updatedSelectedUsers = e.target.checked
      ? [...selectedUsers, userId]
      : selectedUsers.filter((id) => id !== userId);
    this.setState({ selectedUsers: updatedSelectedUsers });
    console.log("selectedUsers after checkbox: ", this.state.selectedUsers);
  };

  handlepermissiontoggle = () => {
    this.setState((prevState) => ({
      permissionsAdd: !prevState.permissionsAdd
    }));
  };
  handlebutton = (e) => {
    e.preventDefault();
    if (this.uploadInput.current.files.length > 0) {
      const form = new FormData();
      form.append('userId', this.state.id);
      form.append('uploadedphoto', this.uploadInput.current.files[0]);
      if (!this.state.isPermissionOptional || this.state.selectedUsers.length > 0) {
        form.append('permissions', this.state.permissionsAdd);
        form.append("sharedList", this.state.selectedUsers);
      } else {
        form.append('permissions', false);
      }
      axios
        .post('/photos/new', form)
        .then((res) => {
          this.fetchData();
          console.log(res);
        })
        .catch((err) => {
          console.log("Error uploading photo:", err);
        });
    }
  };
  deletePhoto = (photoId) => {
    const { id } = this.state;
    axios
      .delete(`/photos/${photoId}`, { data: { user_id: id } })
      .then((res) => {
        if (res.status === 204) {
          this.fetchData(); 
        } else {
          console.log("Error deleting photo:", res.data);
        }
      })
      .catch((error) => {
        console.error("Error deleting photo:", error);
      });
  };
  
  changeNewComment = (photoId, e) => {
    const { newComments } = this.state;
    const comments = { ...newComments };
    comments[photoId] = e.target.value;
    this.setState({ newComments: comments });
  };

  handleAddComment = (e, photoId) => {
    e.preventDefault();
    const { newComments } = this.state;
    const newComment = newComments[photoId];
    const mentionedUsers = [];
    const curMentionedUserIDs = [];
  
    const mentionMatches = newComment.match(/@\[([\w\s]+)\]\((\w+)\)/g) ?? [];

    if (mentionMatches) {
        mentionMatches.forEach((mention) => {
        const match = mention.match(/@\[([\w\s]+)\]\((\w+)\)/);
        if (match && match.length === 3) {
            const userId = match[2];
            const mentionedUser = this.state.users.find((user) => user._id === userId);
            if (mentionedUser) {
                curMentionedUserIDs.push(mentionedUser._id);
                mentionedUsers.push(`@${mentionedUser.login_name}`);
            }
        }
        });
    }
    axios
      .post(`/commentsOfPhoto/${photoId}`, {
        id: this.state.id,
        comment: newComment,
        mentions: curMentionedUserIDs
      })
      .then((res) => {
         if (res.status === 400) {
          const comments = { ...newComments };
          comments[photoId] = "";
          this.setState({ newComments: comments });
        }
        else if (res.status === 200) {
          const comments = { ...newComments };
          comments[photoId] = "";
          this.setState({ newComments: comments });
          this.setState({ id: this.props.match.params.userId });
          axios.get(`/user/${this.state.id}`).then((resUser) => {
            if (resUser.status === 200) {
              this.props.setPhotos(null, resUser.data);
            }
          });
          axios.get(`/photosOfUser/${this.state.id}`).then((resPhotos) => {
            if (resPhotos.status === 200) {
              this.setState({ userPhotos: resPhotos.data });
            }
          });
        } 
      })
      .catch((error) => {
        console.error("ERROR!", error);
      });
  };

  deleteComment = (commentId) => {
    axios
      .delete(`/comments/${commentId}`)
      .then((res) => {
        if (res.status === 204) {
          this.fetchData(); 
        } else {
          console.log("Error deleting comment:", res.data);
        }
      })
      .catch((error) => {
        console.error("Error deleting comment:", error);
      });
  };
  

  formatDateTime(dateTime) {
    return new Date(dateTime).toLocaleString(undefined, this.state.options);
  }

  handleNotificationClose = () => {
    this.setState({ notification: "" }); // Clear the notification message
  };

  render() {
    const { userPhotos, users, notification, newComments } = this.state;
    const loggedInUserId = this.props.user._id;
  
    return (
      <>
        {this.props.isLoggedIn && this.state.id === loggedInUserId && (
          <div style={{ margin: "5px", display: "block" }}>
          <form onSubmit={this.handlebutton}>
                <input type="file" accept="image/*" ref={this.uploadInput} />
                <FormControlLabel
                  control={(
                    <Checkbox
                      checked={this.state.permissionsAdd}
                      onChange={this.handlepermissiontoggle}
                      color="primary"
                    />
                  )}
                  label="Add Sharing Permissions"
                />
                {this.state.permissionsAdd && (
                  <div>
                    {users.map((user) => (
                      <FormControlLabel
                        key={user._id}
                        control={(
                          <Checkbox
                            checked={this.state.selectedUsers.includes(user._id)}
                            onChange={this.handlecheckbox(user._id)}
                          />
                        )}
                        label={`${user.first_name} ${user.last_name}`}
                      />
                    ))}
                  </div>
                )}

                <Button type="submit" variant="contained" color="primary">
                  Add Photo
                </Button>
          </form>
          </div>
        )}
        {userPhotos.length === 0 && (
          <Typography variant="body1">
            {this.state.id === loggedInUserId ? "You have no photos." : "This user has no photos."}
          </Typography>
        )}
        {userPhotos.map((photo) => (
          <Box key={photo._id} display="flex" flexDirection="column" alignItems="center">
          {this.props.isLoggedIn && this.props.user._id === photo.user_id && (
              <button onClick={() => this.deletePhoto(photo._id)} style={{ marginLeft: "10px" }}>
                Delete Photo
              </button>
            )}
            <Typography variant="body1">Photo: {photo.file_name}</Typography>
            <HashLink to={`/photos/${photo._id}`} scroll={(el) => el.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
            <CardMedia
              style={{ width: "500px" }}
              component="img"
              image={`/images/${photo.file_name}`}
              alt={photo.file_name}
            />
            </HashLink>
            <Typography variant="body2">Creation Date: {this.formatDateTime(photo.date_time)}</Typography>
            <Typography variant="body2">Comments:</Typography>
            {photo.comments &&
              photo.comments.map((comment) => {
                const userComment = users.find((u) => u._id === comment.user._id);
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
                      {this.props.isLoggedIn && this.props.user._id === comment.user._id && (
                        <button onClick={() => this.deleteComment(comment._id)} style={{ marginLeft: "10px" }}>
                          Delete
                        </button>
                      )}
                    </div>
                  );
                }
                return null;
              })}
            {this.props.isLoggedIn && this.props.user._id === photo.user_id && (
              <button onClick={() => this.deletePhoto(photo._id)} style={{ marginLeft: "10px" }}>
                Delete Photo
              </button>
            )}
            <form onSubmit={(event) => { event.preventDefault(); this.handleAddComment(event, photo._id); }}>
              <MentionsInput
                value={newComments[photo._id] ?? ""}
                onChange={(e) => this.changeNewComment(photo._id, e)}
                placeholder="Type @ to mention a user"
                >
                <Mention
                    trigger="@"
                    data={users.map((user) => ({ id: user._id, display: `${user.first_name} ${user.last_name}`}))}
                />
              </MentionsInput>
              <Button type="submit" variant="contained" color="primary">
                Add Comment
              </Button>
            </form>
          </Box>
        ))}
        <Snackbar
          open={Boolean(notification)}
          autoHideDuration={4000}
          onClose={this.handleNotificationClose}
          message={notification}
        />
      </>
    );
  }
  
  
}

export default UserPhotos;
