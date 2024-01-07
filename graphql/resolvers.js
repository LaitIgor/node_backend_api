const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const { clearImage } = require('../util/file');

const User = require('../models/user');
const Post = require('../models/post');

module.exports = {
    createUser: async function({ userInput }, req) {
        const email = userInput.email;
        const errors = [];
        if (!validator.isEmail(userInput.email)) {
            errors.push({message: 'Email is invalid'})
        }
        if (validator.isEmpty(userInput.password) ||
            !validator.isLength(userInput.password, {min: 5})) {
                errors.push({message: 'Password too short'})
        }
        if (errors.length > 0) {
            const error = new Error('Invalid input');
            error.data = errors;
            errors.code = 422;
            throw error;
        }
        const name = userInput.name;
        const password = userInput.password;
        const existingUser = await User.findOne({email: userInput.email})
        if (existingUser) {
            console.log('FOUND!');
            const error = new Error('User exists already!');
            throw error;
        }
        const hashedPassword = await bcrypt.hash(userInput.password, 12);
        const user = new User({
            email,
            name,
            password: hashedPassword
        })
        const createdUser = await user.save();
        return {...createdUser._doc, _id: createdUser._id.toString()}

    },
    login: async function({ email, password }) {
        const user = await User.findOne({email});
        if (!user) {
            const error = new Error('User not found');
            error.code = 401;
            throw error;
        }
        const isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual) {
            const error = new Error('User is incorrect');
            error.code = 401;
            throw error;
        }
        const token = jwt.sign({
            userId: user._id.toString(),
            email: user.email
        }, 'supersecretcipher', { expiresIn: '1h' });
        return { token, userId: user._id.toString() }
    },
    createPost: async function({ postInput }, req) {
    console.log('!!!!!!!!!!!!!!!CREATE POST LOGGER!!!!!!!!!!!!!!!');
        if (!req.isAuth) {
            const error = new Error('Not authenticated');
            error.code = 401;
            throw error;
        }
        const errors = [];
        if (validator.isEmpty(postInput.title) || !validator.isLength(postInput.title, { min: 5 }) ) {
            errors.push({message: 'Title is invalid'})
        }
        if (validator.isEmpty(postInput.content) || !validator.isLength(postInput.content, { min: 5 }) ) {
            errors.push({message: 'Content is invalid'})
        }
        if (errors.length > 0) {
            const error = new Error('Invalid input');
            error.data = errors;
            errors.code = 422;
            throw error;
        }

        console.log(req.userId, 'req.userId');
        const user = await User.findById(req.userId);
        if (!user) {
            const error = new Error('Invalid user');
            error.data = errors;
            errors.code = 401;
            throw error;
        }
        console.log(postInput.imageUrl, 'postInput.imageUrlpostInput.imageUrlpostInput.imageUrlpostInput.imageUrlpostInput.imageUrl');
        const post = new Post({
            title: postInput.title,
            content: postInput.content,
            imageUrl: postInput.imageUrl,
            creator: user
        });
        const createdPost = await post.save();
        user.posts.push(createdPost);
        await user.save();
        return {
            ...createdPost._doc, 
            _id: createdPost._id.toString(), 
            createdAt: createdPost.createdAt.toISOString(),
            updatedAt: createdPost.updatedAt.toISOString()
        };

    },
    updatePost: async function ({ id, postInput }, req) {
        if (!req.isAuth) {
            const error = new Error('Not authenticated');
            error.code = 401;
            throw error;
        }
        const post = await Post.findById(id).populate('creator');
        if (!post) {
            const error = new Error('No post found');
            error.code = 404;
            throw error;
        }
        if (post.creator._id.toString() !== req.userId.toString()) {
            const error = new Error('Not authorized');
            error.code = 403;
            throw error;
        }
        const errors = [];
        if (validator.isEmpty(postInput.title) || !validator.isLength(postInput.title, { min: 5 }) ) {
            errors.push({message: 'Title is invalid'})
        }
        if (validator.isEmpty(postInput.content) || !validator.isLength(postInput.content, { min: 5 }) ) {
            errors.push({message: 'Content is invalid'})
        }
        if (errors.length > 0) {
            const error = new Error('Invalid input');
            error.data = errors;
            errors.code = 422;
            throw error;
        }
        post.title = postInput.title;
        post.content = postInput.content;
        if (postInput.imageUrl !== 'undefined') {
            post.imageUrl = postInput.imageUrl;
        }
        const updatedPost = await post.save();
        return { 
            ...updatedPost._doc, 
            id: updatedPost._id.toString(), 
            createdAt: updatedPost.createdAt.toISOString(), 
            updatedAt: updatedPost.updatedAt.toISOString()
        }
    },
    deletePost: async function({ id }, req) {
        if (!req.isAuth) {
            const error = new Error('Not authenticated');
            error.code = 401;
            throw error;
        }
        const post = await Post.findById(id);
        if (!post) {
            const error = new Error('No post found');
            error.code = 404;
            throw error;
        }
        if (post.creator.toString() !== req.userId.toString()) {
            const error = new Error('Not authorized');
            error.code = 403;
            throw error;
        }
        clearImage(post.imageUrl);
        await Post.findByIdAndDelete(id);
        const user = await User.findById(req.userId);
        user.posts.pull(id);
        await user.save();
        return true;

    },
    posts: async function({ page }, req) {
        if (!req.isAuth) {
            const error = new Error('Not authenticated');
            error.code = 401;
            throw error;
        }
        if (!page) {
            page = 1;
        }
        const perPage = 2;
        const totalPosts = await Post.find().countDocuments();
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * perPage)
            .limit(perPage)
            .populate('creator');
        return { 
            posts: posts.map(p => {
                    return {
                        ...p._doc, 
                        _id: p._id.toString(), 
                        createdAt: p.createdAt.toString(),
                        updatedAt: p.updatedAt.toString() 
                    };
                }), 
            totalPosts };
    },
    post: async function ({ id }, req) {
        if (!req.isAuth) {
            const error = new Error('Not authenticated');
            error.code = 401;
            throw error;
        }
        const post = await Post.findById(id).populate('creator');
        if (!post) {
            const error = new Error('No post found');
            error.code = 404;
            throw error;
        }
        return {
            ...post._doc,
            _id: post._id.toString(),
            createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString(),
        }

    },
    user: async function (args, req) {
        if (!req.isAuth) {
            const error = new Error('Not authenticated');
            error.code = 401;
            throw error;
        }
        const user = await User.findById(req.userId);
        if (!user) {
            const error = new Error('Nouser found');
            error.code = 401;
            throw error;
        }
        return {
            ...user._doc, 
            _id: user._id.toString()
        }
    },
    updateStatus: async function({ status }, req) {
        if (!req.isAuth) {
            const error = new Error('Not authenticated');
            error.code = 401;
            throw error;
        }
        const user = await User.findById(req.userId);
        if (!user) {
            const error = new Error('Nouser found');
            error.code = 401;
            throw error;
        }
        user.status = status;
        await user.save();
        return {
            ...user._doc,
            _id: user._id.toString()
        }
    }
}