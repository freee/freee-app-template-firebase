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

// exports.getUsersMeWithContentType = baseFunction.https.onCall((data: any) => {
//   return FreeeAPI.getUsersMeWithContentType(data.userId, 'application/json')
// })

exports.accountItems = baseFunction.https.onCall((data: any) => {
  return FreeeAPI.getAccountItems(data.userId, data.companyId)
})

exports.getDeal = baseFunction.https.onCall((data: any) => {
  return FreeeAPI.getDeal(data.userId, data.companyId, data.id)
})

exports.postDeal = baseFunction
  .runWith({ timeoutSeconds: 180 })
  .https.onCall((data: any) => {
    const { userId, companyId, params } = data
    return FreeeAPI.postDeal(userId, companyId, params)
  })

exports.putDeal = baseFunction
  .runWith({ timeoutSeconds: 180 })
  .https.onCall((data: any) => {
    const { userId, companyId, id, params } = data
    return FreeeAPI.putDeal(userId, companyId, id, params)
  })

exports.deleteDeal = baseFunction.https.onCall((data: any) => {
  return FreeeAPI.deleteDeal(data.userId, data.companyId, data.id)
})

exports.postReceipt = baseFunction
  .runWith({ timeoutSeconds: 180 })
  .https.onCall((data: any) => {
    const { userId, companyId } = data
    const formData = new FormData()
    const content = 'test'
    const receipt = new Blob([content], { type: 'text/csv' })

    formData.append('receipt', receipt)
    formData.append('company_id', companyId)
    return FreeeAPI.postReceipt(userId, companyId, formData)
  })

exports.keyRotation = baseFunction.pubsub
  .schedule('0 0 28 * *')
  .onRun(async () => {
    const now = convertToTimeZone(new Date(), { timeZone: 'Asia/Tokyo' })
    const nextMonth = addMonths(now, 1)
    await freeeSDK.auth().createCryptoKey(nextMonth)
  })
