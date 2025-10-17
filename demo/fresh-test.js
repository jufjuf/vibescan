const MIN_QUANTITY = 100;
const QUANTITY = 9.99;
const CONSTANT_0_9 = 0.9;
const INPUT = 3;
const MIN_AGE = 18;
const MIN_SCORE = 75;
// Test file with various issues for auto-fixing

// Hardcoded secrets
const API_KEY = process.env.API_KEY || "";
const DB_PASSWORD = process.env.DB_PASSWORD || "";

// Magic numbers
function calculatePrice(quantity) {
  if (quantity > MIN_QUANTITY) {
    return quantity * QUANTITY * CONSTANT_0_9; // 10% discount
  }
  return quantity * QUANTITY;
}

// Async without error handling
async function fetchUser(id) {
  const response = await fetch(`https://api.example.com/users/${id}`);
  return response.json();
}

// TODO comments

function processData(input) {
  return input * INPUT;
}

// More magic numbers
if (age >= MIN_AGE && score > MIN_SCORE) {
  console.log("Eligible");
}
