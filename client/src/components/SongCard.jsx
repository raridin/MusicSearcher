import React from 'react';
import { motion } from 'framer-motion';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid'; // Keep imports for now

// Removed local SVG definitions for PlayIcon and PauseIcon
/*
const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
  </svg>
);

const PauseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
    <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
  </svg>
);
*/

const SongCard = ({ track, onSelect }) => {
  const imageUrl = track.imageUrl || 'https://via.placeholder.com/150/cccccc/969696?text=No+Image'; // Fallback image
  const artistName = track.artists?.join(', ') || 'Unknown Artist';

  const handleCardClick = (e) => {
    // Prevent card click if the play/pause button (if it existed) was clicked
    // if (e.target.closest('.play-pause-button')) {
    //  return; 
    // }
    if (onSelect) {
      onSelect(track);
    }
  };

  return (
    <motion.div
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer group transform transition duration-300 hover:scale-105 hover:shadow-xl relative" 
      onClick={handleCardClick} 
      whileHover={{ y: -5 }} // Subtle lift effect on hover
      title={`${track.name} by ${artistName}`}
    >
      <div className="aspect-square w-full relative">
        <img 
          src={imageUrl} 
          alt={`${track.name} album art`}
          className="w-full h-full object-cover"
          loading="lazy" // Lazy load images
        />
        {/* Removed Play/Pause Button Overlay */}
        {/* 
        {track.previewUrl && (
          <button
            onClick={(e) => { 
              e.stopPropagation(); // Prevent card click when button is clicked
              onPlayPreview(); 
            }}
            className="play-pause-button absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
            aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
          >
            {isPlaying ? (
              <PauseIcon className="h-10 w-10 text-white opacity-80" />
            ) : (
              <PlayIcon className="h-10 w-10 text-white opacity-80" />
            )}
          </button>
        )}
        */}
      </div>
      
      <div className="p-3">
        <p className="text-sm font-semibold text-gray-800 truncate" title={track.name}>{track.name}</p>
        <p className="text-xs text-gray-600 truncate" title={artistName}>{artistName}</p>
      </div>
    </motion.div>
  );
};

export default SongCard; 