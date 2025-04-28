import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom'; // Import useParams to get URL params, Link for navigation
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import axios from 'axios';
import ColorThief from 'colorthief'; // Import ColorThief

import SongCard from '../components/SongCard'; // Adjust path

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// --- Fetch functions (can be moved later) ---
const fetchTrackDetails = async (trackId) => {
  if (!trackId) return null;
  // Call the new backend endpoint
  const { data } = await axios.get(`${API_URL}/api/track/${trackId}`); 
  console.log("Track Details fetched:", data); // Keep for debugging
  return data; 
  // console.warn("fetchTrackDetails needs backend endpoint /api/track/:id");
  // Placeholder data removed
};

const fetchRecommendations = async (trackId) => { 
  if (!trackId) return [];
  const { data } = await axios.get(`${API_URL}/api/recommend`, { 
    params: { trackId: trackId, limit: 8 } 
  });
  console.log("Recommendations:", data); // Keep for debugging
  return data;
};

// --- Animation variants (can be moved later) ---
const cardVariants = { 
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
};

function TrackDetailPage() {
  const { trackId } = useParams(); // Get trackId from URL parameter
  const [bgColor, setBgColor] = useState('#1f2937'); // Default dark bg
  const imgRef = useRef(null); // Ref for the image element used by ColorThief

  // Query for the main track details
  const {
    data: trackDetails,
    isLoading: detailsIsLoading,
    isError: detailsIsError,
    error: detailsError
  } = useQuery({
    queryKey: ['trackDetails', trackId],
    queryFn: () => fetchTrackDetails(trackId),
    enabled: !!trackId,
    staleTime: Infinity, // Track details unlikely to change often
    gcTime: 1000 * 60 * 60, // Cache for an hour
    refetchOnWindowFocus: false,
  });

  // Query for recommendations (Artist Top Tracks)
  const {
    data: recommendations, 
    isLoading: recIsLoading, 
    isError: recIsError, 
    error: recError
  } = useQuery({
    queryKey: ['recommendations', trackId], 
    queryFn: () => fetchRecommendations(trackId), 
    enabled: !!trackId, 
    staleTime: 1000 * 60 * 15, 
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  // Effect to extract color when image is loaded
  const handleImageLoad = () => {
    if (imgRef.current && imgRef.current.complete) {
      try {
        const colorThief = new ColorThief();
        const result = colorThief.getColor(imgRef.current);
        const rgbColor = `rgb(${result[0]}, ${result[1]}, ${result[2]})`;
        // Create a radial gradient: extracted color -> default dark bg
        setBgColor(`radial-gradient(circle at top, ${rgbColor} 0%, #1f2937 80%)`); 
      } catch (error) {
        console.error('Error extracting color:', error);
        setBgColor('#1f2937'); // Fallback to default dark on error
      }
    }
  };

  // --- Render Logic ---
  if (detailsIsLoading) {
    return <div className="text-center py-10">Loading track details...</div>;
  }

  if (detailsIsError) {
    return <div className="text-center py-10 text-red-600">Error loading track details: {detailsError.message}</div>;
  }

  if (!trackDetails) {
    return <div className="text-center py-10">Track not found.</div>;
  }

  // Helper function to format duration
  const formatDuration = (ms) => {
      const minutes = Math.floor(ms / 60000);
      const seconds = ((ms % 60000) / 1000).toFixed(0);
      return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
  };

  return (
    // Apply dynamic background style
    <div 
       className="container mx-auto px-4 py-12 transition-all duration-1000 ease-in-out"
       style={{ background: bgColor }} 
    >
      {/* Hidden image for ColorThief - crucial: must have crossorigin="anonymous" */}
      {trackDetails.imageUrl && (
          <img 
             ref={imgRef} 
             src={trackDetails.imageUrl} 
             onLoad={handleImageLoad} 
             crossOrigin="anonymous" 
             style={{ display: 'none' }} 
             alt="Album art for color extraction" 
           />
      )}

       {/* Back Link */}
        <Link to="/" className="text-blue-400 hover:text-blue-300 hover:underline mb-6 inline-block transition-colors">
            &larr; Back to Search
        </Link>
        
      {/* Main Track Info Section - Adjust text colors for dynamic background */}
      <motion.div 
         className="flex flex-col md:flex-row items-center md:items-start mb-12 bg-slate-800 bg-opacity-70 backdrop-blur-sm p-6 rounded-lg shadow-xl" // Adjusted bg for contrast
         layoutId={`track-card-${trackId}`}
       >
        <img 
          src={trackDetails.imageUrl} 
          alt={`${trackDetails.name} album art`}
          className="w-48 h-48 md:w-64 md:h-64 object-cover rounded-md shadow-lg mb-6 md:mb-0 md:mr-8 flex-shrink-0"
        />
        {/* Ensure text inside has good contrast */}
        <div className="text-center md:text-left text-slate-100"> 
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{trackDetails.name}</h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-4">
            by {trackDetails.artists?.join(', ') || 'Unknown Artist'}
          </p>
          <p className="text-md text-slate-400 mb-1">Album: {trackDetails.album}</p>
          <p className="text-md text-slate-400 mb-1">Released: {trackDetails.release_date}</p>
          <p className="text-md text-slate-400 mb-3">Duration: {formatDuration(trackDetails.duration_ms)}</p>
          {/* Add more details as needed, e.g., link to Spotify */}
          {trackDetails.external_urls?.spotify && (
              <a 
                 href={trackDetails.external_urls.spotify}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="mt-4 inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition duration-200 text-sm font-medium"
               >
                  Listen on Spotify
              </a>
          )}
        </div>
      </motion.div>

      {/* Recommendations Section - Adjust text colors */}
      <div className="mt-16">
        <h2 className="text-2xl font-semibold text-white mb-6">
           More by {trackDetails.artists?.[0] || 'this artist'}
        </h2>
        {recIsLoading && <p className="text-slate-400">Loading related tracks...</p>}
        {recIsError && <p className="text-red-400">Error loading related tracks: {recError.message}</p>}
        {!recIsLoading && !recIsError && recommendations?.length === 0 && (
            <p className="text-slate-400">No other tracks found for this artist.</p>
        )}
        {recommendations && recommendations.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {recommendations.map((recTrack) => (
                    <Link key={recTrack.id} to={`/track/${recTrack.id}`} className="no-underline">
                       <motion.div variants={cardVariants} initial="hidden" animate="visible">
                           {/* SongCard needs styling update too if bg changes */}
                           <SongCard 
                               track={recTrack} 
                           />
                       </motion.div>
                    </Link>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}

export default TrackDetailPage; 