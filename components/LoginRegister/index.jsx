import React, { Component } from 'react';
import { Typography } from '@mui/material';
import axios from 'axios';

class LoginRegister extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loginName: '',
      errorMessage: '',
      password: '',
      confirmPassword: '',
      loginNameRegister: '',
      passwordRegister: '',
      firstName: '',
      lastName: '',
      location: '',
      description: '',
      occupation: '',
      registrationSuccess: false,
    };

    this.changeLoginName = this.changeLoginName.bind(this);
    this.changeConfirmPassword = this.changeConfirmPassword.bind(this);
    this.submitLogin = this.submitLogin.bind(this);
    this.changeFirstName = this.changeFirstName.bind(this);
    this.submitRegister = this.submitRegister.bind(this);
    this.changeLastName = this.changeLastName.bind(this);
    this.changeLocation = this.changeLocation.bind(this);
    this.changeDescription = this.changeDescription.bind(this);
    this.changePassword = this.changePassword.bind(this);
    this.changeOccupation = this.changeOccupation.bind(this);
    this.changeLoginNameRegister = this.changeLoginNameRegister.bind(this);
    this.changePasswordRegister = this.changePasswordRegister.bind(this);
  
  }

  changeLoginName(e) {
    this.setState({ loginName: e.target.value });
  }

  changePassword(e) {
    this.setState({ password: e.target.value });
  }

  changeConfirmPassword(e) {
    this.setState({ confirmPassword: e.target.value });
  }

  changeLoginNameRegister(e) {
    this.setState({ loginNameRegister: e.target.value });
  }

  changePasswordRegister(e) {
    this.setState({ passwordRegister: e.target.value });
  }

  changeFirstName(e) {
    this.setState({ firstName: e.target.value });
  }

  changeLastName(e) {
    this.setState({ lastName: e.target.value });
  }

  changeLocation(e) {
    this.setState({ location: e.target.value });
  }

  changeDescription(e) {
    this.setState({ description: e.target.value });
  }

  changeOccupation(e) {
    this.setState({ occupation: e.target.value });
  }

  submitRegister() {
    const {
      loginNameRegister,
      passwordRegister,
      confirmPassword,
      firstName,
      lastName,
      location,
      description,
      occupation,
    } = this.state;

    if (passwordRegister !== confirmPassword) {
      this.setState({
        errorMessage: 'Passwords do not match',
        passwordRegister: '',
        confirmPassword: '',
        registrationSuccess: false,
      });
      return;
    }
    if (!loginNameRegister) {
      this.setState({
        errorMessage: 'Please enter a login name',
        registrationSuccess: false,
      });
      return;
    }

    if (!passwordRegister) {
      this.setState({
        errorMessage: 'Please enter a password',
        registrationSuccess: false,
      });
      return;
    }

    if (!firstName) {
      this.setState({
        errorMessage: 'Please enter your first name',
        registrationSuccess: false,
      });
      return;
    }

    if (!lastName) {
      this.setState({
        errorMessage: 'Please enter your last name',
        registrationSuccess: false,
      });
      return;
    }

    // All required fields are filled, proceed with registration
    // Set registrationSuccess to true and perform registration logic
    this.setState({
      errorMessage: '',
      registrationSuccess: true,
    });

    axios
      .post('/user', {
        login_name: loginNameRegister,
        password: passwordRegister,
        first_name: firstName,
        last_name: lastName,
        location,
        description,
        occupation,
      })
      .then((res) => {
        if (res.status === 400) {
          if (res.data.error === 'duplicate_login_name') {
            this.setState({
              errorMessage: 'User with the same login name already exists',
              loginNameRegister: '',
              passwordRegister: '',
              confirmPassword: '',
              registrationSuccess: false,
            });
          } else {
            this.setState({
              errorMessage: 'Invalid registration attempt',
              loginNameRegister: '',
              passwordRegister: '',
              confirmPassword: '',
              registrationSuccess: false,
            });
          }
        } else if (res.status === 200) {
          this.setState({
            errorMessage: '',
            loginNameRegister: '',
            passwordRegister: '',
            confirmPassword: '',
            firstName: '',
            lastName: '',
            location: '',
            description: '',
            occupation: '',
            registrationSuccess: true,
          });
        }
      })
      .catch((error) => {
        console.error('Error occurred during registration:', error);
        this.setState({
          errorMessage: 'An error occurred during registration. Please try again.',
          loginNameRegister: '',
          passwordRegister: '',
          confirmPassword: '',
          firstName: '',
          lastName: '',
          location: '',
          description: '',
          occupation: '',
          registrationSuccess: false,
        });
      });
  }

  submitLogin() {
    axios
      .post('/admin/login', {
        login_name: this.state.loginName,
        password: this.state.password,
      })
      .then((res) => {
        if (res.status === 400) {
          this.setState({ errorMessage: 'Invalid login name or password', loginName: '', password: '' });
        } else if (res.status === 200) {
          this.props.login(null, true, res.data);
        }
      })
      .catch((error) => {
        console.error('Error occurred during login:', error);
        this.setState({
          errorMessage: 'An error occurred during login. Please try again.',
          loginName: '',
          password: '',
        });
      });
  }

  render() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ marginBottom: '16px' }}>
          <Typography variant="h4" component="div">
            Login
          </Typography>
          <Typography variant="body1">{this.state.errorMessage}</Typography>
          <form style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="body1">
              Login name: <input type="text" value={this.state.loginName} onChange={this.changeLoginName} required style={{ width: '200px', fontSize: '16px' }} />
            </Typography>
            <Typography variant="body1">
              Password: <input type="password" value={this.state.password} onChange={this.changePassword} required style={{ width: '200px', fontSize: '16px' }} />
            </Typography>
            <input type="submit" value="Login" onClick={this.submitLogin} style={{ marginTop: '8px', fontSize: '16px' }} />
          </form>
        </div>

        <div>
          <Typography variant="h4" component="div">
            Register
          </Typography>
          <Typography variant="body1">{this.state.errorMessage}</Typography>
          {this.state.registrationSuccess ? (
            <Typography variant="body1" style={{ color: 'green' }}>
              Registration successful. Please login with your credentials.
            </Typography>
          ) : null}
          <form style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="body1">
              Login name: <input type="text" value={this.state.loginNameRegister} onChange={this.changeLoginNameRegister} required style={{ width: '200px', fontSize: '16px' }} />
            </Typography>
            <Typography variant="body1">
              Password: <input type="password" value={this.state.passwordRegister} onChange={this.changePasswordRegister} required style={{ width: '200px', fontSize: '16px' }} />
            </Typography>
            <Typography variant="body1">
              Confirm Password: <input type="password" value={this.state.confirmPassword} onChange={this.changeConfirmPassword} required style={{ width: '200px', fontSize: '16px' }} />
            </Typography>
            <Typography variant="body1">
              First name: <input type="text" value={this.state.firstName} onChange={this.changeFirstName} required style={{ width: '200px', fontSize: '16px' }} />
            </Typography>
            <Typography variant="body1">
              Last name: <input type="text" value={this.state.lastName} onChange={this.changeLastName} required style={{ width: '200px', fontSize: '16px' }} />
            </Typography>
            <Typography variant="body1">
              Location: <input type="text" value={this.state.location} onChange={this.changeLocation} style={{ width: '200px', fontSize: '16px' }} />
            </Typography>
            <Typography variant="body1">
              Description: <input type="text" value={this.state.description} onChange={this.changeDescription} style={{ width: '200px', fontSize: '16px' }} />
            </Typography>
            <Typography variant="body1">
              Occupation: <input type="text" value={this.state.occupation} onChange={this.changeOccupation} style={{ width: '200px', fontSize: '16px' }} />
            </Typography>
            <input type="button" value="Register Me" onClick={this.submitRegister} style={{ marginTop: '8px', fontSize: '16px' }} />
          </form>
        </div>
      </div>
    );
  }
}

export default LoginRegister;
