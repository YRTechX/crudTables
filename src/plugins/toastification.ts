import Toast, { PluginOptions, POSITION } from 'vue-toastification'

import 'vue-toastification/dist/index.css'

const options: PluginOptions = {
  position: POSITION.TOP_CENTER,
  newestOnTop: true,
  maxToasts: 5,
  transition: 'Vue-Toastification__slideBlurred',
  timeout: 3000,
  hideProgressBar: true,
  closeButton: 'button',
  icon: true,
  rtl: false,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: false,
  showCloseButtonOnHover: false,
}

export { Toast, options }
