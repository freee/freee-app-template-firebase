/**
 * @fileoverview
 *
 * sdk instanceを複数作ると、内部でfirebaseのinstanceがあるためfirebaseの警告が出るので
 * 回避するためにinstanceをexportする
 */
import { FreeeServerSDK } from 'freee-firebase-sdk'
import * as functions from 'firebase-functions'

const env = functions.config().env
const config = require(`../config/config.${
  env && env.mode ? env.mode : 'local'
}.json`)

const serviceAccount = env.serviceaccountpath
  ? require(`../${env.serviceaccountpath}`) // 相対 path で指定する必要がある
  : null

const freeeSDK = new FreeeServerSDK(config, serviceAccount)

export default freeeSDK
