import { useState, useEffect } from 'react';
import { Search, Star, PlayCircle, Loader2, Heart, X } from 'lucide-react';

export default function RecommendPage() {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const savedFavorites = localStorage.getItem('movieFavorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (err) {
        console.error("Failed to parse the saved favorites data:", err);
      }
    }
  }, []);

  const toggleFavorite = (movieToToggle) => {
    let updatedFavorites;
    const isAlreadyFavorited = favorites.some((fav) => fav.id === movieToToggle.id);

    if (isAlreadyFavorited) {
      updatedFavorites = favorites.filter((fav) => fav.id !== movieToToggle.id);
    } else {
      updatedFavorites = [movieToToggle, ...favorites];
    }
    
    setFavorites(updatedFavorites);
    localStorage.setItem('movieFavorites', JSON.stringify(updatedFavorites));
  };

  const fetchRecommendations = async (titleToSearch) => {
    if (!titleToSearch.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('movieBotToken');
      const response = await fetch('http://127.0.0.1:8000/api/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ movie_title: titleToSearch })
      });
      
      if (response.status === 401) {
        throw new Error('Your secure session has expired. Please securely log out and log back in.');
      }
      
      if (!response.ok) {
        throw new Error(`We couldn't find "${titleToSearch}" in the database. Try another movie!`);
      }
      
      const data = await response.json();
      setMovies(data);

      try {
        const currentDate = new Date().toLocaleString('en-US', { 
            month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' 
        });
        const newHistoryItem = { query: titleToSearch, timestamp: currentDate };
        const existingHistory = JSON.parse(localStorage.getItem('movieSearchHistory') || '[]');
        const filteredHistory = existingHistory.filter(item => item.query.toLowerCase() !== titleToSearch.toLowerCase());
        const updatedHistory = [newHistoryItem, ...filteredHistory].slice(0, 20);
        localStorage.setItem('movieSearchHistory', JSON.stringify(updatedHistory));
      } catch (historyError) {
        console.error("An unexpected error occurred while attempting to save the search history:", historyError);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  
  useEffect(() => {
    if (searchQuery) {
      fetchRecommendations(searchQuery);
    }
  }, []);

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      fetchRecommendations(searchQuery);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setMovies([]);
    setError(null);
  };
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-teal-400 gap-4">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="text-xl font-medium text-white">We are calculating the perfect recommendations for you...</p>
      </div>
    );
  }

  return (
    <div className="p-6 text-white w-full max-w-7xl mx-auto flex flex-col gap-8">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Top Recommendations</h1>
          <p className="text-gray-400 mt-1">Curated specially for your unique tastes.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search Away..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="w-full bg-[#161b2a] border border-gray-800 rounded-2xl py-2.5 pl-12 pr-10 text-white focus:border-teal-500 outline-none transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-3 p-1 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-full transition-all"
              title="Clear Search"
              >
                <X className="w-4 h-4" />
              </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-400/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-center">
          {error}
        </div>
      )}

      {movies.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center text-gray-500 mt-24">
          <Search className="w-20 h-20 mb-6 opacity-40" />
          <h2 className="text-2xl font-bold text-gray-300">Ready to discover your next favorite movie?</h2>
          <p className="mt-2 text-lg">Type a movie title in the search bar above and press Enter to begin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {movies.map((movie) => {
            const isFavorited = favorites.some((fav) => fav.id === movie.id);
            
            return (
              <div key={movie.id} className="group relative rounded-2xl overflow-hidden bg-[#161b2a] border border-gray-800 shadow-lg hover:shadow-teal-900/20 transition-all hover:-translate-y-2 duration-300">
                <div className="aspect-[2/3] w-full overflow-hidden relative cursor-pointer">
                  <img src={movie.image} alt={movie.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/40 to-transparent"></div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <PlayCircle className="w-16 h-16 text-teal-400 drop-shadow-lg" />
                  </div>
                </div>

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(movie);
                  }}
                  className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-full hover:bg-black/80 transition-all z-20"
                >
                  <Heart className={`w-5 h-5 transition-colors ${isFavorited ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                </button>

                <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-lg leading-tight line-clamp-1">{movie.title}</h3>
                    <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded-md backdrop-blur-sm">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-bold">{movie.rating}</span>
                    </div>
                  </div>
                  <span className="text-sm text-teal-300 font-medium">{movie.genre}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}