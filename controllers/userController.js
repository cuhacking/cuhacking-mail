const { logger, stringify } = require('../helpers/logger')
const Mailchimp = require('../model/mailchimp')

const UserController = module.exports
const COLLECTION_NAME = 'Users'
const MAILING_LIST = 'cuhacking'

UserController.addTags = async (req, res, next) => {
  try {
    const { email } = req.params
    const { tags } = req.body

    logger.verbose(`Adding tags to email: ${req.params.email}`)

    await Mailchimp.addTag(MAILING_LIST, email, tags)

    logger.verbose(`Tags succesfully added!: ${tags}`)
    return res.sendStatus(200)
  } catch (error) {
    logger.error(`Error adding tags: ${error}`)
    next(error)
  }
}
