const User = require('../models/User')
const User = require('../models/Note')
const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt')

const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select('-password').lean()
    if (!users?.length) {
        return res.status(400).json({message: 'No users found'})
    }
    res.json(users)
})

const createNewUser = asyncHandler(async (req, res) => {
    const {username, password, roles} = req.body

    // Confirm data
    if (!username || !password || !Array.isArray(roles) || !roles.length) {
        return res.status(400).json({message: 'All fields are required'})
    }

    // Check duplicate
    const duplicate = await User.findOne({username}).lean().exec()
    if (duplicate) {
        return res.status(409).json({message: 'Duplicate username found'})
    }

    const hashedPwd = await bcrypt.hash(password, 10)

    const userObject = {username, 'password': hashedPwd, roles}
    const user = await User.create(userObject)

    if (user) {
        res.status(201).json({message: `New user ${username} created`})
    } else {
        res.status(400).json({message: 'User data is invalid'})
    }
})

const updateUser = asyncHandler(async (req, res) => {
    const {id, username, roles, active, password} = req.body

    if (!id || !username || !Array.isArray(roles) || !roles.length || typeof active !== 'boolean') {
        return res.status(400).json({message: 'All fields are required'})
    }

    const user = await User.findById(id).exec()

    if (!user) {
        return res.status(400).json({message: 'User not found'})
    }

    user.username = username
    user.roles = roles
    user.active = active

    if (password) {
        user.password = await bcrypt.hash(password, 10)
    }

    const updatedUser = await user.save()

    res.json({message: `${updatedUser.username} information updated`})



    const duplicate = await User.findOne({username}).lean().exec()

    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({message: 'Duplicate username'})
    }
})

const deleteUser = asyncHandler(async (req, res) => {
    const {id} = req.body
    if (!id) {
        return res.status(400).json({message: 'User ID Required'})
    }

    const note = await Note.findOne({user: id}).lean().exec()
    if (note) {
        return res.status(400).json({message: 'User has assgined notes'})
    }

    const user = await User.findById(id).exec()

    if (!user) {
        return res.status(400).json({message: 'User not found'})
    }

    const result = await user.deleteOne()

    const reply = `Username ${result.username} with ID ${result._id} deleted`

    res.json(reply)
})

module.exports = {
    getAllUsers,
    createNewUser,
    updateUser,
    deleteUser
}