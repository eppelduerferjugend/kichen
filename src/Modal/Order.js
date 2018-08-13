
import Amount from '../Amount'
import Modal from '../Modal'
import request from '../request'

export default class OrderModal extends Modal {
  constructor ($element) {
    super($element)

    this.items = []

    // bind elements
    this.$items = $element.querySelector('.modal__items')
    this.$submit = $element.querySelector('.modal__submit')

    this.$waiterInput = $element.querySelector('[name="waiter"]')
    this.$tableInput = $element.querySelector('[name="table"]')
    this.$commentInput = $element.querySelector('[name="comment"]')

    // bind handlers
    this.$submit.addEventListener('click', this.didSubmit.bind(this))
    this.$waiterInput.addEventListener('input', evt => this.updateView())
    this.$tableInput.addEventListener('input', evt => this.updateView())
    this.$commentInput.addEventListener('input', evt => this.updateView())

    this.updateView()
  }

  setItems (items) {
    // clear items
    this.$items.innerHTML = ''

    this.items = items

    // create each item
    items
      .map(this.renderItem.bind(this))
      .forEach($item => this.$items.appendChild($item))

    this.updateView()

    return this
  }

  renderItem (item) {
    let $color = document.createElement('span')
    $color.classList.add('item__label-color')

    if (item.color) {
      $color.style.backgroundColor = item.color
    }

    let $label = document.createElement('h2')
    $label.classList.add('item__label')
    $label.innerText = item.name
    $label.appendChild($color)

    let $variations = document.createElement('ul')
    $variations.classList.add('item__variations')

    // append each variation
    item.items.forEach(variation => {
      let $label = document.createElement('h3')
      $label.classList.add('item__variation-label')
      $label.innerText = variation.name

      let amount = Amount.create()
      amount.setDelegate(this)
      let $amount = amount.getElement()
      $amount.classList.add('item__variation-amount')
      variation.amount = amount

      let $variation = document.createElement('li')
      $variation.classList.add('item__variation')
      $variation.appendChild($label)
      $variation.appendChild($amount)
      $variations.appendChild($variation)
    })

    let $item = document.createElement('li')
    $item.classList.add('item')
    $item.appendChild($label)
    $item.appendChild($variations)
    return $item
  }

  amountValueDidChange (amount, value) {
    this.updateView()
  }

  updateView () {
    let disabledMessage = null

    let itemCount =
      this.items.reduce((count, item) =>
        count + item.items.reduce((count, variation) =>
          count + variation.amount.getValue(), 0), 0)

    // check if order is valid
    if (itemCount === 0) {
      disabledMessage = `Näicht ausgewielt`
    } else if (!this.$waiterInput.value) {
      disabledMessage = `Kee Service Numm uginn`
    } else if (!this.$tableInput.value) {
      disabledMessage = `Keen Dësch uginn`
    }

    // update view
    if (disabledMessage === null) {
      this.$submit.classList.remove('btn--inactive')
      this.$submit.removeAttribute('disabled')
      this.$submit.innerText =
        itemCount === 1
          ? `1 Portioun bestellen`
          : `${itemCount} Portiounen bestellen`
    } else {
      this.$submit.classList.add('btn--inactive')
      this.$submit.setAttribute('disabled', 'disabled')
      this.$submit.innerText = disabledMessage
    }
  }

  didSubmit () {
    // collect ordered items
    let orderedItems = []

    this.items.forEach(item => {
      if (item.items) {
        item.items.forEach(item => {
          if (item.amount.getValue() > 0) {
            orderedItems.push({
              id: item.id,
              quantity: item.amount.getValue()
            })
          }
        })
      } else if (item.amount && item.amount.getValue() > 0) {
        orderedItems.push({
          id: item.id,
          quantity: item.amount.getValue()
        })
      }
    })

    // collect order data
    let waiter = this.$waiterInput.value
    let table = this.$tableInput.value.toUpperCase()
    let comment = this.$commentInput.value

    let order = {
      items: orderedItems,
      waiter: waiter,
      table: table,
      comment: comment || null
    }

    // verify order
    if (order.items.length === 0 || !order.waiter || !order.table) {
      this.alert('error',
        `D'Bestellung ass net komplett. Fëll déi néideg Felder aus.`)
      return
    }

    // show loading
    this.alert('loading', `D'Kichen gëtt kontaktéiert...`, null)

    request('/api/orders', {
      method: 'post',
      body: JSON.stringify(order)
    })
      .then(response => this.orderDidFinish(response.data))
      .catch(() => this.orderDidFail())
  }

  orderDidFinish (data) {
    // reset items
    this.setItems(this.items)

    // reset table, comment input field
    this.$tableInput.value = ''
    this.$commentInput.value = ''

    // show success alert
    let status = ''
    let order = data.order
    if (order.itemsBefore === 0) {
      status = `Se gëtt direkt als nächst beaarbescht.`
    } else if (order.itemsBefore === 1) {
      status = `Virun dëser ass nach eng aaner Portioun drun.`
    } else {
      status = `Virun dëser sinn nach ${order.itemsBefore} aaner ` +
               `Portioune drun.`
    }

    this.alert('success', `Bestellung № ${order.number} ass opginn. ${status}`)
  }

  orderDidFail () {
    // show error alert
    this.alert('error',
      `Hoppla! Do ass eppes schif gelaf. Kontrolléier deng ` +
      `Internet-Verbindung oder luet dës Websäit nei.`)
  }

  alertActionDidClick (alert) {
    if (alert.getType() === 'success') {
      this.close()
    } else {
      this.dismissAlert()
    }
  }
}
