const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Load routes
app.use('/api', require('./routes/api'));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
