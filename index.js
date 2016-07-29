'use strict'

const request = require('request')
const base64 = require('base64-url')
const crypto = require('crypto')

const server = 'login.twtstudio.com'

class TwTSSO {
  constructor (appid, appkey, https) {
    this.appid = appid
    this.appkey = appkey
    this.https = typeof https === 'undefined' ? true : !!https
  }

  _getServer () {
    return (this.https ? 'https' : 'http') + '://' + server + '/'
  }

  _getQuery (source) {
    if (!source) source = ''
    var query = 'app_id=' + this.appid + '&time=' + Math.floor(Date.now() / 1000) + '&source=' + base64.encode(JSON.stringify(source))

    var hmac = crypto.createHmac('sha1', this.appkey)
    hmac.update(query)
    return query + '&sign=' + hmac.digest('hex')
  }

  _request (url, postData, callback) {
    if (typeof postData === 'function') {
      callback = postData
      postData = null
    }

    if (typeof callback !== 'function') {
      throw new Error('Request must have a callback function')
    }

    var _callback = function (err, res, body) {
      if (err) {
        callback(err, null)
      } else if (res.statusCode !== 200) {
        callback('http status ' + res.statusCode, null)
      } else {
        try {
          var data = JSON.parse(body)
          callback(null, data)
        } catch (e) {
          callback(e, null)
        }
      }
    }

    if (postData) {
      request.post(url, { form: postData }, _callback)
    } else {
      request.get(url, _callback)
    }
  }

  getLoginUrl (redirUrl) {
    return this._getServer() + 'sso/login?' + this._getQuery(redirUrl)
  }

  callApi (api, source, postData, callback) {
    return this._request(this._getServer() + api + '?' + this._getQuery(source), postData, callback)
  }

  getUserInfo (token, callback) {
    return this.callApi('sso/getUserInfo/' + token, null, null, callback)
  }

  logout (token, callback) {
    return this.callApi('sso/logout/' + token, null, null, callback)
  }
}

module.exports = TwTSSO
