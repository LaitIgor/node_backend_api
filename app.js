const express = require('express');

const feedRoutes = require('./routes/feed');

const app = express();

// GET /feed/posts
app.use('/feed', feedRoutes);

app.listen(8080);