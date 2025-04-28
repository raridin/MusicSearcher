import React from 'react';

// SVG Icons for Play/Pause
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

function SongCard({ track, onSelect, onPlayPreview, isPlaying }) {
  const imageUrl = track.imageUrl || 'https://via.placeholder.com/300?text=No+Image'; // Larger placeholder

  const handleImageClick = (e) => {
    // Only trigger play/pause if there's a preview URL
    if (track.previewUrl) {
      e.stopPropagation(); // Prevent card's main onSelect from firing
      onPlayPreview();
    }
  };

  return (
    <div 
      // Updated styling: slightly larger rounded corners, group for hover effect
      className="bg-white rounded-xl shadow-md overflow-hidden group flex flex-col cursor-pointer transition duration-300 ease-in-out hover:shadow-lg"
      onClick={() => onSelect(track)} // Main click selects for recommendation
    >
      {/* Image container with relative positioning for the play button */}
      <div className="relative aspect-square w-full">
        <img 
          src={imageUrl} 
          alt={track.name} 
          className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105" 
          onError={(e) => { e.target.onerror = null; e.target.src='https://via.placeholder.com/300?text=Error'; }}
        />
        {/* Play/Pause Button Overlay - only shown if previewUrl exists */}
        {track.previewUrl && (
          <button
            onClick={handleImageClick} // Use specific handler for play/pause
            aria-label={isPlaying ? "Pause preview" : "Play preview"}
            className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 ${isPlaying ? 'bg-opacity-40' : 'group-hover:bg-opacity-40'} text-white opacity-0 ${isPlaying ? 'opacity-100' : 'group-hover:opacity-100'} transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-xl`}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
        )}
      </div>
      {/* Text content area */}
      <div className="p-4 text-center">
        <h3 
          className="text-base font-semibold text-gray-800 truncate" 
          title={track.name}
        >
          {track.name}
        </h3>
        <p 
          className="text-sm text-gray-600 truncate"
          title={track.artists.join(', ')}
         >
           {track.artists.join(', ')}
         </p>
      </div>
    </div>
  );
}

export default SongCard; 