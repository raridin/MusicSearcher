require('dotenv').config();
console.log('dotenv configured.'); // Debug log

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express(); // Initialize Express app
const port = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Allow requests from the frontend
app.use(express.json()); // Parse JSON request bodies

// Basic route
app.get('/', (req, res) => {
  res.send('Music Recommendation API is running!');
});

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// Debug logs for environment variables
console.log('SPOTIFY_CLIENT_ID loaded:', SPOTIFY_CLIENT_ID ? 'Yes' : 'No'); 
console.log('SPOTIFY_CLIENT_SECRET loaded:', SPOTIFY_CLIENT_SECRET ? 'Yes' : 'No'); 

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

// Check for credentials
if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
  console.error("Error: SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set in .env file");
  process.exit(1);
}
console.log('Environment variable check passed.'); // Debug log

// --- Spotify Auth --- 
let spotifyTokenData = {
  accessToken: null,
  expiresAt: null,
};

async function getSpotifyToken() {
  if (spotifyTokenData.accessToken && spotifyTokenData.expiresAt && Date.now() < spotifyTokenData.expiresAt - 60000) {
    // console.log("Using cached Spotify token."); // Optional: Less verbose logging
    return spotifyTokenData.accessToken;
  }
  console.log("Fetching new Spotify token...");
  try {
    const authHeader = 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
    const response = await axios.post(SPOTIFY_TOKEN_URL, 'grant_type=client_credentials', {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    const { access_token, expires_in } = response.data;
    spotifyTokenData.accessToken = access_token;
    spotifyTokenData.expiresAt = Date.now() + (expires_in * 1000);
    console.log("New Spotify token obtained.");
    return access_token;
  } catch (error) {
    console.error("Error fetching Spotify token:", error.response ? error.response.data : error.message);
    spotifyTokenData = { accessToken: null, expiresAt: null };
    throw new Error("Could not authenticate with Spotify API.");
  }
}

// --- Helper Functions --- 
const formatTrack = (item) => ({
    id: item.id,
    name: item.name,
    artists: item.artists.map(artist => artist.name),
    album: item.album.name,
    imageUrl: item.album.images?.length ? item.album.images[0].url : null,
    previewUrl: item.preview_url
});

// --- API Endpoints --- 

// Search Endpoint
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  const limit = parseInt(req.query.limit) || 10;
  if (!query) return res.status(400).json({ error: 'Search query is required' });

  try {
    const token = await getSpotifyToken();
    const searchUrl = `https://api.spotify.com/v1/search`;
    const spotifyResponse = await axios.get(searchUrl, {
      headers: { 'Authorization': `Bearer ${token}` },
      params: { q: query, type: 'track', limit: limit }
    });
    const tracks = spotifyResponse.data.tracks.items.map(formatTrack);
    res.json(tracks);
  } catch (error) {
    console.error('Spotify Search API error:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to fetch search results from Spotify';
    res.status(statusCode).json({ error: errorMessage });
  }
});

// Recommendation Endpoint
app.get('/api/recommend', async (req, res) => {
    const trackId = req.query.trackId;
    const limit = parseInt(req.query.limit) || 8;
    if (!trackId) return res.status(400).json({ error: 'Track ID is required' });

    try {
        const token = await getSpotifyToken();

        // 1. Get Track Details
        const trackUrl = `https://api.spotify.com/v1/tracks/${trackId}`;
        const trackResponse = await axios.get(trackUrl, { headers: { 'Authorization': `Bearer ${token}` } });
        const trackData = trackResponse.data;
        const primaryArtistId = trackData.artists?.[0]?.id;
        if (!primaryArtistId) throw new Error('Could not extract primary artist ID from track.');

        // 2. Get Audio Features
        const featuresUrl = `https://api.spotify.com/v1/audio-features/${trackId}`;
        const featuresResponse = await axios.get(featuresUrl, { headers: { 'Authorization': `Bearer ${token}` } });
        const audioFeatures = featuresResponse.data;
        const targetTempo = audioFeatures.tempo;
        const targetKey = audioFeatures.key;

        // 3. Get Artist Details (for Genres)
        const artistUrl = `https://api.spotify.com/v1/artists/${primaryArtistId}`;
        const artistResponse = await axios.get(artistUrl, { headers: { 'Authorization': `Bearer ${token}` } });
        const artistGenres = artistResponse.data.genres || [];

        // 4. Get Recommendations
        const recommendationsUrl = `https://api.spotify.com/v1/recommendations`;
        const seedParams = { limit: limit, seed_tracks: trackId };
        if (targetTempo) seedParams.target_tempo = targetTempo;
        if (targetKey !== undefined) seedParams.target_key = targetKey;
        let seedCount = 1;
        if (primaryArtistId && seedCount < 5) {
            seedParams.seed_artists = primaryArtistId;
            seedCount++;
        }
        const genreSeeds = artistGenres.slice(0, 5 - seedCount);
        if (genreSeeds.length > 0) seedParams.seed_genres = genreSeeds.join(',');

        const recommendationsResponse = await axios.get(recommendationsUrl, {
            headers: { 'Authorization': `Bearer ${token}` },
            params: seedParams
        });

        const recommendedTracks = recommendationsResponse.data.tracks.map(formatTrack);
        res.json(recommendedTracks);

    } catch (error) {
        console.error('Spotify Recommendation API error:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        const statusCode = error.response?.status || 500;
        const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to fetch recommendations from Spotify';
        res.status(statusCode).json({ error: errorMessage });
    }
});

// --- Start Server --- 
console.log('Attempting to start server...'); // Debug log
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
}); 