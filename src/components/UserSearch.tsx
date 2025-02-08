import React, { useState, useEffect } from 'react';
import axios from 'axios';
import type { UserProfile } from '../types';

interface UserSearchProps {
  onUserSelect: (user: UserProfile) => void;
  authToken: {
    accessToken: string;
    firebaseToken: string;
  };
}

const UserSearch: React.FC<UserSearchProps> = ({ onUserSelect, authToken }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchTerm.trim()) {
        setUsers([]);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await axios.get(`http://localhost:9091/aluminiapp/v2/profile/search`, {
          headers: {
            'Authorization': `Bearer ${authToken.accessToken}`
          },
          params: {
            displayName: searchTerm,
            page: 0,
            size: 25
          }
        });

        setUsers(response.data.content);
      } catch (err) {
        console.error('Error searching users:', err);
        setError('Failed to search users. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    const debounceTimeout = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchTerm]);

  return (
    <div className="w-full">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search users..."
          className="w-full p-2 border rounded"
        />
        {loading && (
          <div className="absolute right-2 top-2">
            <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>

      {error && <p className="text-red-500 mt-2">{error}</p>}

        <div className="mt-2 max-h-48 overflow-y-auto border rounded shadow-sm divide-y">
          {users.map((user) => (
            <div
              key={user.userId}
              className="p-2 hover:bg-gray-50 cursor-pointer"
              onClick={() => onUserSelect(user)}
            >
              <div className="font-medium text-gray-900 text-sm">{user.name}</div>
              {user.currentPosition && (
                <div className="text-xs text-gray-500">{user.currentPosition}</div>
              )}
            </div>
          ))}
        </div>
    </div>
  );
};

export default UserSearch;