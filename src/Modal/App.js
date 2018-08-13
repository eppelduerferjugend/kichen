
import Modal from '../Modal'
import Model from '../Model'
import OrderModal from './Order'
import request from '../request'

export default class AppModal extends Modal {
  constructor ($element) {
    super($element)

    // bind elements
    this.$orders = $element.querySelector('.modal-app__orders')
    this.$orderBtn = $element.querySelector('.modal-app__btn-order')

    // initialize order modal
    this.$orderModal = document.querySelector('.modal-order')
    this.orderModal = new OrderModal(this.$orderModal)
    this.orderModal.setDelegate(this)

    // bind handlers
    this.$orderBtn.addEventListener('click', this.orderDidClick.bind(this))

    // retrieve items
    request('/api/items', {
      method: 'get'
    })
      .then(response => this.orderModal.setItems(response.data))
      .catch(() =>
        this.alert('error',
          `Fehler beim Lueden vunn Daten. Iwwerpréif deng ` +
          `Internet-Verbindung an lued dës Säit nei.`,
          null))

    // add self as delegate to model
    Model.getInstance().addDelegate(this)
  }

  modelDidReceiveUpdate (model) {
    // clear orders
    this.$orders.innerHTML = ''

    // build each order
    Model.getInstance().getOrders().forEach(order =>
      this.$orders.appendChild(this.renderOrder(order)))
  }

  renderOrder (order) {
    let $items = document.createElement('ul')
    $items.classList.add('orders__items')

    order.items.forEach(item => {
      let $item = document.createElement('li')
      $item.classList.add('orders__item')
      $item.innerHTML =
        `<span class="orders__item-color" ` +
        `${item.color ? `style="background-color: ${item.color};"` : ``}></span>` +
        `<span class="orders__item-quantity">${item.quantity}</span> ` +
        `<span class="orders__item-parent">${item.parent.name}</span> ` +
        `<span class="orders__item-name">${item.name}</span>`
      $items.appendChild($item)
    })

    let status = ''
    if (order.completeTime === null) {
      if (order.itemsBefore === 0) {
        status = `<i class="material-icons">autorenew</i> gëtt beaarbecht`
      } else {
        status =
          `<i class="material-icons">access_time</i> ` +
          `nach ${order.itemsBefore} virdrun`
      }
    } else {
      status =
        `<i class="material-icons">check</i> ` +
        `um ${this.formatTime(order.completeTime)} rausgaang`
    }

    let $title = document.createElement('div')
    $title.classList.add('orders__title')
    $title.innerHTML =
      `<span class="orders__number">№ ${order.number}</span> ` +
      `<span class="orders__table">${order.table}</span> ` +
      `<span class="orders__status">${status}</span>`

    let $detail = document.createElement('div')
    $detail.classList.add('orders__detail')
    $detail.innerHTML =
      `<span class="orders__time">${this.formatTime(order.createTime)}</span> ` +
      `<span class="orders__waiter">${order.waiter}</span>`

    if (order.comment) {
      let $comment = document.createElement('span')
      $comment.classList.add('orders__comment')
      $comment.innerText = order.comment
      $detail.appendChild($comment)
    }

    let $order = document.createElement('li')
    $order.classList.add('orders__order')

    if (order.completeTime) {
      $order.classList.add('orders__order--complete')
    }

    $order.appendChild($title)
    $order.appendChild($detail)
    $order.appendChild($items)
    return $order
  }

  orderDidClick (evt) {
    this.orderModal.open()
    evt.preventDefault()
    return false
  }

  modalDidClose (modal) {
    // focus scrollable content
    this.$content.focus()
  }

  formatTime (timestamp) {
    let date = new Date()
    date.setTime(timestamp * 1000)
    return ('00' + date.getHours()).substr(-2) + ':' +
      ('00' + date.getMinutes()).substr(-2)
  }
}
