
let easeInOutQuad =
  x => ((x /= 0.5) < 1) ? 0.5 * Math.pow(x, 2) : -0.5 * ((x -= 2) * x - 2)

export default function animate (
  fromValue,
  toValue,
  applyValue,
  duration = 1000,
  ease = easeInOutQuad,
  finish = null
) {
  // choose a way to request animation frame
  let requestAnimationFrame =
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    (callback => setTimeout(callback, 1000 / 60))

  let startTime = new Date().getTime()

  function loop () {
    let now = new Date().getTime()
    let percent = (now - startTime) / duration

    if (percent < 1.0) {
      // apply intermediate value and request next frame
      percent = ease(percent)
      applyValue(fromValue * (1 - percent) + toValue * percent)
      requestAnimationFrame(loop)
    } else {
      // apply and value and finish
      applyValue(toValue)
      if (finish !== null) {
        finish()
      }
    }
  }

  // start animation
  loop()
}
