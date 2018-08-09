
import animate from './animate'
import Model from './Model'
import Viewable from './Viewable'

export default class Display extends Viewable {
  constructor ($element) {
    super($element)
    this.selectedIndex = 0

    // bind elements
    this.$orders = $element.querySelector('.display__orders')
    this.$notificationAudio = $element.querySelector('.display__audio-notification')
    this.orderElements = []

    // add self as delegate to model
    window.addEventListener('keydown', this.keyDidPress.bind(this))
    Model.getInstance().addDelegate(this)
  }

  getOrders () {
    return Model.getInstance().getOrders().slice().reverse()
  }

  modelDidReceiveUpdate (model) {
    // clear orders
    this.$orders.innerHTML = ''

    // build each order
    this.orderElements = this.getOrders()
      .map((order, index) => this.renderOrder(order, index))

    this.orderElements.forEach($order => this.$orders.appendChild($order))

    this.selectedIndex =
      Math.min(this.selectedIndex, this.orderElements.length - 1)
  }

  modelDidReceiveNewOrder (model) {
    // play notification sound
    this.$notificationAudio.play()
  }

  renderOrder (order, index) {
    let $header = document.createElement('header')
    $header.classList.add('display__order-header')
    $header.innerHTML =
      `<div class="display__order-table">${order.table}</div>` +
      `<div class="display__order-waiter">${order.waiter}</div>` +
      `<div class="display__order-time">${this.formatTime(order.createTime)}</div>`

    let $items = document.createElement('ul')
    $items.classList.add('display__order-items')

    order.items.forEach(item => {
      let $quantity = document.createElement('span')
      $quantity.classList.add('display__item-quantity')
      $quantity.innerText = item.quantity

      let $name = document.createElement('span')
      $name.classList.add('display__item-name')
      $name.innerText =
        (item.parent ? item.parent.shortName + ' ' : '') +
        item.shortName

      if (item.color) {
        $name.style.backgroundColor = item.color
      }

      let $item = document.createElement('li')
      $item.classList.add('display__item')
      $item.appendChild($quantity)
      $item.appendChild($name)

      $items.appendChild($item)
    })

    let $comment = null
    if (order.comment) {
      $comment = document.createElement('p')
      $comment.classList.add('display__order-comment')
      $comment.innerText = order.comment
    }

    let $detail = document.createElement('div')
    $detail.classList.add('display__order-detail')
    $detail.appendChild($items)
    $comment && $detail.appendChild($comment)

    let $order = document.createElement('li')
    $order.classList.add('display__order')

    if (index === this.selectedIndex) {
      $order.classList.add('display__order--selected')
    }

    if (order.completeTime) {
      $order.classList.add('display__order--complete')
    }

    $order.appendChild($header)
    $order.appendChild($detail)
    return $order
  }

  setSelectedIndex (index) {
    if (this.selectedIndex !== index) {
      this.orderElements[this.selectedIndex].classList.remove('display__order--selected')
      this.selectedIndex = index

      // scroll to order element
      let $order = this.orderElements[index]
      $order.classList.add('display__order--selected')
      let rect = $order.getBoundingClientRect()
      let sourceScroll = this.$orders.scrollTop
      let targetScroll = rect.top + sourceScroll
      let height = window.innerHeight
      animate(sourceScroll, targetScroll - height * 0.33, y => { this.$orders.scrollTop = y }, 300)
    }
  }

  toggleOrderComplete () {
    let orders = this.getOrders()
    let order = orders[this.selectedIndex]
    let $order = this.orderElements[this.selectedIndex]

    if (order) {
      Model.getInstance().toggleOrderComplete(order.id)
      $order.classList.toggle('display__order--complete')
    }
  }

  keyDidPress (evt) {
    switch (evt.charCode || evt.keyCode) {
      case 38:
        // up arrow
        this.setSelectedIndex(
          Math.max(this.selectedIndex - 1, 0))
        evt.preventDefault()
        break
      case 40:
        // down arrow
        this.setSelectedIndex(
          Math.min(this.selectedIndex + 1, this.orderElements.length - 1))
        evt.preventDefault()
        break
      case 32:
        // space key
        this.toggleOrderComplete()
        evt.preventDefault()
        break
    }
  }

  formatTime (timestamp) {
    let date = new Date()
    date.setTime(timestamp * 1000)
    return ('00' + date.getHours()).substr(-2) + ':' +
      ('00' + date.getMinutes()).substr(-2)
  }
}
