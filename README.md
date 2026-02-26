# Weatherify 🌦️🎵

Weatherify is a Flask-based web application that connects your current weather conditions with the perfect Spotify playlist. Whether it's a sunny day vibes or cozy cloudy beats, Weatherify ensures your music matches the mood of the sky.

## 🚀 Features

- **Weather-Sync**: Automatically fetches real-time weather data for any city using the OpenWeatherMap API.
- **Smart Recommendations**: Maps weather conditions (Clear, Clouds, Rain, Snow, Thunderstorm) to curated Spotify playlists.
- **Bilingual Interface**: Support for both **English** and **Hindi** language preferences.
- **User Authentication**: Secure sign-up and login system for personalized search history.
- **Admin Dashboard**: A comprehensive management panel to:
  - Update weather-to-playlist mappings.
  - View real-time search logs and user activity.
  - Manage application users.
- **Premium UI**: Modern, responsive design with dynamic vibes (Sunny, Rainy, Snowy, etc.).

## 🛠️ Tech Stack

- **Backend**: Python, Flask
- **Database**: SQLAlchemy (SQLite)
- **APIs**: [OpenWeatherMap API](https://openweathermap.org/api), [Spotify Web API](https://developer.spotify.com/documentation/web-api)
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Authentication**: Werkzeug (Password Hashing), Flask Sessions

## 📋 Prerequisites

Before you begin, ensure you have the following:
- Python 3.8+
- A Spotify Developer account (to get `CLIENT_ID` and `CLIENT_SECRET`)
- An OpenWeatherMap API key

## ⚙️ Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd Whather
   ```

2. **Set up a Virtual Environment**:
   ```bash
   python -m venv .venv
   # Windows
   .venv\Scripts\activate
   # macOS/Linux
   source .venv/bin/activate
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Configuration**:
   Create an `api.env` file in the root directory (using `api.env.example` as a template):
   ```env
   WEATHER_API_KEY=your_openweathermap_api_key
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   FLASK_SECRET=your_secret_key
   ```

5. **Initialize Database**:
   The database is automatically created on the first run of the application.

## 🏃 Running the Application

Start the Flask development server:
```bash
python app.py
```
Open your browser and navigate to `http://127.0.0.1:5000`.

---
*Created with ❤️ for music and weather lovers.*
