document.addEventListener('DOMContentLoaded', async function() {
    const audioPlayer = document.getElementById('audioPlayer');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const currentSongElement = document.getElementById('currentSong');
    const searchBar = document.getElementById('searchBar');
    const searchResults = document.getElementById('searchResults');
    const playlist = document.getElementById('playlist');
    const loadingScreen = document.getElementById('loadingScreen');
    const progressBar = document.getElementById('progressBar');
    const currentTime = document.getElementById('currentTime');
    const duration = document.getElementById('duration');
    const sidebar = document.getElementById('sidebar');
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
    const usernameDisplay = document.getElementById('username');
    const profileLink = document.getElementById('profileLink');
    const profileUsername = document.getElementById('profileUsername');
    const profileEmail = document.getElementById('profileEmail');
    const profilePassword = document.getElementById('profilePassword');
    const logoutButton = document.getElementById('logoutButton');

    let currentSongIndex = 0;
    let songs = [];

    const clientId = '78e880655c314f1b80ca6d23e82d9be5';
    const clientSecret = '6ce241b5ba8d4228b80f9cdc4108ad52';

    async function getAccessToken() {
        try {
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
                },
                body: 'grant_type=client_credentials'
            });
            const data = await response.json();
            return data.access_token;
        } catch (error) {
            console.error('Error getting access token:', error);
            return null;
        }
    }

    async function fetchWebApi(endpoint, method, token, body = null) {
        try {
            const response = await fetch(`https://api.spotify.com/${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                method,
                body: body ? JSON.stringify(body) : null
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching API:', error);
            return null;
        }
    }

    async function searchSpotify(query) {
        const token = await getAccessToken();
        if (!token) return;

        const data = await fetchWebApi(`v1/search?q=${query}&type=track`, 'GET', token);
        if (!data || !data.tracks) return;

        searchResults.innerHTML = '';
        data.tracks.items.forEach(track => {
            const li = document.createElement('li');
            li.textContent = `${track.name} by ${track.artists.map(artist => artist.name).join(', ')}`;
            li.classList.add('playlist-item');
            li.addEventListener('click', () => {
                if (!songs.some(s => s.id === track.id)) {
                    addToPlaylist(track);
                }
                currentSongIndex = songs.findIndex(s => s.id === track.id);
                loadSong(currentSongIndex);
                playSpotifyTrack(track.id); 
                searchBar.value = '';
                searchResults.innerHTML = '';
            });
            searchResults.appendChild(li);
        });
    }

    function loadSong(index) {
        if (songs[index]) {
        
            audioPlayer.src = songs[index].preview_url;
            audioPlayer.load();
            updateCurrentSongDisplay();
        }
    }

    function playPause() {
        if (audioPlayer.paused) {
            audioPlayer.play();
            playPauseBtn.textContent = '⏸️';
        } else {
            audioPlayer.pause();
            playPauseBtn.textContent = '▶️';
        }
    }

    function playNext() {
        if (songs.length > 0) {
            currentSongIndex = (currentSongIndex + 1) % songs.length;
            loadSong(currentSongIndex);
            audioPlayer.play();
            playPauseBtn.textContent = '⏸️';
        }
    }

    function playPrev() {
        if (songs.length > 0) {
            currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
            loadSong(currentSongIndex);
            audioPlayer.play();
            playPauseBtn.textContent = '⏸️';
        }
    }

    function updateCurrentSongDisplay() {
        if (songs[currentSongIndex]) {
            const currentSongName = songs[currentSongIndex].name;
            currentSongElement.textContent = `Now Playing: ${currentSongName}`;
            const playlistItems = document.querySelectorAll('.playlist-item');
            playlistItems.forEach(item => item.classList.remove('playing'));
            if (playlistItems[currentSongIndex]) {
                playlistItems[currentSongIndex].classList.add('playing');
            }
        }
    }

    function addToPlaylist(song) {
        songs.push(song);
        updatePlaylist();
    }

    function updatePlaylist() {
        playlist.innerHTML = '';
        songs.forEach((song, index) => {
            const li = document.createElement('li');
            li.textContent = `${song.name} by ${song.artists.map(artist => artist.name).join(', ')}`;
            li.classList.add('playlist-item');
            li.dataset.index = index;

            const removeBtn = document.createElement('button');
            removeBtn.textContent = '❌';
            removeBtn.classList.add('btn', 'btn-danger', 'btn-sm', 'ms-2');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                songs.splice(index, 1);
                updatePlaylist();
                if (index === currentSongIndex) {
                    if (songs.length > 0) {
                        currentSongIndex = Math.min(index, songs.length - 1);
                        loadSong(currentSongIndex);
                        audioPlayer.play();
                    } else {
                        audioPlayer.pause();
                        audioPlayer.src = '';
                        currentSongElement.textContent = 'Now Playing: None';
                        playPauseBtn.textContent = '▶️';
                    }
                }
            });

            li.appendChild(removeBtn);
            li.addEventListener('click', () => {
                currentSongIndex = index;
                loadSong(currentSongIndex);
                audioPlayer.play();
                playPauseBtn.textContent = '⏸️';
            });
            playlist.appendChild(li);
        });
    }

    searchBar.addEventListener('input', () => {
        const query = searchBar.value;
        if (query) {
            searchSpotify(query);
        } else {
            searchResults.innerHTML = '';
        }
    });

    function updateProgressBar() {
        if (audioPlayer.duration) {
            progressBar.max = audioPlayer.duration;
            progressBar.value = audioPlayer.currentTime;
            currentTime.textContent = formatTime(audioPlayer.currentTime);
            duration.textContent = formatTime(audioPlayer.duration);
        }
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }

    function updateUsername() {
        const username = localStorage.getItem('username') || 'User';
        usernameDisplay.textContent = username;
        profileUsername.value = username;
    }

    function logout() {
        localStorage.removeItem('username');
        window.location.href = 'login.html';
    }

    function playSpotifyTrack(trackId) {
        const player = window.spotifyPlayer;
        if (player) {
            player.connect().then(() => {
                player.play({
                    uris: [`spotify:track:${trackId}`]
                });
            }).catch(error => {
                console.error('Error playing track:', error);
            });
        }
    }

    
    window.onSpotifyWebPlaybackSDKReady = async () => {
        const token = await getAccessToken();
        if (!token) return;

        window.spotifyPlayer = new Spotify.Player({
            name: 'Web Playback SDK Quick Start Player',
            getOAuthToken: cb => { cb(token); }
        });

      
        window.spotifyPlayer.addListener('initialization_error', ({ message }) => console.error(message));
        window.spotifyPlayer.addListener('authentication_error', ({ message }) => console.error(message));
        window.spotifyPlayer.addListener('account_error', ({ message }) => console.error(message));
        window.spotifyPlayer.addListener('playback_error', ({ message }) => console.error(message));

         
        window.spotifyPlayer.addListener('player_state_changed', state => {
            console.log(state);
        });

        
        window.spotifyPlayer.addListener('ready', ({ device_id }) => {
            console.log('Ready with Device ID', device_id);
        });

         
        window.spotifyPlayer.addListener('not_ready', ({ device_id }) => {
            console.log('Device has gone offline', device_id);
        });

        window.spotifyPlayer.connect();
    };

    playPauseBtn?.addEventListener('click', playPause);
    prevBtn?.addEventListener('click', playPrev);
    nextBtn?.addEventListener('click', playNext);

    audioPlayer?.addEventListener('timeupdate', updateProgressBar);
    audioPlayer?.addEventListener('ended', playNext);

    sidebarToggleBtn?.addEventListener('click', () => {
        sidebar.style.transform = 'translateX(0)';
    });

    sidebarCloseBtn?.addEventListener('click', () => {
        sidebar.style.transform = 'translateX(-100%)';
    });

    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }

    updatePlaylist();
    updateUsername();

    logoutButton?.addEventListener('click', logout);
});
