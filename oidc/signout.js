/**
 * Module dependencies
 */

var passport = require('../boot/passport')
var settings = require('../boot/settings')
var Client = require('../models/Client')
var IDToken = require('../models/IDToken')
var InvalidTokenError = require('../errors/InvalidTokenError')

/**
 * Signout
 */

function signout (req, res, next) {
  var uri = req.query.post_logout_redirect_uri
  var hint = req.query.id_token_hint

  // verify the uri using the hint
  if (uri && hint) {
    var token = IDToken.decode(hint, settings.keys.sig.pub)

    // the token checks out
    if (token && token instanceof Error === false) {
      Client.get(token.payload.aud, function (err, client) {
        // something smells bad
        if (err) {
          return next(err)

        // unknown client
        } else if (!client) {
          return next(new Error('Unknown client'))

        // the uri is not registered.
        // logout, but don't redirect.
        } else if (client.post_logout_redirect_uris.indexOf(uri) === -1) {
          passport.logout(req)

          res.set({
            'Cache-Control': 'no-store',
            'Pragma': 'no-cache'
          })

          res.sendStatus(204)

        // logout and redirect
        } else {
          passport.logout(req)
          res.redirect(uri)
        }
      })

    // can't decode the token
    } else {
      return next(new InvalidTokenError("Can't decode id_token_hint"))
    }

  // logout and respond without redirect
  } else {
    passport.logout(req)

    res.set({
      'Cache-Control': 'no-store',
      'Pragma': 'no-cache'
    })

    res.sendStatus(204)
  }
}

/**
 * Export
 */

module.exports = signout
