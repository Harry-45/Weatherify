// DOM helpers
const $ = q => document.querySelector(q);
const $$ = q => document.querySelectorAll(q);

// Open / Close playlist modal
function openModal(id) {
  document.getElementById(id).style.display = "flex";
}
function closeModal(id) {
  document.getElementById(id).style.display = "none";
}

// Playlist modal close button
$("#closePlaylist")?.addEventListener("click", () => closeModal("playlistModal"));

// Handle "Use My Current Location"
$("#useLocation")?.addEventListener("click", async () => {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported on this browser.");
    return;
  }

  $("#useLocation").textContent = "Detecting...";
  navigator.geolocation.getCurrentPosition(
    async pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const lang = $("#language")?.value || "English";

      try {
        const res = await fetch("/location_weather", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lon, language: lang })
        });

        $("#useLocation").textContent = " Use My Current Location";

        if (!res.ok) {
          alert("Unable to fetch weather data");
          return;
        }

        const j = await res.json();
        showWeatherAndPlaylist(j.weather, j.playlist, j.tracks);
      } catch (e) {
        console.error(e);
        alert("Error fetching location data.");
        $("#useLocation").textContent = "📍 Use My Current Location";
      }
    },
    err => {
      $("#useLocation").textContent = "Use My Current Location";
      alert("Please allow location access.");
    }
  );
});

// Render weather & playlist dynamically on the index page
function showWeatherAndPlaylist(weather, playlist, tracks) {
  // Update weather display
  let weatherBox = document.querySelector(".weather-box");
  if (!weatherBox) {
    weatherBox = document.createElement("div");
    weatherBox.className = "weather-box";
    document.querySelector("main")?.appendChild(weatherBox);
  }

  weatherBox.innerHTML = `
    <h2>${weather.city}</h2>
    <p class="temp">${weather.temperature}°C — ${weather.condition}</p>
    <img src="http://openweathermap.org/img/wn/${weather.icon}@2x.png" class="weather-icon">
    <p class="vibe">${weather.vibe}</p>
  `;

  // Playlist section
  if (playlist) {
    let ps = document.querySelector(".playlist-section");
    if (!ps) {
      ps = document.createElement("div");
      ps.className = "playlist-section";
      document.querySelector("main")?.appendChild(ps);
    }

    ps.innerHTML = `
      <h3>Your Weatherify Playlist 🎧</h3>
      <img src="${playlist.image}" class="playlist-cover">
      <h4><a href="${playlist.url}" target="_blank">${playlist.name}</a></h4>
      <p class="desc">${playlist.description || ""}</p>
      <div class="track-list"></div>
    `;

    const trackList = ps.querySelector(".track-list");
    trackList.innerHTML = "";

    if (tracks && tracks.length) {
      tracks.forEach(t => {
        const node = document.createElement("div");
        node.className = "track-card";
        node.innerHTML = `
          ${t.image ? `<img src="${t.image}" class="track-cover">` : ""}
          <div class="track-info">
            <p class="track-name">${t.name}</p>
            <p class="track-artist">${t.artist}</p>
            ${t.preview_url
            ? `<audio controls preload="none"><source src="${t.preview_url}" type="audio/mpeg"></audio>`
            : `<p class="no-preview">No preview available</p>`
          }
          </div>
        `;
        trackList.appendChild(node);
      });
    }

    // Add "View Playlist" modal button if not already present
    if (!document.getElementById("openPlaylistBtn")) {
      const btn = document.createElement("button");
      btn.textContent = "🎵 View Full Playlist";
      btn.id = "openPlaylistBtn";
      btn.className = "small-btn";
      btn.onclick = () => openModal("playlistModal");
      document.querySelector("main")?.appendChild(btn);
    }

    // Fill modal with details
    $("#modalPlaylistName").textContent = playlist.name || "";
    $("#modalPlaylistDesc").textContent = playlist.description || "";
    $("#modalPlaylistCover").src = playlist.image || "";
    $("#modalPlaylistLink").href = playlist.url || "#";
  } else {
    alert("No playlist found for this weather type.");
  }
}

// Close modals if clicked outside
window.addEventListener("click", e => {
  if (e.target.classList.contains("modal")) {
    e.target.style.display = "none";
  }
});

// ===== AUTH SLIDE & AJAX LOGIN/SIGNUP =====
document.addEventListener("DOMContentLoaded", () => {
  const authWrapper = document.getElementById("authWrapper");

  // If URL hash is #signup, show signup panel
  if (location.hash === "#signup" && authWrapper) {
    authWrapper.classList.add("show-signup");
  }

  // Toggle links
  document.querySelectorAll('.toggle-to-signup').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      authWrapper.classList.add('show-signup');
      history.replaceState(null, '', '#signup');
    });
  });
  document.querySelectorAll('.toggle-to-login').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      authWrapper.classList.remove('show-signup');
      history.replaceState(null, '', '#login');
    });
  });

  // AJAX login
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      try {
        const res = await fetch('/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const j = await res.json();
        if (!res.ok) {
          alert(j.error || 'Login failed');
          return;
        }
        // success -> redirect home
        window.location.href = '/';
      } catch (err) {
        console.error(err);
        alert('Login error');
      }
    });
  }

  // AJAX signup
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async e => {
      e.preventDefault();
      const name = document.getElementById('signupName').value.trim();
      const email = document.getElementById('signupEmail').value.trim();
      const password = document.getElementById('signupPassword').value;
      try {
        const res = await fetch('/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
        const j = await res.json();
        if (!res.ok) {
          alert(j.error || 'Signup failed');
          return;
        }
        // success -> redirect home
        window.location.href = '/';
      } catch (err) {
        console.error(err);
        alert('Signup error');
      }
    });
  }

  // ===== ADMIN ACTIONS (delete user / mapping) =====
  document.querySelectorAll('.admin-delete-user').forEach(btn => {
    btn.addEventListener('click', async e => {
      const id = btn.dataset.id;
      if (!confirm('Delete user ID ' + id + '? This cannot be undone.')) return;
      try {
        const res = await fetch('/admin/delete_user/' + id, { method: 'POST' });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          alert(j.error || 'Failed to delete user');
          return;
        }
        location.reload();
      } catch (err) { console.error(err); alert('Error deleting user'); }
    });
  });

  document.querySelectorAll('.admin-delete-mapping').forEach(btn => {
    btn.addEventListener('click', async e => {
      const id = btn.dataset.id;
      if (!confirm('Delete mapping ID ' + id + '?')) return;
      try {
        const res = await fetch('/admin/delete_mapping/' + id, { method: 'POST' });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          alert(j.error || 'Failed to delete mapping');
          return;
        }
        location.reload();
      } catch (err) { console.error(err); alert('Error deleting mapping'); }
    });
  });

});
