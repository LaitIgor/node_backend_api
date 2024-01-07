const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const mongoose = require('mongoose');
const { graphqlHTTP } = require('express-graphql');
const { v4: uuidv4 } = require('uuid');

const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');
const auth = require('./middleware/auth');
const { clearImage } = require('./util/file');

const { MONGO_DB_URI } = require('./globalVars');

const app = express();

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, uuidv4().trim() + '.' + file.originalname.split('.')[1])
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || 
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg') {
            cb(null, true)
        } else {
            cb(null, false)
        }
}

app.use(bodyParser.json()); // application/json

// Register multer
app.use(multer({storage: fileStorage, fileFilter }).single('image'));

app.use('/images', express.static(path.join(__dirname, 'images')));


app.use((req, res, next) => {
    // Allow cors
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
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

app.use(auth);

app.put('/post-image', (req, res, next) => {
    console.log(11111);
    if (!req.isAuth) {
        throw new Error('Not authenticated!');
    }
    console.log(2222);
    if (!req.file) {
        return res.status(200).json({ message: 'No file provided!' })
    }
    console.log(3333);
    if (req.body.oldPath) {
        clearImage(req.body.oldPath);
    }
    console.log(req.file, 4444);
    return res.status(201).json({ message: 'File stored.', filePath: req.file.path})
});

app.use('/graphql', graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    customFormatErrorFn(err) {
        // this property will be added by express if error is detected
        if (!err.originalError) {
            console.log(err, 'errrrrr1111');
            return err;
        }
        const data = err.originalError.data;
        const message = err.message || 'An error occured';
        const code = err.originalError.code || 500;
        console.log(err, 'errrrrr2222');
        return { message, status: code, data }

    }
}))

app.use((error, req, res, next) => {
    console.log(error, 'error');
    const statusCode = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(statusCode).json({ message, data })
})

mongoose.connect(MONGO_DB_URI)
    .then(res => {
       app.listen(8080);
    })
    .catch(err => console.log(err, 'err'));


