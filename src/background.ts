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
  } else if (message.type === "import_cookies") {
    const { url, cookies } = message.data

    // 批量导入cookies
    const importPromises = cookies.map((cookie) => {
      return new Promise((resolve, reject) => {
        // 构建cookie详情对象
        const cookieDetails = {
          url: url.startsWith("http") ? url : `https://${url}`,
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain || "",
          path: cookie.path || "/",
          secure: cookie.secure || false,
          httpOnly: cookie.httpOnly || false,
          sameSite: cookie.sameSite || "lax"
        }

        console.log("cookies", cookieDetails)

        // if (url) {
        //   cookieDetails.url = url.startsWith("http") ? url : `https://${url}`
        // }

        // 如果有过期时间
        if (cookie.expirationDate) {
          cookieDetails.expirationDate = cookie.expirationDate
        }

        chrome.cookies.set(cookieDetails, (result) => {
          if (chrome.runtime.lastError) {
            console.error("cookie  error", chrome.runtime.lastError, result)
            reject(chrome.runtime.lastError)
          } else {
            resolve(result)
          }
        })
      })
    })

    Promise.all(importPromises)
      .then(() => {
        response({
          success: true,
          message: `成功导入 ${cookies.length} 个cookies`
        })
      })
      .catch((error) => {
        response({ success: false, message: `导入失败: ${error.message}` })
      })

    return true // 保持消息通道开放
  }
})
