const express = require('express');
const bodyParser = require('body-parser');

const feedRoutes = require('./routes/feed');

const app = express();

app.use(bodyParser.json()); // application/json

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

app.listen(8080);