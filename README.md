# Music Recommendation MVP

A simple single-page web application that provides music recommendations based on a selected song, using the Spotify API.

## Features

*   Search for songs using the Spotify API.
*   View search results including title, artist, and album art.
*   Select a song to get recommendations.
*   View recommended tracks based on the selected song's audio features (tempo, key) and artist/genre similarity.
*   Play 30-second previews of tracks (click album art).
*   (Planned) Backend caching for frequent searches.
*   (Planned) Recommendation explanations.

## Tech Stack

*   **Frontend:** React.js (Create React App), Tailwind CSS, React Query, Axios
*   **Backend:** Node.js, Express.js, Axios, Dotenv
*   **API:** Spotify Web API
*   **Deployment:** Configured for Vercel (vercel.json needed)

## Project Structure

```
MusicRecMVP/
├── client/         # React frontend application (CRA)
│   ├── public/
│   ├── src/
│   │   ├── components/ # React components (SearchBar, SongCard)
│   │   ├── App.js      # Main application component
│   │   ├── index.js    # Entry point, React Query setup
│   │   └── ...
│   ├── package.json
│   └── ...
├── server/         # Node.js backend server
│   ├── node_modules/
│   ├── index.js    # Express server setup, API endpoints
│   ├── package.json
│   ├── .env        # Local environment variables (Needs to be created by user)
│   └── .env.example # Example environment variables
├── .gitignore      # Git ignore rules
└── README.md       # This file
```

## Prerequisites

*   Node.js (v18 or later recommended)
*   npm (usually comes with Node.js) or yarn
*   A Spotify Developer account and API credentials (Client ID, Client Secret)
    *   Register an application at [https://developer.spotify.com/dashboard/](https://developer.spotify.com/dashboard/)
    *   Add `http://127.0.0.1:3000` to the Redirect URIs in your Spotify app settings.

## Setup Instructions

1.  **Clone the repository (if applicable):**
    ```bash
    git clone <repository-url>
    cd MusicRecMVP
    ```

2.  **Install Backend Dependencies:**
    ```bash
    cd server
    npm install
    cd ..
    ```

3.  **Install Frontend Dependencies:**
    ```bash
    cd client
    npm install
    cd .. 
    ```

4.  **Configure Backend Environment Variables:**
    *   Navigate to the `server` directory.
    *   Create a file named `.env` (you can copy `.env.example`).
    *   Open `server/.env` and add your Spotify Client ID and Client Secret:
        ```env
        SPOTIFY_CLIENT_ID=YOUR_ACTUAL_SPOTIFY_CLIENT_ID
        SPOTIFY_CLIENT_SECRET=YOUR_ACTUAL_SPOTIFY_CLIENT_SECRET
        # PORT=3001 # Optional
        ```

## Running the Application

1.  **Start the Backend Server:**
    *   Open a terminal in the `server` directory.
    *   Run the server: `node index.js` (or add a `start` script to `server/package.json` and use `npm start`)
    *   The server should start on `http://localhost:3001`.

2.  **Start the Frontend Development Server:**
    *   Open *another* terminal in the `client` directory.
    *   Run the React development server: `npm start`
    *   This will open the application in your browser at `http://127.0.0.1:3000`.

## Next Steps / TODOs

*   Add explanations for recommendations.
*   Implement backend caching.
*   Add `vercel.json` for deployment configuration.
*   Add tests.
*   Further UI/UX improvements. 