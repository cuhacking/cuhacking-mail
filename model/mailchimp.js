const crypto = require('crypto')
const MailAPI = require('mailchimp-api-v3')
const { logger, stringify } = require('../helpers/logger')

const env = process.env.PROD ? 'production' : 'development'
const config = require('../config.json')[env]
const api = new MailAPI(config.mailChimpKey)

const MailChimp = module.exports

/**
 * Get a specific list from Mailchimp
 *
 * @param {string} name     - The name of the list to get
 *
 * @return {Promise}        - Promise returns the list object received from Mailchimp
 */
MailChimp.getList = function(name) {
  let promise = new Promise(function(resolve, reject) {
    api.get('/lists').then(function(res) {
      for (let list of res.lists) {
        if (list.name === name) {
          resolve(list)
        }
      }

      reject('List was not found')
    })
  })

  return promise
}

/**
 * Subscribe a user to a mailing list
 *
 * @param {string} list         - The name of the list to add the email to. Creates list if it does not exist
 * @param {string} group        - The name of the group to add the email to
 * @param {string} email        - The email to add to the mailing list
 *
 * @return {Promise}            - Promise returns the response from the add operation
 */
MailChimp.subscribe = function(list, email) {
  let promise = new Promise(function(resolve, reject) {
    MailChimp.getList(list)
      .then(function(resList) {
        // Use Promise.all to pass the result down the promise chain
        // PUT creates the user if they don't exist
        return Promise.all([
          api.put(
            '/lists/' +
              resList.id +
              '/members/' +
              crypto
                .createHash('md5')
                .update(email)
                .digest('hex'),
            {
              email_address: email,
              status: 'subscribed'
            }
          ),
          resList
        ])
      })
      .then(function([addRes, resList]) {
        return api.post(
          '/lists/' +
            resList.id +
            '/members/' +
            crypto
              .createHash('md5')
              .update(email)
              .digest('hex') +
            '/tags',
          {
            tags: [
              {
                name: '2020',
                status: 'active'
              },
              {
                name: 'newsletter',
                status: 'active'
              }
            ]
          }
        )
      })
      .then(function(res) {
        resolve(res)
      })
      .catch(function(err) {
        reject(err)
      })
  })

  return promise
}

/**
 * Add a tag to a user in Mailchimp
 * Subscribes them to the mailing list if they are not already subscribed
 *
 * Tags should be an _array_ of tags
 */
MailChimp.addTag = (list, email, tags) => {
  let promise = new Promise(function(resolve, reject) {
    MailChimp.getList(list)
      .then(function(resList) {
        let tagsToAdd = []
        for (let tag of tags) {
          tagsToAdd.push({ name: tag, status: 'active' })
        }

        return api.post(
          '/lists/' +
            resList.id +
            '/members/' +
            crypto
              .createHash('md5')
              .update(email)
              .digest('hex') +
            '/tags',
          {
            tags: tagsToAdd
          }
        )
      })
      .then(function(res) {
        resolve(res)
      })
      .catch(function(err) {
        // If 404, user is likely not subscribed. Subscribe them, then add the tag
        if (err.status === 404) {
          logger.verbose('New user. Subscribe to mailing list.')
          MailChimp.subscribe(list, email)
            .then(function() {
              return MailChimp.getList(list)
            })
            .then(function(resList) {
              let tagsToAdd = []
              for (let tag of tags) {
                tagsToAdd.push({ name: tag, status: 'active' })
              }

              return api.post(
                '/lists/' +
                  resList.id +
                  '/members/' +
                  crypto
                    .createHash('md5')
                    .update(email)
                    .digest('hex') +
                  '/tags',
                {
                  tags: tagsToAdd
                }
              )
            })
            .then(function(res) {
              resolve(res)
            })
            .catch(function(subscribeErr) {
              console.log(subscribeErr)
              reject(subscribeErr)
            })
        } else {
          reject(err)
        }
      })
  })

  return promise
}
