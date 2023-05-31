import React, { Component } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, Typography, Button } from "@mui/material";
import { styled } from "@mui/system";
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
    };
  }

  componentDidMount() {
    this.fetchUserData(this.state.id);
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
    const { user } = this.state;
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
        </CenteredContainer>
      </div>
    );
  }
}

export default UserDetail;
