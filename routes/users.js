const express = require('express')
const cors = require('cors')
const router = express.Router()

const UserController = require('../controllers/userController.js')

// TODO: strengthen this
router.options('*', cors())
router.use(cors())

router.post('/:email', UserController.addTags)

module.exports = router
