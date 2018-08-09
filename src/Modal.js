
import Alert from './Alert'
import Viewable from './Viewable'

export default class Modal extends Viewable {
  constructor ($element) {
    super($element)

    this._alert = null

    // bind elements
    this.$dialog = $element.querySelector('.modal__dialog')
    this.$content = $element.querySelector('.modal__content')
    this.$menuBtn = $element.querySelector('.modal__btn-menu')
    this.$closeBtn = $element.querySelector('.modal__btn-close')

    // bind handlers
    if (this.$closeBtn) {
      this.$closeBtn.addEventListener('click', this.closeBtnDidClick.bind(this))
    }
  }

  open () {
    this.$content.scrollTop = 0
    this.$element.classList.remove('modal--hidden')

    // focus scrollable content
    this.$content.focus()
  }

  close () {
    this.$element.classList.add('modal--hidden')

    if (this._alert !== null) {
      setTimeout(this.dismissAlert.bind(this), 500)
    }

    // notify delegate
    if (this.getDelegate() && this.getDelegate().modalDidClose !== undefined) {
      this.getDelegate().modalDidClose(this)
    }
  }

  alert (type, message, action = 'Okay') {
    this.dismissAlert()

    // add element to dom
    let alert = Alert.create(type, message, action)
    this.$dialog.appendChild(alert.getElement())
    alert.setDelegate(this)
    this._alert = alert

    if (this.$menuBtn) {
      this.$menuBtn.classList.add('modal__btn-menu--hidden')
    }
  }

  dismissAlert () {
    if (this._alert !== null) {
      this.$dialog.removeChild(this._alert.getElement())
      this._alert.setDelegate(null)
      this._alert = null

      if (this.$menuBtn) {
        this.$menuBtn.classList.remove('modal__btn-menu--hidden')
      }
    }
  }

  alertActionDidClick (alert) {
    this.dismissAlert()
  }

  closeBtnDidClick (evt) {
    this.close()
    evt.preventDefault()
    return false
  }
}
