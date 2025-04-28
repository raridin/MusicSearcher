import React from 'react'; // Removed useState, useCallback imports as they are no longer used here
import axios from 'axios';
// import { useQuery } from '@tanstack/react-query'; // Queries moved to pages
import { motion, AnimatePresence } from 'framer-motion'; // Import AnimatePresence
import { Routes, Route, useLocation } from 'react-router-dom'; // Import useLocation
import './App.css'; // Keep default App.css for now
// --- Import Page Components (will create these next) ---
import HomePage from './pages/HomePage'; 
import TrackDetailPage from './pages/TrackDetailPage';

// --- Remove component imports, they will live in pages ---
// import SearchBar from './components/SearchBar'; 
// import SongCard from './components/SongCard';

// --- API URL and animation variants can likely stay here or move to utils ---
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Animation variants for the grid container
const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05, // Stagger animation of children
    },
  },
};

// Animation variants for individual cards
const cardVariants = {
  hidden: { opacity: 0, y: 20 }, // Start slightly down and invisible
  visible: { 
    opacity: 1, 
    y: 0, // Animate to original position and visible
    transition: { type: 'spring', stiffness: 100 } // Optional: Add a spring effect
  },
};

// --- Fetch functions can stay here or move to an api.js file ---
// Fetch function for search results
const fetchSearchResults = async (query) => {
  if (!query) return [];
  const { data } = await axios.get(`${API_URL}/api/search`, {
    params: { q: query, limit: 12 }
  });
  return data;
};

// Fetch function for recommendations (now Artist Top Tracks)
const fetchRecommendations = async (trackId) => { // Keep function name for simplicity
  if (!trackId) return [];
  const { data } = await axios.get(`${API_URL}/api/recommend`, { // Endpoint remains /api/recommend
    params: { trackId: trackId, limit: 8 } // Fetch 8 tracks
  });
  return data;
};

// --- Add fetch function for single track details (will need backend endpoint) ---
const fetchTrackDetails = async (trackId) => {
  if (!trackId) return null;
  // Replace with actual API call once backend endpoint is created
  // const { data } = await axios.get(`${API_URL}/api/track/${trackId}`);
  // return data;
  console.warn("fetchTrackDetails needs backend endpoint /api/track/:id");
  return null; // Placeholder
};

function App() {
   const location = useLocation(); // Get location for AnimatePresence key

  return (
    // Apply a nicer background and base text color
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 text-slate-100 font-sans">
       {/* Use AnimatePresence to enable animations between routes */}
       <AnimatePresence mode="wait"> { /* mode="wait" ensures exit animation finishes first */}
           <Routes location={location} key={location.pathname}> { /* Pass location and key */}
              {/* Pass necessary props/functions down to page components */}
              <Route 
                 path="/" 
                 element={<HomePage />} // Use HomePage component
              />
              <Route 
                 path="/track/:trackId" 
                 element={<TrackDetailPage />} // Use TrackDetailPage component
              />
              {/* We might want a 404 Not Found route later */}
              {/* <Route path="*" element={<div>404 Not Found</div>} /> */}
           </Routes>
       </AnimatePresence>
    </div>
  );
}

export default App;
