import os
from datetime import datetime
from functools import wraps

from flask import (
    Flask, render_template, request, redirect, url_for,
    session, flash, g
)
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import requests
from spotipy import Spotify
from spotipy.oauth2 import SpotifyClientCredentials

load_dotenv("api.env")

app = Flask(__name__, static_folder="static", template_folder="templates")
app.secret_key = os.getenv("FLASK_SECRET", "dev_secret")

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///weatherify.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)

WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")

sp_public = Spotify(auth_manager=SpotifyClientCredentials(
    client_id=SPOTIFY_CLIENT_ID,
    client_secret=SPOTIFY_CLIENT_SECRET
))

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150))
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(300), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)

class PlaylistMapping(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    weather = db.Column(db.String(64), nullable=False)
    language = db.Column(db.String(32), nullable=False)
    playlist_id = db.Column(db.String(200), nullable=False)

class SearchLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer)
    city = db.Column(db.String(200))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    weather = db.Column(db.String(200))
    playlist_id = db.Column(db.String(200))

with app.app_context():
    db.create_all()
    if not User.query.filter_by(email="admin@example.com").first():
        admin = User(
            name="Admin",
            email="admin@example.com",
            password_hash=generate_password_hash("admin123"),
            is_admin=True
        )
        db.session.add(admin)
        db.session.commit()

@app.before_request
def load_user():
    uid = session.get("user_id")
    g.user = User.query.get(uid) if uid else None

def login_required(f):
    @wraps(f)
    def wrapped(*args, **kwargs):
        if not session.get("user_id"):
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return wrapped

def admin_required(f):
    @wraps(f)
    def wrapped(*args, **kwargs):
        if not g.user or not g.user.is_admin:
            flash("Admin access required", "error")
            return redirect(url_for("index"))
        return f(*args, **kwargs)
    return wrapped

def normalize_weather(condition):
    condition = (condition or "").lower()
    if "rain" in condition:
        return "Rain"
    if "cloud" in condition:
        return "Clouds"
    if "snow" in condition:
        return "Snow"
    if "thunder" in condition:
        return "Thunderstorm"
    if "clear" in condition:
        return "Clear"
    return "Clear"

def get_playlist_for(weather, language):
    mapping = PlaylistMapping.query.filter_by(weather=weather, language=language).first()
    if mapping:
        return mapping.playlist_id

    
    fallback = {
        "Clear": {"English": "2RTmyxpcu6aOyd9AqukEYe", "Hindi": "34BxF3uTnSVeW89tswPLpV"},
        "Clouds": {"English": "2NWk4Ekf61NpAhgXWx5Koc", "Hindi": "3qQ1PC3avJttJAqlCbHimO"},
        "Rain": {"English": "5WbhszXYAvS1BC2s0LAaKm", "Hindi": "2bK0LgUFYs8pdItSUzILAa"},
        "Snow": {"English": "5LKwsGYskR7UUHwsBB1dCx", "Hindi": "1EkI0bKfR6rOXmQlaOxjw8"},
        "Thunderstorm": {"English": "7BzRcrEaDLIylIEgZGONTC", "Hindi": "4nlCJPktVI9R3VTezTOR8K"}
    }
    return fallback.get(weather, {}).get(language)


@app.route("/")
@login_required
def index():
    return render_template("index.html")


@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "GET":
        return render_template("signup.html")

    name = request.form.get("name")
    email = request.form.get("email")
    password = request.form.get("password")

    if User.query.filter_by(email=email).first():
        flash("Email already exists", "error")
        return redirect(url_for("signup"))

    user = User(
        name=name,
        email=email,
        password_hash=generate_password_hash(password)
    )
    db.session.add(user)
    db.session.commit()

    session["user_id"] = user.id
    return redirect(url_for("index"))


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        return render_template("login.html")

    email = request.form.get("email")
    password = request.form.get("password")

    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password_hash, password):
        flash("Invalid login", "error")
        return redirect(url_for("login"))

    session["user_id"] = user.id
    return redirect(url_for("index"))

@app.route("/logout")
def logout():
    session.pop("user_id", None)
    return redirect(url_for("login"))


@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if request.method == "GET":
        return render_template("admin_login.html")
    
    email = request.form.get("email")
    password = request.form.get("password")
    user = User.query.filter_by(email=email).first()
    
    if not user or not user.is_admin or not check_password_hash(user.password_hash, password):
        flash("Invalid admin credentials", "error")
        return redirect(url_for("admin_login"))
    
    session["user_id"] = user.id
    return redirect(url_for("admin"))



@app.route("/admin", methods=["GET", "POST"])
@admin_required
def admin():
    if request.method == "POST":
        weather = request.form.get("weather")
        language = request.form.get("language")
        playlist_id = request.form.get("playlist_id")

        mapping = PlaylistMapping.query.filter_by(weather=weather, language=language).first()
        if mapping:
            mapping.playlist_id = playlist_id
        else:
            db.session.add(PlaylistMapping(weather=weather, language=language, playlist_id=playlist_id))

        db.session.commit()
        flash("Mapping saved", "success")
        return redirect(url_for("admin"))

    mappings = PlaylistMapping.query.all()
    logs = SearchLog.query.order_by(SearchLog.timestamp.desc()).limit(200).all()
    users = User.query.order_by(User.id.asc()).all()

    last_activity = {
        u.id: (SearchLog.query.filter_by(user_id=u.id).order_by(SearchLog.timestamp.desc()).first().timestamp
               if SearchLog.query.filter_by(user_id=u.id).first() else None)
        for u in users
    }

    return render_template("admin.html",
                           mappings=mappings,
                           logs=logs,
                           users=users,
                           last_activity=last_activity)


@app.route("/search_city", methods=["POST"])
@login_required
def search_city():
    city = request.form.get("city")
    language = request.form.get("language", "English")

    if not city:
        flash("Enter a city name", "error")
        return redirect(url_for("index"))

    url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={WEATHER_API_KEY}&units=metric"
    r = requests.get(url)
    data = r.json()

    if data.get("cod") != 200:
        flash("City not found", "error")
        return redirect(url_for("index"))

    condition = normalize_weather(data["weather"][0]["main"])
    playlist_id = get_playlist_for(condition, language)

    
    log = SearchLog(
        user_id=session["user_id"],
        city=city,
        weather=condition,
        playlist_id=playlist_id
    )
    db.session.add(log)
    db.session.commit()

    playlist_info = None
    tracks = []

    if playlist_id:
        p = sp_public.playlist(playlist_id)
        playlist_info = {
            "id": playlist_id,
            "name": p["name"],
            "url": p["external_urls"]["spotify"],
            "image": p["images"][0]["url"] if p["images"] else None
        }

        for item in p["tracks"]["items"][:6]:
            t = item["track"]
            tracks.append({
                "name": t["name"],
                "artist": t["artists"][0]["name"],
                "image": t["album"]["images"][0]["url"]
                if t["album"]["images"] else None,
                "preview_url": t.get("preview_url")
            })

    weather_data = {
        "city": data["name"],
        "temperature": data["main"]["temp"],
        "condition": condition,
        "icon": data["weather"][0]["icon"],
    }

    return render_template("playlist.html",
                           weather_data=weather_data,
                           playlist=playlist_info,
                           tracks=tracks)

if __name__ == "__main__":
    app.run(debug=True)
