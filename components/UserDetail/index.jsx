import React, { Component } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, Typography, Button } from "@mui/material";
import { styled } from "@mui/system";
import { HashLink } from 'react-router-hash-link';

import axios from "axios";
import "./styles.css";

const StyledTypography = styled(Typography)`
  font-weight: bold;
`;

const CenteredContainer = styled("div")`
  display: flex;
  justify-content: center;
  border-background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  padding: 8px;
`;

class UserDetail extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: {},
      id: this.props.match.params.userId,
      mentionedPhotos: []
    };
  }

  componentDidMount() {
    this.fetchUserData(this.state.id);
    this.fetchMentionedImages(this.state.id);
  }

  componentDidUpdate(prevProps) {
    try {
      const { userId } = this.props.match.params;
      if (userId !== prevProps.match.params.userId) {
        this.setState({ id: this.props.match.params.userId });
        axios.get(`/user/${this.props.match.params.userId}`).then((res) => {
          if (res.status === 200) {
            this.setState({ user: res.data });
            this.props.setDetails(null, this.state.user);
          }
        });
      }
    } catch (err) {
      console.error("Error attempting to fetch user data:", err);
    }
  }
  fetchMentionedImages(userId) {
    const url = `/mentionedPhotos/${userId}`;
    axios
      .get(url)
      .then((response) => {
        const mentionedPhotos = response.data;
        const photoPromises = mentionedPhotos.map(async (photo) => {
          const userResponse = await axios.get(`/user/${photo.user_id}`);
          const user = userResponse.data;
          return {
            ...photo,
            user: {
              _id: user._id,
              first_name: user.first_name,
              last_name: user.last_name,
            },
          };
        });
  
        Promise.all(photoPromises)
          .then((photosWithUsernames) => {
            this.setState({ mentionedPhotos: photosWithUsernames });
          })
          .catch((error) => console.error(error));
      })
      .catch((error) => console.error(error));
  }

  fetchUserData = async (userId) => {
    try {
      this.setState({ id: userId });
      axios.get(`/user/${this.state.id}`).then((res) => {
        if (res.status === 200) {
          this.setState({ user: res.data });
          this.props.setDetails(null, this.state.user);
        }
      });
    } catch (err) {
      console.error("Error attempting to fetch user data:", err);
    }
  };

  render() {
    const { user, mentionedPhotos } = this.state;
    const { first_name, last_name, description, location, _id, date_time } = user;

    return (
      <div>
        <Card variant="outlined">
          <CardContent>
            <StyledTypography align="center" variant="h5" component="div">
              User Details
            </StyledTypography>
            <Typography align="center" variant="body1">
              Name: {first_name} {last_name}
            </Typography>
            <Typography align="center" variant="body1">
              Description: {description}
            </Typography>
            <Typography align="center" variant="body1">
              Location: {location}
            </Typography>
          </CardContent>
        </Card>
        <CenteredContainer>
          <Button
            variant="contained"
            component={Link}
            to={`/photos/${_id}`}
            onClick={(e) => this.props.setPhotos(e, user)}
            key={date_time}
          >
            View Photos
          </Button>
          {mentionedPhotos.length > 0 && (
              <div>
                <Typography variant="h6">Photos You Are Mentioned In:</Typography>
                <div>
                  {mentionedPhotos.map((photo) => (
                    <div key={photo._id}>
                      <HashLink to={`/photos/${photo.user_id}#/${photo._id}`}>
                        <img
                          src={`images/${photo.file_name}`}
                          alt={photo.file_name}
                          width={100}
                          height={100}
                        />
                      </HashLink>
                      <HashLink to={`/users/${photo.user_id}`}>
                        {photo.user.first_name} {photo.user.last_name}
                      </HashLink>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </CenteredContainer>
      </div>
    );
  }
}

export default UserDetail;
