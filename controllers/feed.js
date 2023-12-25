const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');

const io = require('../socket');
const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = (req, res, next) => {
    const currentPage = req.query.page || 1;
    const perPage = 2;
    let totalItems;
    Post.find().countDocuments()
        .then(count => {
            totalItems = count;
            return Post.find()
                .skip((currentPage - 1) * perPage)
                .limit(perPage);
        })
        .then(posts => {
            res.status(200).json({ message: 'Fetched posts successfully.', posts, totalItems  })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
};

exports.createPost = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect.');
        error.statusCode = 422;
        throw error;
    }
    if (!req.file) {
        const error = new Error('No image provided.')
        error.statusCode = 422;
        throw error;
    }
    const title = req.body.title;
    const content = req.body.content;
    const imageUrl = req.file.path.replace("\\" ,"/");
    let creator;
    const post = new Post({
        title, 
        content, 
        imageUrl: imageUrl,
        creator: req.userId,
    });
    post.save()
    .then(res => {
       return User.findById(req.userId)
    })
    .then(user => {
        creator = user;
        user.posts.push(post);
        return user.save();
    })
    .then(result => {
        io.getIo().emit('posts', { action: 'create', post })
        res.status(201).json({
            message: 'Post created successfully',
            post: post,
            creator: {_id: creator._id, name: creator.name}
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

exports.updatePost = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect.');
        error.statusCode = 422;
        throw error;
    }
    const postId = req.params.postId;
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;
    if (req.file) {
        imageUrl = req.file.path.replace("\\","/");;
    }
    if (!imageUrl) {
        const error = new Error('No file picked.');
        error.statusCode = 422;
        throw error;
    }
    Post.findById(postId)
        .then(post => {
            if (!post) {
                const error = new Error('Could not find a post.')
                error.statusCode = 404;
                throw error;
            }
            // Only creator can deleted its post check
            if (post.creator.toString() !== req.userId.toString()) {
                const error = new Error('Not authorised');
                error.statusCode = 403;
                throw error;
            }
            if (imageUrl !== post.imageUrl) {
                clearImage(post.imageUrl);
            }
            post.title = title;
            post.imageUrl = imageUrl;
            post.content = content;
            return post.save();
        })
        .then(result => {
            res.status(200).json({ message: 'Post updated.', post: result })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
}

exports.deletePost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
        .then(post => {
            if (!post) {
                const error = new Error('Could not find a post.')
                error.statusCode = 404;
                throw error;
            }
            // Only creator can deleted its post check
            if (post.creator.toString() !== req.userId.toString()) {
                const error = new Error('Not authorised');
                error.statusCode = 403;
                throw error;
            }
            // Check logged in user
            clearImage(post.imageUrl);
            return Post.findByIdAndDelete(postId);
        })
        .then(() => {
            return User.findById(req.userId)
        })
        .then(user => {
            // Inbuilt mongoose filter method to clear relation
            user.posts.pull(postId)
            user.save();
        })
        .then(() => {
            res.status(200).json({ message: 'Deleted Post.' })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
}

const clearImage = (filePath) => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => {
        console.log(err, 'Error image deletion');
    })
}