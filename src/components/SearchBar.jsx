import React, { useState } from 'react';

function SearchBar({ onSearch, isLoading }) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex justify-center items-center max-w-xl mx-auto">
      <input
        type="text"
        placeholder="Search songs, artists, or albums..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        // Updated styling: larger, softer focus ring, slightly rounded
        className="flex-grow px-5 py-3 text-base md:text-lg border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200 ease-in-out"
        disabled={isLoading}
      />
      <button
        type="submit"
        // Updated styling: matching height, softer focus ring
        className={`px-6 py-3 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed transition duration-200 ease-in-out flex items-center justify-center`}
        style={{ height: 'calc(3rem + 2px)' }} // Match input height approx (py-3 * 2 + text-lg line-height)
        disabled={isLoading || !searchTerm.trim()}
      >
        {isLoading ? (
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )}
      </button>
    </form>
  );
}

export default SearchBar; 