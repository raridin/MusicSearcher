import React, { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import './App.css'; // Keep default App.css for now
import SearchBar from './components/SearchBar';
import SongCard from './components/SongCard';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Fetch function for search results
const fetchSearchResults = async (query) => {
  if (!query) return [];
  const { data } = await axios.get(`${API_URL}/api/search`, {
    params: { q: query, limit: 12 }
  });
  return data;
};

// Fetch function for recommendations
const fetchRecommendations = async (trackId) => {
  if (!trackId) return [];
  const { data } = await axios.get(`${API_URL}/api/recommend`, {
    params: { trackId: trackId, limit: 8 } // Fetch 8 recommendations
  });
  return data;
};

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState(null);
  
  // State for audio playback
  const [playingPreviewUrl, setPlayingPreviewUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null); // Ref to control the audio element

  // Query for search results
  const {
    data: searchResults,
    error: searchError,
    // isLoading: searchIsLoading, // We use isFetching for loading states generally
    isError: searchIsError,
    isFetching: searchIsFetching
  } = useQuery({
    queryKey: ['searchTracks', searchQuery],
    queryFn: () => fetchSearchResults(searchQuery),
    enabled: !!searchQuery,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
    networkMode: 'always', // Attempt fetch even if offline (to get network error)
  });

  // Query for recommendations, enabled only when a track is selected
  const {
      data: recommendations,
      error: recError,
      // isLoading: recIsLoading,
      isError: recIsError,
      isFetching: recIsFetching
  } = useQuery({
      queryKey: ['recommendations', selectedTrack?.id], // Depends on selectedTrack.id
      queryFn: () => fetchRecommendations(selectedTrack?.id),
      enabled: !!selectedTrack?.id, // Only run if selectedTrack and its id exist
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 15,
      refetchOnWindowFocus: false,
      networkMode: 'always', // Attempt fetch even if offline (to get network error)
  });

  // --- Audio Playback Logic ---
  useEffect(() => {
    // Pause audio when component unmounts or playingPreviewUrl changes
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying && playingPreviewUrl) {
        audioRef.current.src = playingPreviewUrl;
        audioRef.current.play().catch(err => {
             console.error("Audio play failed:", err); 
             setIsPlaying(false); // Reset state if play fails
             setPlayingPreviewUrl(null);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, playingPreviewUrl]);

  const togglePlay = useCallback((previewUrl) => {
    if (!previewUrl) return; // Do nothing if no preview URL

    if (playingPreviewUrl === previewUrl) {
      // If the same track is clicked, toggle play/pause
      setIsPlaying(!isPlaying);
    } else {
      // If a new track is clicked, stop the old one and play the new one
      setPlayingPreviewUrl(previewUrl);
      setIsPlaying(true);
    }
  }, [isPlaying, playingPreviewUrl]);

  const handleAudioEnded = useCallback(() => {
    setIsPlaying(false);
    setPlayingPreviewUrl(null);
  }, []);

  // --- Event Handlers ---
  const handleSearch = (query) => {
    setSearchQuery(query);
    setSelectedTrack(null);
    setPlayingPreviewUrl(null); // Stop audio on new search
    setIsPlaying(false);
  };

  const handleSelectTrack = (track) => {
    console.log("Selected Track for recommendation:", track);
    // Stop any currently playing preview before selecting a new track for recommendations
    if (isPlaying) {
        setIsPlaying(false);
        setPlayingPreviewUrl(null);
    }
    setSelectedTrack(track);
  };

  // Select handler specifically for recommended tracks (doesn't trigger new recommendations)
  const handleSelectRecommendedTrack = (track) => {
     console.log("Selected Recommended Track:", track);
     // For now, clicking a recommended track only allows preview playback
     // It doesn't re-trigger recommendations based on the recommended track
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
       {/* Hidden audio element for playback */}
       <audio ref={audioRef} onEnded={handleAudioEnded} />
       
      <header className="py-8 md:py-12">
         <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-8">
               Music Recommender
            </h1>
            <SearchBar onSearch={handleSearch} isLoading={searchIsFetching} />
         </div>
      </header>

      <main className="pb-16">
         <div className="max-w-6xl mx-auto px-4">
            {/* Search Area */} 
            <div className="mb-12">
               {searchIsFetching && !searchResults && <p className="text-center text-gray-500 py-4">Searching...</p>} {/* Show loading only on initial fetch */} 
               {searchIsError && <p className="text-center text-red-600 py-4">Search Error: {searchError.message}</p>}
               {!searchIsFetching && !searchIsError && searchResults?.length === 0 && searchQuery && (
                  <p className="text-center text-gray-500 py-4">No results found for "{searchQuery}".</p>
               )}
               {/* Only render grid if there are results */} 
               {searchResults && searchResults.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                     {searchResults.map((track) => (
                        <SongCard 
                           key={track.id} 
                           track={track} 
                           onSelect={handleSelectTrack} 
                           isPlaying={isPlaying && playingPreviewUrl === track.previewUrl}
                           onPlayPreview={() => togglePlay(track.previewUrl)}
                        />
                     ))}
                  </div>
               )}
            </div>

            {/* Recommendations Area */} 
            {selectedTrack && (
               <div className="mt-12 pt-8 border-t border-gray-200">
                  <h2 className="text-2xl md:text-3xl font-semibold text-center text-gray-800 mb-8">
                     Recommendations based on <span className="font-bold">{selectedTrack.name}</span>
                  </h2>
                  {recIsFetching && !recommendations && <p className="text-center text-gray-500 py-4">Fetching recommendations...</p>} {/* Show loading only on initial fetch */} 
                  {recIsError && <p className="text-center text-red-600 py-4">Recommendation Error: {recError.message}</p>}
                  {!recIsFetching && !recIsError && recommendations?.length === 0 && (
                      <p className="text-center text-gray-500 py-4">Could not find recommendations for this track.</p>
                  )}
                  {/* Only render grid if there are results */} 
                  {recommendations && recommendations.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                        {recommendations.map((track) => (
                            <SongCard 
                                key={track.id} 
                                track={track} 
                                onSelect={handleSelectRecommendedTrack} // Use different handler
                                isPlaying={isPlaying && playingPreviewUrl === track.previewUrl}
                                onPlayPreview={() => togglePlay(track.previewUrl)}
                            />
                        ))}
                      </div>
                  )}
               </div>
            )}
         </div>
      </main>
    </div>
  );
}

export default App; 