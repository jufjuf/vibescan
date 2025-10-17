// This file demonstrates good practices

// Good: Using environment variables
const API_KEY = process.env.API_KEY;

// Good: Parameterized queries (pseudocode)
async function getUserById(userId) {
  try {
    return await db.query('SELECT * FROM users WHERE id = ?', [userId]);
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

// Good: Proper error handling
async function fetchUserData(userId) {
  try {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

// Good: Using constants instead of magic numbers
const MAX_AGE = 150;
const MIN_SCORE = 42;

function validateUser(userData) {
  if (userData.age > MAX_AGE) {
    return false;
  }

  if (userData.score < MIN_SCORE) {
    return false;
  }

  return true;
}

// Good: Short, focused functions
function isAdmin(user) {
  return user.type === 'admin';
}

function isModerator(user) {
  return user.type === 'moderator';
}

// Good: Using object parameter instead of many parameters
function createUser(userConfig) {
  const {
    name,
    email,
    password,
    age,
    country,
    city,
    zip,
    phone,
    address,
    company
  } = userConfig;

  return {
    name,
    email,
    password,
    age,
    country,
    city,
    zip,
    phone,
    address,
    company
  };
}
