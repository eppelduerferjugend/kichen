
import Viewable from './Viewable'

export default class Amount extends Viewable {
  constructor ($element) {
    super($element)

    this.value = 0

    // bind elements
    this.$value = $element.querySelector('.amount__value')
    this.$btnRemove = $element.querySelector('.amount__btn-remove')
    this.$btnAdd = $element.querySelector('.amount__btn-add')

    // bind handlers
    this.$btnRemove.addEventListener('click', this.onBtnRemoveClick.bind(this))
    this.$btnAdd.addEventListener('click', this.onBtnAddClick.bind(this))

    // initial view update
    this.updateView()
  }

  onBtnRemoveClick (evt) {
    this.setValue(this.getValue() - 1)

    evt.preventDefault()
    return false
  }

  onBtnAddClick (evt) {
    this.setValue(this.getValue() + 1)

    evt.preventDefault()
    return false
  }

  getValue () {
    return this.value
  }

  setValue (value) {
    // check bounds
    value = Math.max(value, 0)

    if (this.value !== value) {
      this.value = value
      this.updateView()
      this.delegate && this.delegate.amountValueDidChange(this, value)
    }
  }

  updateView () {
    this.$value.innerText = this.value

    if (this.value === 0) {
      this.$element.classList.remove('amount--selected')
    } else {
      this.$element.classList.add('amount--selected')
    }

    return this
  }

  static create () {
    // create amount element
    let $amount = document.createElement('div')
    $amount.classList.add('amount')

    $amount.innerHTML = `
      <a class="amount__btn-remove" href="#">
        <i class="material-icons">remove</i>
      </a>
      <span class="amount__value">0</span>
      <a class="amount__btn-add" href="#">
        <i class="material-icons">add</i>
      </a>
    `

    return new Amount($amount)
  }
}
