const dotenv = require('dotenv');
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'misc_items';
const PORT = process.env.PORT || 3000;

module.exports = {
    MONGODB_URI,
    MONGODB_DB_NAME,
    PORT
};
