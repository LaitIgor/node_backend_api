const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.signup = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;
    bcrypt.hash(password, 12)
        .then(hashedPass => {
            const user = new User({email, password: hashedPass, name});
            return user.save();
        })
        .then(result => {
            res.status(201).json({ message: 'User created.', userId: result.__id })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
}

exports.login = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;

    User.findOne({ email }) 
        .then(user => {
            if (!user) {
                const error = new Error('A user with such emauk is not found')
                error.statusCode = 401;
                throw error;
            }
            loadedUser = user;
           return bcrypt.compare(password, user.password)

        })
        .then(isEqual => {
            if (!isEqual) {
                const error = new Error('Wrong password');
                error.statusCode = 401;
                throw error
            }
            // User input correct password so now we need to generate web token
            const token = jwt.sign(
                {
                    email: loadedUser.email, 
                    userId: loadedUser._id.toString(),
                }, 
                'secret-token',
                { expiresIn: '1h' }
            );
            res.status(200).json(
                {
                    token, 
                    userId: loadedUser._id.toString()
                }
            );
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
}