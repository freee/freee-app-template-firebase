import { addMonths } from 'date-fns'
import { convertToTimeZone } from 'date-fns-timezone'
import * as functions from 'firebase-functions'
import freeeSDK from './freee_sdk/instance'
import { authApp } from './routes/auth'
import { FreeeAPI } from './services/freee-api'

const baseFunction = functions.region('asia-northeast1')

exports.api = baseFunction.https.onRequest(authApp)

exports.usersMe = baseFunction.https.onCall((data: any) => {
  return FreeeAPI.getUsersMe(data.userId)
})

exports.accountItems = baseFunction.https.onCall((data: any) => {
  return FreeeAPI.getAccountItems(data.userId, data.companyId)
})

exports.postDeal = baseFunction
  .runWith({ timeoutSeconds: 180 })
  .https.onCall((data: any) => {
    const { userId, companyId, params } = data
    return FreeeAPI.postDeal(userId, companyId, params)
  })

exports.keyRotation = baseFunction.pubsub
  .schedule('0 0 28 * *')
  .onRun(async () => {
    const now = convertToTimeZone(new Date(), { timeZone: 'Asia/Tokyo' })
    const nextMonth = addMonths(now, 1)
    await freeeSDK.auth().createCryptoKey(nextMonth)
  })
