const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const app = require('./src/app');

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to MongoDB, then start the Express server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
