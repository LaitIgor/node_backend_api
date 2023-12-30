const bcrypt = require('bcryptjs');

const User = require('../models/user');

module.exports = {
    createUser: async function({ userInput }, req) {
        const email = userInput.email;
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

    }
}