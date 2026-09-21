const cache = new Map()

export function preloadImage(url) {
  if (!url) return Promise.resolve(false)
  if (cache.has(url)) return cache.get(url)

  const promise = new Promise((resolve) => {
    const image = new Image()
    let finished = false

    const finish = (loaded) => {
      if (finished) return
      finished = true
      if (!loaded || !image.naturalWidth) {
        resolve(false)
        return
      }
      if (typeof image.decode === 'function') {
        image.decode().then(() => resolve(true)).catch(() => resolve(true))
      } else {
        resolve(true)
      }
    }

    image.onload = () => finish(true)
    image.onerror = () => finish(false)
    image.src = url
    if (image.complete) finish(image.naturalWidth > 0)
  })

  cache.set(url, promise)
  promise.then((loaded) => {
    if (!loaded) cache.delete(url)
  })
  return promise
}
