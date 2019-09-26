export const DEFAULT_LOCAL_FUNCTIONS_HOST = 'http://localhost:5001'

export function getRedirectUrl() {
  const host = process.env.CLOUD_FUNCTION_HOST || getDefaultFunctionsHost()
  return host + '/api/auth/redirect'
}

function getDefaultFunctionsHost() {
  const projectId = (firebase.app().options as any).projectId
  const region = 'asia-northeast1'
  if (isProduction()) {
    return `https://${region}-${projectId}.cloudfunctions.net`
  } else {
    return `${getFunctionsLocalHost()}/${projectId}/${region}`
  }
}

export function getFunctionsLocalHost() {
  return process.env.CLOUD_FUNCTION_LOCAL_HOST
    ? process.env.CLOUD_FUNCTION_LOCAL_HOST
    : DEFAULT_LOCAL_FUNCTIONS_HOST
}

export function isProduction() {
  return process.env.NODE_ENV === 'production'
}
