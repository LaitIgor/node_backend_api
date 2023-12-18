const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { MONGO_DB_URI } = require('./globalVars');

const feedRoutes = require('./routes/feed');

const app = express();

app.use(bodyParser.json()); // application/json

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
    // Allow cors
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
    // headers above allow frontend to get and post data using next code
    // post.addEventListener('click', () => {
    //     fetch('http://localhost:8080/feed/post', {
    //       method: 'POST',
    //       headers: {
    //         'Content-Type': 'application/json'
    //       },
    //       body: JSON.stringify({title: 'Codepen', content: 'CONTENT'})
    //     })
    //       .then(res => res.json())
    //       .then(result => console.log(result, 'result'))
    //       .catch(err => console.log(err, 'err'))
    //   })
});

// GET /feed/posts
app.use('/feed', feedRoutes);

app.use((error, req, res, next) => {
    console.log(error);
    const statusCode = error.statusCode || 500;
    const message = error.message;
    res.status(statusCode).json({ message })
})

mongoose.connect(MONGO_DB_URI)
    .then(res => {
        app.listen(8080);
    })
    .catch(err => console.log(err, 'err'));
