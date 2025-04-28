import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom'; // Import Link for navigation
import axios from 'axios';

import SearchBar from '../components/SearchBar'; // Adjust path
import SongCard from '../components/SongCard';   // Adjust path
import SkeletonCard from '../components/SkeletonCard'; // Import SkeletonCard

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// --- Animation variants (can be moved to a shared file later) ---
const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05, 
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: 'spring', stiffness: 100 } 
  },
};

// --- Fetch functions (can be moved to a shared api.js file later) ---
const fetchSearchResults = async (query) => {
  if (!query) return [];
  const { data } = await axios.get(`${API_URL}/api/search`, {
    params: { q: query, limit: 18 } // Increase limit slightly for homepage
  });
  console.log("Search results:", data); // Keep for debugging
  return data;
};


function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Query for search results
  const {
    data: searchResults,
    error: searchError,
    isError: searchIsError,
    isFetching: searchIsFetching
  } = useQuery({
    queryKey: ['searchTracks', searchQuery],
    queryFn: () => fetchSearchResults(searchQuery),
    enabled: !!searchQuery,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
    networkMode: 'always',
  });

  // Event handler for search submission
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  // NOTE: We removed the selectedTrack state and recommendation logic.
  // handleSelectTrack is no longer needed here as navigation is done via Link.

  return (
    <>
      <header className="py-8 md:py-12">
         <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-8">
               Music Explorer
            </h1>
            {/* Pass handleSearch and loading state to SearchBar */}
            <SearchBar onSearch={handleSearch} isLoading={searchIsFetching} />
         </div>
      </header>

      <main className="pb-16">
         <div className="max-w-6xl mx-auto px-4">
            {/* Search Results Area */}
            <div className="mb-12">
               {/* Loading state */}
               {searchIsFetching && (
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                      {/* Render 12 skeleton cards while loading */}
                      {Array.from({ length: 12 }).map((_, index) => (
                         <SkeletonCard key={index} />
                      ))}
                   </div>
               )}

               {/* Error state */}
               {searchIsError && <p className="text-center text-red-600 py-4">Search Error: {searchError.message}</p>}

               {/* No results found */}
               {!searchIsFetching && !searchIsError && searchResults?.length === 0 && searchQuery && (
                  <p className="text-center text-gray-500 py-4">No results found for "{searchQuery}".</p>
               )}

               {/* Display Results */}
               {!searchIsFetching && searchResults && searchResults.length > 0 && (
                  <motion.div
                     className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6"
                     variants={gridVariants}
                     initial="hidden"
                     animate="visible"
                  >
                     {searchResults.map((track) => (
                        // Wrap SongCard with Link to navigate on click
                        <Link key={track.id} to={`/track/${track.id}`} className="no-underline">
                           <motion.div variants={cardVariants} layoutId={`track-card-${track.id}`}>
                              <SongCard
                                 track={track}
                                 // onSelect is no longer needed here
                              />
                           </motion.div>
                        </Link>
                     ))}
                  </motion.div>
               )}
            </div>
            {/* Removed "More by..." section - it moves to TrackDetailPage */}
         </div>
      </main>
    </>
  );
}

export default HomePage; 