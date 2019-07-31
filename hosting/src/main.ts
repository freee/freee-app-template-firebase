import { parse } from 'querystring'
import deal from './data/deal.json'
import { FunctionAPI } from './services/function-api'
import { getRedirectUrl } from './utils/path'

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
  private companies: any[]

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
    const params = deal
    const dealResponse = await FunctionAPI.postDeal(userId, companyId, params)
    if (dealResponse) {
      alert('Succeed posting deal: \n\n' + JSON.stringify(dealResponse))
    } else {
      alert('Failed to post deal')
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
      })
      this.companiesSelectUl.appendChild(li)
    })
    this.setCompany(this.companies[0].id, this.companies[0].display_name)
    this.loadingContainer.style.display = 'none'
    this.mainContainer.style.display = 'block'
  }

  private setCompany(id: string, name: string) {
    this.currentCompanyId = id
    this.companiesSelect.classList.add('is-dirty')
    this.companiesSelectInput.value = name
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
