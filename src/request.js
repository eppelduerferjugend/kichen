
const defaultOptions = {
  method: 'GET',
  headers: {},
  contentType: 'application/json; charset=utf-8',
  data: null,
  body: ''
}

export default function request (url, options = {}) {
  // apply default options
  options = Object.assign({}, defaultOptions, options)

  // prepare request body
  let requestMethod = options.method.toUpperCase()
  let requestBody = options.body
  let requestHeaders = options.headers
  let requestContentType = options.contentType

  if (options.data !== null) {
    // generate query string from data
    requestBody = encodeQueryString(options.data)

    if (requestMethod === 'GET') {
      // append query string to url
      url = appendQueryStringToUrl(url, requestBody)
      requestBody = ''
    }
  }

  // initialize request
  let xhr = new window.XMLHttpRequest()
  xhr.open(requestMethod, url)

  // set headers
  requestHeaders['Content-Type'] = requestContentType

  for (let name in requestHeaders) {
    xhr.setRequestHeader(name, requestHeaders[name])
  }

  let promise = new Promise((resolve, reject) => {
    xhr.onreadystatechange = () => {
      // is request complete
      if (xhr.readyState === 4) {
        let status = xhr.status
        let body = xhr.responseText
        let data = body

        // parse json if content type is set
        let contentType = xhr.getResponseHeader('Content-Type')
        if (contentType.indexOf('application/json') !== -1) {
          data = JSON.parse(body)
        }

        // compose response object
        let response = {
          status,
          body,
          data,
          contentType,
          xhr
        }

        // resolve or reject promise
        if (status !== 200) {
          reject(response)
        } else {
          resolve(response)
        }
      }
    }
  })

  xhr.send(requestBody)

  return promise
}

function encodeQueryString (data) {
  let parts = []
  for (let name in data) {
    parts.push(encodeURIComponent(name) + '=' + encodeURIComponent(data[name]))
  }
  return parts.join('&')
}

function appendQueryStringToUrl (url, query) {
  if (url.indexOf('?') === -1) {
    return url + '?' + query
  } else {
    return url + '&' + query
  }
}
