
import { detect } from 'detect-browser'

import AppModal from './Modal/App'
import Display from './Display'

// add browser class to html tag, makes browser sass mixin work
const browser = detect()
if (browser) {
  const $html = document.querySelector('html')
  $html.classList.add(`browser--${browser.name}-${browser.version}`)
}

// initialize app modal
let $appModal = document.querySelector('.modal-app')
if ($appModal) {
  let appModal = new AppModal($appModal)
  appModal.setDelegate(null)
}

// initialize display
let $display = document.querySelector('.display')
if ($display) {
  let display = new Display($display)
  display.setDelegate(null)
}
