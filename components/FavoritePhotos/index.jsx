import React, { Component } from 'react';
import axios from 'axios';

class Favorites extends Component {
  constructor(props) {
    super(props);
    this.state = {
      favorites: []
    };
  }

  componentDidMount() {
    this.fetchFavorites();
  }

  fetchFavorites = async () => {
    try {
      const response = await axios.get('/api/favorites');
      this.setState({ favorites: response.data });
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  removeFavorite = async (photoId) => {
    try {
      await axios.delete(`/api/favorites/${photoId}`);
      this.setState((prevState) => ({
        favorites: prevState.favorites.filter((photo) => photo.id !== photoId)
      }));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  render() {
    const { favorites } = this.state;

    return (
      <div className="favorites">
        <h2>Favorite Photos</h2>
        {favorites.map((photo) => (
          <div className="favorite-photo" key={photo.id}>
            <img src={photo.thumbnailUrl} alt={photo.title} />
            <button onClick={() => this.removeFavorite(photo.id)}>Remove</button>
          </div>
        ))}
      </div>
    );
  }
}

export default Favorites;
