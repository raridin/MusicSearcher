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
      params: { q: query, type: 'track', limit: limit, market: 'US' }
    });
    const tracks = spotifyResponse.data.tracks.items.map(formatTrack);
    
    // ---- DEBUG LOG REMOVED ----
    // console.log('--- Formatted Search Results (checking previewUrl) ---');
    // console.log(JSON.stringify(tracks, null, 2)); 
    // ---- END DEBUG LOG ----

    res.json(tracks);
  } catch (error) {
    console.error('Spotify Search API error:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to fetch search results from Spotify';
    res.status(statusCode).json({ error: errorMessage });
  }
});

// Autocomplete Endpoint
app.get('/api/autocomplete', async (req, res) => {
  const query = req.query.q;
  const limit = parseInt(req.query.limit) || 5; // Limit to 5 suggestions
  if (!query || query.length < 2) { // Require at least 2 characters
    return res.json([]); // Return empty array if query is too short
  }

  try {
    const token = await getSpotifyToken();
    const searchUrl = `https://api.spotify.com/v1/search`;
    const spotifyResponse = await axios.get(searchUrl, {
      headers: { 'Authorization': `Bearer ${token}` },
      params: { q: query, type: 'track', limit: limit }
    });

    // Format suggestions to include name and artist
    const suggestions = spotifyResponse.data.tracks.items.map(track => ({
        id: track.id,
        name: track.name,
        artist: track.artists.map(artist => artist.name).join(', ') // Combine artists
    }));

    res.json(suggestions);
  } catch (error) {
    // Don't log errors aggressively for autocomplete, as it fires often
    // console.error('Spotify Autocomplete API error:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    // Return empty array on error to prevent breaking frontend
    res.json([]); 
  }
});

// Recommendation Endpoint (Now fetches Artist Top Tracks)
app.get('/api/recommend', async (req, res) => {
    const trackId = req.query.trackId; // ID of the track the user selected
    const limit = parseInt(req.query.limit) || 8; // Target number of tracks to return
    if (!trackId) return res.status(400).json({ error: 'Track ID is required' });

    try {
        const token = await getSpotifyToken();

        // 1. Get Track Details to find the primary artist ID
        const trackUrl = `https://api.spotify.com/v1/tracks/${trackId}`;
        const trackResponse = await axios.get(trackUrl, { headers: { 'Authorization': `Bearer ${token}` } });
        const primaryArtistId = trackResponse.data?.artists?.[0]?.id;
        
        if (!primaryArtistId) {
            console.warn(`Could not find primary artist ID for track: ${trackId}. Returning empty results.`);
            return res.json([]); // Cannot proceed without artist ID
        }

        // 2. Get Artist's Top Tracks
        const topTracksUrl = `https://api.spotify.com/v1/artists/${primaryArtistId}/top-tracks?market=US`;
        const topTracksResponse = await axios.get(topTracksUrl, {
             headers: { 'Authorization': `Bearer ${token}` } 
        });
        const artistTopTracks = topTracksResponse.data.tracks;

        if (!artistTopTracks || artistTopTracks.length === 0) {
            console.warn(`No top tracks found for artist ID: ${primaryArtistId}. Returning empty results.`);
            return res.json([]);
        }

        // 3. Format Tracks, filter out the original seed track, and limit
        const formattedTracks = artistTopTracks
            .map(formatTrack) // Use existing helper
            .filter(track => track.id !== trackId) // Ensure original track isn't shown
            .slice(0, limit); // Limit to the requested number

        res.json(formattedTracks);

    } catch (error) {
        console.error(`Error fetching top tracks for artist related to trackId ${trackId}:`, error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        const statusCode = error.response?.status || 500;
        const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to fetch artist top tracks from Spotify';
        res.status(statusCode).json({ error: errorMessage });
    }
});

// Get Single Track Details Endpoint
app.get('/api/track/:id', async (req, res) => {
    const trackId = req.params.id; // Get ID from URL path parameter
    if (!trackId) return res.status(400).json({ error: 'Track ID is required in URL path' });

    try {
        const token = await getSpotifyToken();
        const trackUrl = `https://api.spotify.com/v1/tracks/${trackId}`;
        const spotifyResponse = await axios.get(trackUrl, { 
            headers: { 'Authorization': `Bearer ${token}` },
            // Optional: Add market if needed for availability checks
            // params: { market: 'US' } 
        });
        
        const trackData = spotifyResponse.data;

        if (!trackData) {
            return res.status(404).json({ error: 'Track not found' });
        }

        // Format the response to match frontend expectation (similar to placeholder)
        const formattedTrack = {
            id: trackData.id,
            name: trackData.name,
            artists: trackData.artists.map(artist => artist.name),
            album: trackData.album.name,
            imageUrl: trackData.album.images?.length ? trackData.album.images[0].url : null,
            previewUrl: trackData.preview_url,
            duration_ms: trackData.duration_ms,
            release_date: trackData.album.release_date, // Use album's release date
            external_urls: trackData.external_urls // Include spotify URL
        };
        
        res.json(formattedTrack);

    } catch (error) {
        console.error(`Error fetching details for trackId ${trackId}:`, error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        const statusCode = error.response?.status || 500;
        const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to fetch track details from Spotify';
        // Handle specific Spotify 404
        if (statusCode === 404) {
            res.status(404).json({ error: 'Track not found on Spotify' });
        } else {
            res.status(statusCode).json({ error: errorMessage });
        }
    }
});

// --- Start Server --- 
console.log('Attempting to start server...'); // Debug log
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
}); 