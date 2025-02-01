import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from 'pages/api';
import Product from 'components/products/product';

// MUI Components
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function SearchBox() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [name, setName] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestionInputRef = useRef();

  // Load recent searches from localStorage on component mount
  useEffect(() => {
    const storedSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
    setRecentSearches(storedSearches);
  }, []);

  // Fetch suggestions whenever `name` changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (name.trim().length > 0) {
        try {
          const { data } = await api.get(`/api/products/searchform/search?q=${name}`);
          setSuggestions(data);
        } catch (error) {
          console.error('Error fetching suggestions', error);
        }
      } else {
        setSuggestions([]);
      }
    };
    fetchSuggestions();
  }, [name]);

  // When the Drawer opens, focus the input
  useEffect(() => {
    if (showSuggestions) {
      // small delay to ensure the Drawer is rendered
      setTimeout(() => {
        suggestionInputRef.current?.focus();
      }, 300);
    }
  }, [showSuggestions]);

  const submitHandler = (e) => {
    e.preventDefault();
    if (name.trim() === '') return;
    handleSearch(name);
  };

  const handleSearch = async (searchTerm) => {
    try {
      // If there's a matching suggestion, store it in "recent searches"
      if (suggestions.length > 0) {
        const selectedProduct = suggestions.find((product) => product.name === searchTerm);
        if (selectedProduct) {
          const updatedSearches = [
            {
              _id: selectedProduct._id,
              name: selectedProduct.name,
              image: selectedProduct.image,
              brand: selectedProduct.brand,
              category: selectedProduct.category,
            },
            ...recentSearches.filter((item) => item._id !== selectedProduct._id),
          ].slice(0, 6);
          setRecentSearches(updatedSearches);
          localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
        }
      }
    } catch (error) {
      console.error('Error saving to recent searches', error);
    }

    setName(searchTerm);
    setSuggestions([]);
    setShowSuggestions(false);

    // Clean parentheses from name
    const cleanName = searchTerm.replace(/\s*\(.*?\)\s*/g, '').trim();
    navigate(`/products/product/${cleanName}`);
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(name);
    }
  };

  // Clicking a suggestion
  const handleSuggestionClick = (suggestion) => {
    handleSearch(suggestion.name);
  };

  // Clicking a recent search
  const handleRecentSearchClick = (recent) => {
    handleSearch(recent.name);
  };

  return (
    <div className="relative mx-1 w-full flex items-center">
      {/* Main (always visible) Search Input */}
      <input
        onKeyDown={handleKeyPress}
        onChange={(e) => setName(e.target.value)}
        value={name}
        type="text"
        id="simple-search"
        autoComplete="off"
        className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-red-500 focus:border-red-500 block w-full max-w-md ps-10 p-2.5"
        placeholder="Search Products"
        required
        // Focus on the Drawer when user focuses this input
        onFocus={() => setShowSuggestions(true)}
      />

      {/* Search Button */}
      <button
        onClick={() => navigate('/products/all')}
        className="ml-2 p-2 text-xs hidden md:block font-medium text-white bg-red-600 rounded-lg border border-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300"
      >
        <svg
          className="w-4 h-4"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 20 20"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
          />
        </svg>
        <span className="sr-only">Search</span>
      </button>

      {/* Drawer: acts as a persistent sidebar from the right */}
      <Drawer
        anchor="right"
        open={showSuggestions}
        variant="persistent"
        // Remove 'onClose' to prevent closing on backdrop click
        // Ensure Drawer covers full height
        PaperProps={{
          sx: {
            width: isSmallScreen ? '88%' : 800, // Responsive width
            height: '100vh', // Full viewport height
            boxSizing: 'border-box',
          },
        }}
      >
        {/* Drawer Header */}
        <Box
          className="flex items-center justify-between px-4 py-2 border-b border-gray-200"
          sx={{ bgcolor: 'white' }}
        >
          <Typography variant="h6" component="div" className="text-red-600 font-bold">
            Dhanya Builders
          </Typography>
          {/* Close Button - it will close the Drawer by updating state */}
          <IconButton
            onClick={() => setShowSuggestions(false)}
            aria-label="close drawer"
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Search Input within Drawer */}
        <Box
          className="flex items-center justify-between px-4 py-4 border-b border-gray-200"
          sx={{ bgcolor: 'white' }}
        >
          <input
            onKeyDown={handleKeyPress}
            onChange={(e) => setName(e.target.value)}
            value={name}
            type="text"
            ref={suggestionInputRef}
            id="drawer-search"
            autoComplete="off"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-red-500 focus:border-red-500 block w-full ps-10 p-2.5"
            placeholder="Search Products"
            required
          />
          <Button
            onClick={submitHandler}
            variant="outlined"
            sx={{ ml: 2 }}
            color="error"
            size="small"
          >
            Search
          </Button>
        </Box>

        {/* Drawer Body: Suggestions / Recent Searches */}
        <Box className="px-4 py-4 overflow-auto" sx={{ flexGrow: 1 }}>
          {/* Empty State */}
          {recentSearches.length === 0 && suggestions.length === 0 && (
            <Typography
              variant="body2"
              className="text-center mt-40 text-gray-400 italic mb-10"
            >
              No Recent Searches..
            </Typography>
          )}

          {/* Title for recent or suggestions */}
          {recentSearches.length > 0 && suggestions.length === 0 && (
            <Typography variant="body2" className="text-gray-400 italic mb-4">
              Recent Searches
            </Typography>
          )}
          {suggestions.length > 0 && (
            <Typography variant="body2" className="text-gray-400 italic mb-4">
              Similar Suggestions
            </Typography>
          )}

          {/* Suggestions / Recent Searches Grid */}
          <div
            className={`grid grid-cols-2 ${
              // Adjust grid columns based on URL or any other condition
              false // Replace 'false' with your condition if needed
                ? 'md:grid-cols-1 lg:grid-cols-1'
                : 'md:grid-cols-3 lg:grid-cols-2'
            } gap-4`}
          >
            {suggestions.length > 0
              ? suggestions.map((suggestion) => (
                  <div
                    key={suggestion._id}
                    className="flex flex-col items-center px-2 transition-transform transform cursor-pointer text-xs bg-white"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <Product product={suggestion} />
                  </div>
                ))
              : recentSearches.map((recent) => (
                  <div
                    key={recent._id}
                    className="flex flex-col items-center px-2 transition-transform transform cursor-pointer text-xs bg-white"
                    onClick={() => handleRecentSearchClick(recent)}
                  >
                    <Product product={recent} />
                  </div>
                ))}
          </div>
        </Box>
      </Drawer>
    </div>
  );
}
