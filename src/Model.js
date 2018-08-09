
import request from './request'

let instance = null

export default class Model {
  constructor () {
    this.delegates = []

    this.orders = []
    this.orderUpdateTime = 0

    this.initialFetch = true

    // fetch orders now and update every 5s
    this.fetchOrderUpdates()
    setInterval(() => this.fetchOrderUpdates(), 5000)
  }

  getOrders () {
    return this.orders
  }

  getDelegates () {
    return this.delegates
  }

  addDelegate (delegate) {
    if (this.delegates.indexOf(delegate) === -1) {
      this.delegates.push(delegate)
    }
    return this
  }

  fetchOrderUpdates () {
    request('/api/orders', {
      method: 'get',
      data: {
        update_time: this.orderUpdateTime
      }
    })
      .then(response => this.integrateOrders(response.data))
  }

  findOrder (id) {
    return this.orders.find(order => order.id === id)
  }

  integrateOrders (orders) {
    if (orders.length === 0) {
      // nothing to do
      return
    }

    // integrate orders
    let receivedNewOrder = false
    orders.forEach(newOrder => {
      let index = this.orders.findIndex(order => order.id === newOrder.id)
      if (index === -1) {
        // add order
        this.orders.push(newOrder)
        receivedNewOrder = true
      } else if (this.orders[index].updateTime < newOrder.updateTime) {
        // replace order
        this.orders.splice(index, 1, newOrder)
      }
    })

    // determine update time for next request
    this.orderUpdateTime = orders.reduce((updateTime, order) =>
      Math.max(updateTime, order.updateTime), this.orderUpdateTime)

    // sort orders by create time
    this.orders.sort((a, b) => b.createTime - a.createTime)

    // add items before field of each order
    let itemCount = 0
    for (let i = this.orders.length - 1; i >= 0; i--) {
      this.orders[i].itemsBefore = itemCount

      if (this.orders[i].completeTime === null) {
        this.orders[i].items.forEach(item => {
          itemCount += item.quantity
        })
      }
    }

    // notify delegates
    this.getDelegates().forEach(delegate =>
      delegate.modelDidReceiveUpdate && delegate.modelDidReceiveUpdate(this))

    if (!this.initialFetch && receivedNewOrder) {
      this.getDelegates().forEach(delegate =>
        delegate.modelDidReceiveNewOrder && delegate.modelDidReceiveNewOrder(this))
    }

    this.initialFetch = false
  }

  toggleOrderComplete (orderId) {
    let order = this.findOrder(orderId)

    // toggle complete time on record
    let complete = order.completeTime === null
    order.completeTime = complete ? true : null
    this.updateOrder(orderId, { complete })
  }

  updateOrder (orderId, data) {
    request(`/api/orders/${orderId}`, {
      method: 'put',
      body: JSON.stringify(data)
    })
  }

  static getInstance () {
    if (instance === null) {
      instance = new Model()
    }
    return instance
  }
}
