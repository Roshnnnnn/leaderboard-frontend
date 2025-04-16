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
  const [showAddForm, setShowAddForm] = useState(false)
  const [newUser, setNewUser] = useState({
    name: '',
    points: 0
  })

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
      const response = await axios.get(`http://localhost:4000/api/leaderboard`, {
        headers: {
          'Content-Type': 'application/json',
        }
      })
      // Keep the order from the backend (sorted by ID)
      setUsers(response.data)
      setSearchResult(null)
      setSearchError(false)
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
        setSearchResult(response.data.searchedEntry)
        setUsers(response.data.otherEntries)
      } catch (error) {
        console.error('Error searching:', error)
        setSearchResult(null)
        setSearchError(true)
        fetchLeaderboard()
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

  const handleRecalculate = async () => {
    try {
      console.log('Sending recalculate request...');
      const response = await axios.post('http://localhost:4000/api/leaderboard/recalculate');
      console.log('Recalculate response:', response.data);
      
      // Update users with the sorted data (already sorted by rank)
      setUsers(response.data);
      
      // If there's a search result, we need to update its rank too
      if (searchResult) {
        const updatedSearchResult = response.data.find(entry => entry.id === searchResult.id);
        if (updatedSearchResult) {
          setSearchResult(updatedSearchResult);
        }
      }
    } catch (error) {
      console.error('Error recalculating leaderboard:', error);
    }
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    try {
      console.log('Adding new user:', newUser)
      // Send only name and points
      const response = await axios.post('http://localhost:4000/api/leaderboard', {
        name: newUser.name,
        points: newUser.points || 0
      });
      console.log('New user added:', response.data)
      // Reset form
      setNewUser({ name: '', points: 0 })
      setShowAddForm(false)
      // Refresh leaderboard
      fetchLeaderboard()
    } catch (error) {
      console.error('Error adding new user:', error)
    }
  }

  const renderUserEntry = (user) => (
    <div key={user.id} className="bg-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-2xl font-bold">#{user.rank}</span>
          <div>
            <h3 className="font-semibold">{user.name}</h3>
            <p className="text-sm text-gray-400">ID: {user.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xl">{user.points} points</span>
          <button
            onClick={() => handleStart(user.id)}
            className="bg-green-600 px-4 py-2 rounded-md hover:bg-green-500"
          >
            Start
          </button>
        </div>
      </div>
    </div>
  )

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
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-600 px-4 py-2 rounded-md hover:bg-blue-500"
            >
              Add New User
            </button>
            <button
              onClick={handleRecalculate}
              className="bg-gray-700 px-4 py-2 rounded-md hover:bg-gray-600"
            >
              Recalculate
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

        {/* Add User Form */}
        {showAddForm && (
          <div className="mb-6 p-4 bg-gray-800 rounded-lg">
            <h2 className="text-xl mb-4">Add New User</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block mb-1">Name:</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full p-2 rounded bg-gray-700"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Initial Points:</label>
                <input
                  type="number"
                  value={newUser.points}
                  onChange={(e) => setNewUser({ ...newUser, points: parseInt(e.target.value) })}
                  className="w-full p-2 rounded bg-gray-700"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-blue-600 px-4 py-2 rounded-md hover:bg-blue-500"
                >
                  Add User
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-gray-700 px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter Type Display */}
        <div className="mb-6">
          <div className="text-sm text-gray-400">
            Sort by {filterType} ▼
          </div>
        </div>

        {/* Search Result */}
        {searchResult && (
          <div className="mb-6">
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-blue-400">Searched Result:</h3>
              {renderUserEntry(searchResult)}
            </div>
            <div className="mt-6 border-t border-gray-700 pt-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-400">Other Entries:</h3>
            </div>
          </div>
        )}

        {/* Leaderboard List */}
        <div className="space-y-2">
          {Array.isArray(users) && users
            .filter(user => !searchResult || user.id !== searchResult.id)
            .map(renderUserEntry)}
        </div>
      </div>
    </div>
  )
}

export default App