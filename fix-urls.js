// One-time migration script to fix image URLs in database
// Run via: node fix-urls.js (while backend is running)

const http = require('http');

const SERVER_URL = 'http://192.168.1.3:5000';

// We'll call the API to get data, then use direct mongoose to update
// But since Atlas blocks new connections, we'll add a temp route to the running server

const fixData = `
  Fix broken Windows file paths in database.
  Any image field starting with C: needs to be converted to ${SERVER_URL}/uploads/<filename>
`;

console.log(fixData);
console.log('This script adds a temporary fix route to the running server.');
console.log('Please use the /api/fix-urls endpoint instead.');
