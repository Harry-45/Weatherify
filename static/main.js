// small helper
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// geolocation -> call /location_weather
const useBtn = $("#useLocation");
if (useBtn) {
  useBtn.addEventListener("click", () => {
    if (!navigator.geolocation) { alert("Geolocation not supported."); return; }
    useBtn.textContent = "Detecting…";
    navigator.geolocation.getCurrentPosition(async pos => {
      const lat = pos.coords.latitude, lon = pos.coords.longitude;
      const res = await fetch("/location_weather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lon, language: "English" })
      });
      useBtn.textContent = " Use My Current Location";
      if (!res.ok) { alert("Could not fetch weather"); return; }
      const j = await res.json();
      // render client-side: go to playlist page by creating a small dynamic block
      const cont = document.querySelector(".container");
      // remove existing weather/playlist sections if any
      const existingWeather = document.querySelector(".weather-box");
      if (existingWeather) existingWeather.remove();
      const existingPlaylist = document.querySelector(".playlist-section");
      if (existingPlaylist) existingPlaylist.remove();

      // create weather box
      const wb = document.createElement("div");
      wb.className = "weather-box";
      wb.innerHTML = `<h2>Weather in ${j.weather.city}</h2>
        <p class="temp">Temperature: ${j.weather.temperature}°C</p>
        <img src="http://openweathermap.org/img/wn/${j.weather.icon}@2x.png" class="weather-icon">
        <p class="condition">Condition: ${j.weather.condition}</p>
        <p class="vibe">${j.weather.vibe}</p>`;
      cont.appendChild(wb);

      if (j.playlist) {
        const ps = document.createElement("div");
        ps.className = "playlist-section";
        ps.innerHTML = `<img src="${j.playlist.image}" class="playlist-cover"><h3><a href="${j.playlist.url}" target="_blank">${j.playlist.name}</a></h3><p class="desc">${j.playlist.description || ""}</p>`;
        const tl = document.createElement("div");
        tl.className = "track-list";
        (j.tracks || []).forEach(t => {
          const node = document.createElement("div");
          node.className = "track-card";
          node.innerHTML = `${t.image ? `<img src="${t.image}" class="track-cover">` : ''}<div class="track-info"><p class="track-name">${t.name}</p><p class="track-artist">${t.artist}</p>${t.preview_url ? `<audio controls preload="none"><source src="${t.preview_url}" type="audio/mpeg"></audio>` : `<p class="no-preview">No preview</p>`}</div>`;
          tl.appendChild(node);
        });
        ps.appendChild(tl);
        cont.appendChild(ps);
      }
    }, err => {
      useBtn.textContent = "📍 Use My Current Location";
      alert("Allow location access or try entering city manually.");
    });
  });
}

// Note: login/signup handlers moved to script.js (auth slide & AJAX). Keeping main.js focused on geolocation and rendering.
