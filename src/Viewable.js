
export default class Viewable {
  constructor ($element) {
    this.$element = $element
    this.delegate = null
  }

  getElement () {
    return this.$element
  }

  getDelegate () {
    return this.delegate
  }

  setDelegate (delegate) {
    this.delegate = delegate
    return this
  }
}
