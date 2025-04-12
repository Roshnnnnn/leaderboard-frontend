import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import axios from 'axios'

function App() {
  const [users, setUsers] = useState([])
  const [searchId, setSearchId] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [searchError, setSearchError] = useState(false)
  const [filterType, setFilterType] = useState('Day')
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const handleAdd = async () => {
    try {
      if (!searchResult) return;
      
      // Use the same increment endpoint for Add button
      // Add points
      await axios.post(
        `http://localhost:4000/api/leaderboard/${searchResult.id}/add`
      );

      // Update the search result
      const updatedUser = await axios.get(`http://localhost:4000/api/leaderboard/${searchResult.id}`);
      setSearchResult(updatedUser.data);
      console.log('Updated points from server:', updatedUser.data.points);
      
      // Refresh the leaderboard in background
      fetchLeaderboard();
    } catch (error) {
      console.error('Error adding points:', error);
    }
  }

  const handleStart = async (userId) => {
    try {
      console.log(`Starting session for user ${userId}`);
      
      // Increment points directly using the increment endpoint
      const response = await axios.post(
        `http://localhost:4000/api/leaderboard/${userId}/add`
      );

      console.log('Points added:', response.data.totalPoints);

      // Update UI based on whether it's a search result or leaderboard item
      if (searchResult && searchResult.id === userId) {
        const updatedUser = await axios.get(`http://localhost:4000/api/leaderboard/${userId}`);
        setSearchResult(updatedUser.data);
      }
      
      // Refresh the leaderboard to update all entries
      fetchLeaderboard();
    } catch (error) {
      console.error('Error updating points:', error);
    }
  }

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(`http://localhost:4000/api/leaderboard`)
      // Sort users by points in descending order and update ranks
      const sortedUsers = response.data.sort((a, b) => b.points - a.points)
        .map((user, index) => ({
          ...user,
          rank: index + 1 // Update rank based on sorted position
        }));
      setUsers(sortedUsers)
      setSearchResult(null)
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    }
  }

  const handleSearch = async (e) => {
    setSearchId(e.target.value)
    setSearchError(false)
    if (e.target.value) {
      try {
        const response = await axios.get(`http://localhost:4000/api/leaderboard/${e.target.value}`)
        setSearchResult(response.data)
        setUsers([])
      } catch (error) {
        console.error('Error searching:', error)
        setSearchResult(null)
        setSearchError(true)
      }
    } else {
      setSearchResult(null)
      setSearchError(false)
      fetchLeaderboard()
    }
  }

  const handleFilterChange = (type) => {
    setFilterType(type)
    setIsFilterOpen(false)
    fetchLeaderboard()
  }

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            <button
              onClick={fetchLeaderboard}
              className="bg-gray-700 px-4 py-2 rounded-md hover:bg-gray-600"
            >
              Refresh
            </button>
          </div>
          {/* Search Section */}
          <div className="flex gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by ID"
                value={searchId}
                onChange={handleSearch}
                className="bg-gray-800 px-4 py-2 rounded-md pl-10 focus:outline-none focus:ring-2 focus:ring-gray-600"
              />
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
            </div>
            <div className="relative">
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="bg-gray-700 px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Filter
              </button>
              {isFilterOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg">
                  {['Day', 'Month', 'Year'].map((type) => (
                    <button
                      key={type}
                      onClick={() => handleFilterChange(type)}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-700"
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter Type Display */}
        <div className="mb-6">
          <div className="text-sm text-gray-400">
            Sort by {filterType} ▼
          </div>
        </div>

        {/* Search Result */}
        {searchId && (
          <div className="space-y-2 mb-4">
            {searchResult ? (
              <>
                <div
                  key={searchResult.id}
                  className="bg-gray-800 p-4 rounded-lg flex justify-between items-center"
                >
                  <div className="flex gap-4">
                    <span className="text-gray-400">{searchResult.id}</span>
                    <span>{searchResult.name}</span>
                  </div>
                  <div className="flex gap-4">
                    <span>{searchResult.points}</span>
                    <span className="text-gray-400">#{searchResult.rank}</span>
                    <button 
                      className="bg-green-600 hover:bg-green-700 px-4 py-1 rounded-md ml-4"
                      onClick={() => handleStart(searchResult.id)}
                    >
                      Start
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleAdd}
                  className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md mt-2"
                >
                  Add
                </button>
              </>
            ) : searchError && (
              <div className="text-center py-8 bg-gray-800 rounded-lg">
                <p className="text-gray-400 text-lg">No data available</p>
              </div>
            )}
          </div>
        )}

        {/* Leaderboard Table */}
        {!searchResult && (
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.id}
                className="bg-gray-800 p-4 rounded-lg flex justify-between items-center"
              >
                <div className="flex gap-4">
                  <span className="text-gray-400">{user.id}</span>
                  <span>{user.name}</span>
                </div>
                <div className="flex gap-4">
                  <span>{user.points}</span>
                  <span className="text-gray-400">#{user.rank}</span>
                  <button 
                    className="bg-green-600 hover:bg-green-700 px-4 py-1 rounded-md ml-4"
                    onClick={() => handleStart(user.id)}
                  >
                    Start
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default App