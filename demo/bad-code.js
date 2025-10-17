// This file contains intentional security and quality issues for testing

// Security Issue: Hardcoded API key
const API_KEY = "sk-1234567890abcdefghijklmnopqrstuvwxyz";
const PASSWORD = "admin123";

// Security Issue: SQL injection
function getUserById(userId) {
  const query = "SELECT * FROM users WHERE id=" + userId;
  return db.query(query);
}

// Security Issue: eval usage
function executeCode(userInput) {
  return eval(userInput);
}

// Security Issue: XSS vulnerability
function displayMessage(message) {
  document.getElementById('output').innerHTML = message;
}

// AI Pattern Issue: Function too long (50+ lines)
async function processUserData(userData) {
  // Missing error handling for async function
  const response = await fetch('/api/validate');
  const validation = await response.json();

  // Magic numbers everywhere
  if (userData.age > 150) {
    return false;
  }

  if (userData.score < 42) {
    return false;
  }

  // Deep nesting
  if (userData.active) {
    for (let i = 0; i < userData.items.length; i++) {
      if (userData.items[i].valid) {
        while (userData.processing) {
          if (userData.ready) {
            if (userData.confirmed) {
              // This is too deeply nested!
              console.log('Processing...');
            }
          }
        }
      }
    }
  }

  // More lines to make this function long
  let result = null;

  // High cyclomatic complexity
  if (userData.type === 'admin') {
    result = 'admin';
  } else if (userData.type === 'moderator') {
    result = 'moderator';
  } else if (userData.type === 'user') {
    result = 'user';
  } else if (userData.type === 'guest') {
    result = 'guest';
  } else if (userData.type === 'banned') {
    result = 'banned';
  } else if (userData.type === 'pending') {
    result = 'pending';
  } else if (userData.type === 'suspended') {
    result = 'suspended';
  } else {
    result = 'unknown';
  }

  return result;
}

// Code Quality Issue: Too many parameters
function createUser(name, email, password, age, country, city, zip, phone, address, company) {
  // Too many parameters!
  return {
    name, email, password, age, country, city, zip, phone, address, company
  };
}

// TODO: Fix this function
// FIXME: Memory leak here
function leakyFunction() {
  const data = [];
  setInterval(() => {
    data.push(new Array(1000000));
  }, 216);
}
