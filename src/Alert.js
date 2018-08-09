
import Viewable from './Viewable'

export default class Alert extends Viewable {
  constructor ($element) {
    super($element)

    this.type = $element.dataset.type

    this.$btn = $element.querySelector('.alert__action')

    if (this.$btn) {
      this.$btn.addEventListener('click', () => {
        this.getDelegate() && this.getDelegate().alertActionDidClick(this)
      })
    }
  }

  getType () {
    return this.type
  }

  static create (type, message, action = 'Okay') {
    // create amount element
    let $alert = document.createElement('div')
    $alert.classList.add('alert')
    $alert.dataset.type = type

    let icon = 'check'

    if (type === 'loading') {
      $alert.classList.add('alert--loading')
      icon = 'settings'
    }

    if (type === 'error') {
      icon = 'error'
    }

    let actionBtn = ''
    if (action) {
      actionBtn = `<button class="alert__action btn">${action}</button>`
    }

    $alert.innerHTML = `
      <div class="alert__content">
        <div class="alert__icon">
          <i class="material-icons">${icon}</i>
        </div>
        <div class="alert__message">${message}</div>
        ${actionBtn}
      </div>
    `

    return new Alert($alert)
  }
}
