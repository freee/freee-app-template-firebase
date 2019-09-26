/**
 * @fileoverview
 *
 * sdk instanceを複数作ると、内部でfirebaseのinstanceがあるためfirebaseの警告が出るので
 * 回避するためにinstanceをexportする
 */
import { FreeeServerSDK } from '@freee-api/firebase-sdk'
import * as functions from 'firebase-functions'

const env = functions.config().env

// TODO if you want to use custom config, please write code like below
//
// const config = require(`../config/config.${
//   env && env.mode ? env.mode : 'local'
// }.json`)
const config = {}

// Set path information from src directory to service account file
// ex) "env.serviceaccountpath": "config/service-account.json"
const serviceAccount = env.serviceaccountpath
  ? require(`../${env.serviceaccountpath}`) // 相対パスじゃないと読み込めない
  : null

const freeeSDK = new FreeeServerSDK(config, serviceAccount)

export default freeeSDK
