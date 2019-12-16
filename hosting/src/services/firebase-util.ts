import { getFunctionsLocalHost, isProduction } from '../utils/path'
const functions_region =
  process.env.HOSTING_REQUEST_FUNCTIONS_REGION || 'asia-northeast1'
const functions = firebase.app().functions(functions_region)

if (!isProduction()) {
  // ローカル環境でfunctions().httpsCallable()呼び出しがエラーにならないようにローカルIPとポートを設定する
  functions.useFunctionsEmulator(getFunctionsLocalHost())
}

const firebaseUtils = {
  function(
    functionName: string,
    data?: any
  ): Promise<firebase.functions.HttpsCallableResult> {
    return functions.httpsCallable(functionName)(data)
  }
}

export default firebaseUtils
