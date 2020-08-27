import freeeSDK from '../freee_sdk/instance'

const api = freeeSDK.api()

export interface UsersMe {
  user: UserItem
}

export interface UserItem {
  id: number
  email: string
  display_name: string
  first_name: string
  last_name: string
  first_name_kana: string
  last_name_kana: string
  companies: UserItemCompany[]
}

export interface UserItemCompany {
  id: number
  display_name: string
  role: string
  use_custom_role: boolean
}

export interface AccountItems {
  account_items: AccountItem[]
}

export interface AccountItem {
  id: number
  name: string
  shortcut: string
  shortcut_num: string
  default_tax_id: number
  categories: string[]
}

// TODO FIx complete fields
export interface Deal {
  company_id: number
  user_id: number
  issue_date: string
  due_date: string
  amount: number
  due_amount: number
  type: 'income' | 'expense'
  partner_id: number
  ref_number: string
  details: Detail[]
}

export interface DealResponse {
  deal: Deal
}

export interface Detail {
  id: number // TODO add fields
}

class FreeeApi {
  /**
   * GET /users/me
   */
  getUsersMe(userId: string): Promise<UsersMe> {
    return api
      .get<UsersMe>('api/1/users/me', { companies: true }, userId)
      .then(response => response.data)
  }

  /**
   * GET /account_items
   */
  getAccountItems(userId: string, companyId: string): Promise<AccountItems> {
    return api
      .get<AccountItems>(
        'api/1/account_items',
        { company_id: companyId },
        userId
      )
      .then(response => response.data)
  }

  /**
   * POST /deals
   */
  async postDeal(
    userId: string,
    companyId: string,
    params: any
  ): Promise<DealResponse> {
    return this.post<DealResponse>(userId, companyId, 'api/1/deals', params)
  }

  private post<T = any>(
    userId: string,
    companyId: string,
    path: string,
    params: { [key: string]: any }
  ): Promise<T> {
    const requestParams = {
      ...params,
      company_id: parseInt(companyId, 10)
    }
    console.log('post requestParams:', requestParams)
    return api
      .post<T>(path, requestParams, userId)
      .then(response => response.data)
      .catch(error => {
        console.error(`Error occured for posting ${path}:`, error.response)
        return error.response.data // TODO return proper response
      })
  }
}

export const FreeeAPI = new FreeeApi()
