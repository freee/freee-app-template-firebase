import * as express from 'express'
import freeeSDK from '../freee_sdk/instance'

const authApp = express()
const bodyParser = require('body-parser')
authApp.use(bodyParser.urlencoded({ extended: true }))
authApp.use(bodyParser.json())
authApp.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  )
  next()
})

const authRouter = express.Router()

const auth = freeeSDK.auth()

// Authorize
authRouter.get(auth.getRedirectPath(), (req, res) => {
  console.log('Redirect is called')
  auth.redirect(res)
})

// Get token, login firebase and save token to firebase
authRouter.get(auth.getCallbackPath(), (req, res) => {
  console.log('Callback is called')
  auth.callback(req.query.code, res)
})

authApp.use('/auth', authRouter)

export { authApp }
