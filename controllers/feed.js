const { validationResult } = require('express-validator');

const Post = require('../models/post');

exports.getPosts = (req, res, next) => {
    Post.find()
        .then(posts => {
            res.status(200).json({ message: 'Fetched posts successfully.', posts })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
    // res.status(200).json({
    //     posts: [
    //         {
    //             _id: '1',
    //             title: 'First post',
    //             content: 'This is the first post',
    //             imageUrl: 'images/globe.jpg',
    //             creator: {
    //                 name: 'Igor',
    //             },
    //             createdAt: new Date(),
    //         }
    //     ]
    // });

};

exports.createPost = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect.');
        error.statusCode = 422;
        throw error;
    }
    const title = req.body.title;
    const content = req.body.content;
    console.log(title, content, 'req.body');
    const post = new Post({
        title, 
        content, 
        imageUrl: 'images/globe.jpg',
        creator: {
            name: 'Igor',
        },
    });
    post.save()
    .then(result => {
        res.status(201).json({
            message: 'Post created successfully',
            post: result
        });
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};

exports.getPost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
        .then(post => {
            if (!post) {
                const error = new Error('Could not find a post.')
                error.statusCode = 404;
                throw error;
            }

            res.status(200).json({ message: 'Post fetched.', post })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
}