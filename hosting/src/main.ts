import { parse } from 'querystring'
import { FunctionAPI } from './services/function-api'
import { getRedirectUrl } from './utils/path'
// tslint:disable-next-line:no-import-side-effect
import './main.css'

class Demo {
  private lastUid: string
  private currentCompanyId: string
  private loadingContainer: HTMLElement
  private mainContainer: HTMLElement
  private nameContainer: HTMLElement
  private uidContainer: HTMLElement
  private signOutButton: HTMLElement
  private postDealButton: HTMLElement
  private companiesSelectItems: HTMLCollectionOf<Element>
  private companiesSelectInput: HTMLInputElement
  private companiesSelect: HTMLElement
  private companiesSelectUl: HTMLElement

  private currentType: string
  private typesSelectItems: HTMLCollectionOf<Element>
  private typesSelectInput: HTMLInputElement
  private typesSelect: HTMLElement
  private typesSelectUl: HTMLElement

  private currentAccountItemIndex: string
  private accountItemsSelectItems: HTMLCollectionOf<Element>
  private accountItemsSelectInput: HTMLInputElement
  private accountItemsSelect: HTMLElement
  private accountItemsSelectUl: HTMLElement

  private amountInput: HTMLElement
  private amountInputSection: HTMLInputElement

  private companies: any[]
  private accountItems: any[]
  private types: any[] = [
    { id: 'income', name: '収入' },
    { id: 'expense', name: '支出' }
  ]

  constructor() {
    window.addEventListener('DOMContentLoaded', async () => {
      // Shortcuts to DOM Elements.
      this.initialize()
      // Bind events.
      this.bindEvents()
      // login
      await this.handleLogin()
    })
  }

  private initialize() {
    this.lastUid = ''
    this.loadingContainer = document.getElementById('loading-container')!
    this.mainContainer = document.getElementById('main-container')!
    this.nameContainer = document.getElementById('demo-name-container')!
    this.uidContainer = document.getElementById('demo-uid-container')!
    this.signOutButton = document.getElementById('demo-sign-out-button')!
    this.postDealButton = document.getElementById('demo-post-deal-button')!
    this.companiesSelectItems = document.getElementsByClassName(
      'mdl-menu__item'
    )
    this.companiesSelectInput = document.getElementById(
      'select-section'
    )! as HTMLInputElement
    this.companiesSelect = document.getElementById('companies-select')!
    this.companiesSelectUl = document.getElementById('companies-select-ul')!

    this.typesSelectInput = document.getElementById(
      'types-select-section'
    )! as HTMLInputElement
    this.typesSelect = document.getElementById('types-select')!
    this.typesSelectUl = document.getElementById('types-select-ul')!

    this.accountItemsSelectInput = document.getElementById(
      'account_items-select-section'
    )! as HTMLInputElement
    this.accountItemsSelect = document.getElementById('account_items-select')!
    this.accountItemsSelectUl = document.getElementById(
      'account_items-select-ul'
    )!

    this.amountInput = document.getElementById('amount-input')!
    this.amountInputSection = document.getElementById(
      'amount-input-section'
    )! as HTMLInputElement
  }

  private bindEvents() {
    this.signOutButton.addEventListener(
      'click',
      this.onSignOutButtonClick.bind(this)
    )
    this.postDealButton.addEventListener(
      'click',
      this.onPostDealButtonClick.bind(this)
    )
  }

  private async onAuthStateChanged(user: firebase.User) {
    // Skip token refresh.
    if (user && user.uid === this.lastUid) return

    if (user) {
      this.login(user)
    } else {
      if (!isLogin()) {
        location.href = getRedirectUrl()
      }
    }
  }

  private onSignOutButtonClick() {
    sessionStorage.removeItem('loginStatus')
    firebase.auth().signOut()
  }

  private async onPostDealButtonClick() {
    const companyId = this.currentCompanyId
    const userId = firebase.auth().currentUser!.uid
    const issue_date = new Date()
    const issue_date_month = ('0' + (issue_date.getMonth() + 1)).slice(-2)
    const issue_date_day = ('0' + issue_date.getDate()).slice(-2)
    const issue_date_str =
      issue_date.getFullYear() + '-' + issue_date_month + '-' + issue_date_day
    const accountItem = this.accountItems[
      parseInt(this.currentAccountItemIndex, 10)
    ]
    const deal = {
      issue_date: issue_date_str,
      type: this.currentType,
      details: [
        {
          account_item_id: accountItem.id,
          tax_code: accountItem.default_tax_code,
          amount: this.getAmountValue(),
          description: '取引サンプル登録'
        }
      ]
    }
    const params = deal
    const dealResponse = await FunctionAPI.postDeal(userId, companyId, params)
    if (dealResponse.deal) {
      alert('Succeed posting deal: \n\n' + JSON.stringify(dealResponse))
    } else {
      alert('Failed to post deal: \n\n' + JSON.stringify(dealResponse))
    }
  }

  private async login(user: firebase.User) {
    this.lastUid = user.uid
    this.nameContainer.innerText = user.displayName!
    this.uidContainer.innerText = user.uid
    sessionStorage.setItem('loginStatus', 'true')
    console.log('login by user:', user.uid)
    this.companies = await FunctionAPI.loadCompanies(user.uid)
    console.log("User's companies:", this.companies)
    this.companies.forEach(company => {
      const li = document.createElement('LI') // Create a <li> node
      li.appendChild(document.createTextNode(company.display_name))
      li.setAttribute('company-id', company.id)
      li.classList.add('mdl-menu__item', 'mdl-js-ripple-effect')
      li.addEventListener('click', (e: MouseEvent) => {
        const id = (e.currentTarget as HTMLLIElement).getAttribute(
          'company-id'
        )!
        const name = (e.currentTarget as HTMLLIElement).innerText
        this.setCompany(id, name)
        this.initAccountItems(user)
      })
      this.companiesSelectUl.appendChild(li)
    })
    this.initTypes()
    this.setCompany(this.companies[0].id, this.companies[0].display_name)
    this.initAccountItems(user)
    this.setAmount('1')
    this.loadingContainer.style.display = 'none'
    this.mainContainer.style.display = 'block'
  }

  private setCompany(id: string, name: string) {
    this.currentCompanyId = id
    this.companiesSelect.classList.add('is-dirty')
    this.companiesSelectInput.value = name
  }

  private initTypes() {
    console.log('types:', this.types)
    this.types.forEach(type => {
      const li = document.createElement('LI') // Create a <li> node
      li.appendChild(document.createTextNode(type.name))
      li.setAttribute('type-id', type.id)
      li.classList.add('mdl-menu__item', 'mdl-js-ripple-effect')
      li.addEventListener('click', (e: MouseEvent) => {
        const id = (e.currentTarget as HTMLLIElement).getAttribute('type-id')!
        const name = (e.currentTarget as HTMLLIElement).innerText
        this.setType(id, name)
      })
      this.typesSelectUl.appendChild(li)
    })
    this.setType(this.types[0].id, this.types[0].name)
  }

  private async initAccountItems(user: firebase.User) {
    const accountItemsInlucedWalletable = await FunctionAPI.getAccountItems(
      user.uid,
      this.currentCompanyId
    )
    this.accountItems = accountItemsInlucedWalletable.filter(
      accountItem => accountItem.walletable_id === null
    )
    console.log('accountItems:', this.accountItems)

    this.accountItems.forEach((accountItem, index) => {
      const li = document.createElement('LI') // Create a <li> node
      li.appendChild(document.createTextNode(accountItem.name))
      li.setAttribute('account-item-index', index.toString(10))
      li.classList.add('mdl-menu__item', 'mdl-js-ripple-effect')
      li.addEventListener('click', (e: MouseEvent) => {
        const accountItemIndex = (e.currentTarget as HTMLLIElement).getAttribute(
          'account-item-index'
        )!
        const name = (e.currentTarget as HTMLLIElement).innerText
        this.setAccoutItem(accountItemIndex, name)
      })
      this.accountItemsSelectUl.appendChild(li)
    })
    this.setAccoutItem('0', this.accountItems[0].name)
  }

  private setType(type: string, name: string) {
    this.currentType = type
    this.typesSelect.classList.add('is-dirty')
    this.typesSelectInput.value = name
  }

  private setAccoutItem(index: string, name: string) {
    this.currentAccountItemIndex = index
    this.accountItemsSelect.classList.add('is-dirty')
    this.accountItemsSelectInput.value = name
  }

  private setAmount(amount: string) {
    this.amountInputSection.value = amount
    this.amountInput.classList.add('is-dirty')
  }

  private getAmountValue() {
    if (this.amountInputSection.value) {
      return parseInt(this.amountInputSection.value, 10)
    }
    return 0
  }

  private async handleLogin() {
    const params = parse(window.location.search.replace(/^.*\?/, ''))
    const token = params.token as string
    // hide token param for bookmark
    window.history.replaceState({}, '', '/home')
    if (token) {
      sessionStorage.setItem('loginStatus', 'true')
      try {
        const userCr = await firebase.auth().signInWithCustomToken(token)
        this.login(userCr.user!)
      } catch (error) {
        console.error('Error occured on login process:', error)
        sessionStorage.removeItem('loginStatus')
        location.href = getRedirectUrl()
      }
    }

    firebase.auth().onAuthStateChanged(this.onAuthStateChanged.bind(this))
  }
}

function isLogin() {
  return sessionStorage.getItem('loginStatus')
}

// Load the demo.
new Demo()
