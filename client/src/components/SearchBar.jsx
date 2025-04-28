import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function SearchBar({ onSearch, isLoading }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // 300ms debounce
  const searchBarRef = useRef(null); // Ref for the form/container element

  // Fetch suggestions when debounced search term changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedSearchTerm.length < 2) { // Only search if term is long enough
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      setIsSuggestionsLoading(true);
      try {
        const { data } = await axios.get(`${API_URL}/api/autocomplete`, {
          params: { q: debouncedSearchTerm, limit: 5 }
        });
        setSuggestions(data || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Autocomplete error:", error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsSuggestionsLoading(false);
      }
    };

    fetchSuggestions();

  }, [debouncedSearchTerm]);

  // Handle click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchBarRef]);

  const handleInputChange = (event) => {
    const term = event.target.value;
    setSearchTerm(term);
    if (term.length >= 2) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    const fullQuery = `${suggestion.name} ${suggestion.artist}`; // Combine name and artist for search
    setSearchTerm(fullQuery); // Set the input field
    setSuggestions([]);
    setShowSuggestions(false);
    onSearch(fullQuery); // Trigger the main search
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (searchTerm.trim()) {
      setShowSuggestions(false); // Hide suggestions on submit
      onSearch(searchTerm.trim());
    }
  };

  return (
    <div className="relative max-w-xl mx-auto" ref={searchBarRef}> {/* Added relative positioning and ref */} 
      <form onSubmit={handleSubmit} className="flex justify-center items-center w-full">
        <input
          type="text"
          placeholder="Search songs or artists..."
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)} // Show on focus if term is long enough
          // Updated styling: Add text-gray-800 for dark backgrounds
          className="flex-grow px-5 py-3 text-base md:text-lg text-gray-800 bg-white border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200 ease-in-out"
          disabled={isLoading}
          autoComplete="off" // Disable browser autocomplete
        />
        <button
          type="submit"
          // Updated styling: matching height, softer focus ring
          className={`px-6 py-3 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed transition duration-200 ease-in-out flex items-center justify-center`}
          style={{ height: 'calc(3rem + 2px)' }} // Match input height approx (py-3 * 2 + text-lg line-height)
          disabled={isLoading || !searchTerm.trim()}
        >
          {isLoading || isSuggestionsLoading ? ( // Show spinner if main search OR suggestions are loading
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
      {/* Suggestions Dropdown */} 
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.id}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseDown={(e) => e.preventDefault()} // Prevent blur on click
            >
              <span className="font-medium text-gray-900">{suggestion.name}</span>
              <span className="text-sm text-gray-700 ml-2">by {suggestion.artist}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SearchBar; 