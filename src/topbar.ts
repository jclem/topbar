/**
 * @license MIT
 * topbar 1.0.0, 2021-01-06
 * http://buunguyen.github.io/topbar
 * Copyright (c) 2021 Buu Nguyen
 */

const canvas: HTMLCanvasElement = document.createElement('canvas')

let delayTimerId: number | undefined = undefined
let progressTimerId: number | undefined = undefined
let fadeTimerId: number | undefined = undefined
let currentProgress = 0
let showing = false

type Opts = {
  autoRun: boolean
  barThickness: number
  barColors: Record<string, string>
  shadowBlur: number
  shadowColor: string
  className: string | null
}

let options: Opts = {
  autoRun: true,
  barThickness: 3,
  barColors: {
    '0': 'rgba(26,  188, 156, .9)',
    '.25': 'rgba(52,  152, 219, .9)',
    '.50': 'rgba(241, 196, 15,  .9)',
    '.75': 'rgba(230, 126, 34,  .9)',
    '1.0': 'rgba(211, 84,  0,   .9)'
  },
  shadowBlur: 10,
  shadowColor: 'rgba(0,   0,   0,   .6)',
  className: null
}

function repaint() {
  canvas.width = window.innerWidth
  canvas.height = options.barThickness * 5 // need space for shadow

  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  ctx.shadowBlur = options.shadowBlur
  ctx.shadowColor = options.shadowColor

  const lineGradient = Object.entries(options.barColors).reduce(
    (gradient, [stop, color]) => {
      gradient.addColorStop(parseFloat(stop), color)
      return gradient
    },
    ctx.createLinearGradient(0, 0, canvas.width, 0)
  )

  ctx.lineWidth = options.barThickness
  ctx.beginPath()
  ctx.moveTo(0, options.barThickness / 2)
  ctx.lineTo(
    Math.ceil(currentProgress * canvas.width),
    options.barThickness / 2
  )
  ctx.strokeStyle = lineGradient
  ctx.stroke()
}

function createCanvas() {
  const style = canvas.style
  style.position = 'fixed'
  style.top = style.left = style.right = style.margin = style.padding = '0'
  style.zIndex = '100001'
  style.display = 'none'
  if (options.className) canvas.classList.add(options.className)
  document.body.appendChild(canvas)
  window.addEventListener('resize', repaint)
}

export const topbar = {
  config(opts: Partial<Opts>) {
    Object.assign(options, opts)
  },

  show() {
    if (showing) return
    showing = true
    if (fadeTimerId != null) window.cancelAnimationFrame(fadeTimerId)
    if (!canvas) createCanvas()
    canvas.style.opacity = '1'
    canvas.style.display = 'block'
    topbar.progress(0)
    if (options.autoRun) {
      ;(function loop() {
        progressTimerId = window.requestAnimationFrame(loop)
        topbar.progress(
          '+' + 0.05 * Math.pow(1 - Math.sqrt(currentProgress), 2)
        )
      })()
    }
  },

  delayedShow(delay: number) {
    if (showing) return
    if (delayTimerId != null) return
    delayTimerId = setTimeout(() => topbar.show(), delay)
  },

  progress(to: number | string | undefined): number {
    if (typeof to === 'undefined') return currentProgress
    if (typeof to === 'string') {
      to =
        (to.indexOf('+') >= 0 || to.indexOf('-') >= 0 ? currentProgress : 0) +
        parseFloat(to)
    }
    currentProgress = to > 1 ? 1 : to
    repaint()
    return currentProgress
  },

  hide() {
    clearTimeout(delayTimerId)
    delayTimerId = undefined

    if (!showing) return
    showing = false
    if (progressTimerId != null) {
      window.cancelAnimationFrame(progressTimerId)
      progressTimerId = undefined
    }
    ;(function loop() {
      if (topbar.progress('+.1') >= 1) {
        canvas.style.opacity = String(parseFloat(canvas.style.opacity) - 0.05)

        if (parseFloat(canvas.style.opacity) <= 0.05) {
          canvas.style.display = 'none'
          fadeTimerId = undefined
          return
        }
      }
      fadeTimerId = window.requestAnimationFrame(loop)
    })()
  }
}
