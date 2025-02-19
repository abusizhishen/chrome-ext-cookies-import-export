chrome.runtime.onMessage.addListener((message, sender, response) => {
  console.log("background received message", message)
  if (message.type === "dump_cookies") {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      let tab = tabs[0]
      const url = new URL(tab.url)
      console.log("url", url, "origin", url.origin)
      chrome.cookies.getAll({ url: tab.url }, (cookies) => {
        console.log("cookies", cookies)
        response({ url: url.host, cookies })
      })
    })
    return true
  }
})
