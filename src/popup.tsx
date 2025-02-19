// import 'bootstrap/dist/css/bootstrap.min.css';
import { DownloadOutlined } from "@ant-design/icons"
import { Button, Divider, Flex, message, Radio, Table } from "antd"
import type { SizeType } from "antd/es/config-provider/SizeContext"
import React, { useEffect, useState } from "react"

import "tailwindcss/base.css"

import { width } from "dom-helpers"

// dumpCookies 获取数据，并将其传递给父组件
function dumpCookies(setData) {
  chrome.runtime.sendMessage({ type: "dump_cookies" }, (response) => {
    // 假设 response 中包含了 cookies 数据
    console.log("response", response)
    setData(response) // 将获取到的 cookies 数据更新到 state
  })
}

function IndexPopup() {
  const [data, setData] = useState({ url: { host: "" }, cookies: [] })

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Domain", dataIndex: "domain", key: "domain" },
    { title: "Path", dataIndex: "path", key: "path" },
    {
      title: "Expiry",
      dataIndex: "expiry",
      key: "expiry",
      render: (text) =>
        text ? new Date(text * 1000).toLocaleString() : "Session"
    },
    { title: "Value", dataIndex: "value", key: "value" }
  ]

  // 在页面加载时自动调用 dumpCookies 获取数据
  useEffect(() => {
    dumpCookies(setData) // 页面加载时调用 dumpCookies
  }, []) // 空数组作为依赖，意味着只在组件加载时调用一次

  const [size, setSize] = useState<SizeType>("middle") // default is 'middle'

  const download = (blob, ext = "txt") => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `cookies_${data.url.host}_${new Date().valueOf()}.${ext}`
    link.click()
    URL.revokeObjectURL(url) // Clean up
  }
  // Function to download as .txt
  const downloadAsTxt = () => {
    const textContent = data.cookies
      .map((item) => `${item.name}=${item.value}`)
      .join("; ")
    const blob = new Blob([textContent], { type: "text/plain" })
    download(blob, "txt")
  }

  // Function to download as .json
  const downloadAsJson = () => {
    const blob = new Blob([JSON.stringify(data.cookies, null, 2)], {
      type: "application/json"
    })
    download(blob, "json")
  }

  const downloadAsCsv = () => {
    let headers =
      [
        "domain",
        "hostOnly",
        "httpOnly",
        "path",
        "sameSite",
        "secure",
        "session",
        // "storeId",
        "name",
        "value",
        "expirationDate"
      ].join(",") + "\n"
    const textContent = data.cookies
      .map((item) =>
        [
          item.domain,
          item.hostOnly,
          item.httpOnly,
          item.path,
          item.sameSite,
          item.secure,
          item.session,
          // item.storeId,
          item.name,
          item.value,
          item.expirationDate
        ].join(",")
      )
      .join("\n")
    const blob = new Blob([headers + textContent], { type: "text/plain" })
    download(blob, "csv")
  }

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(JSON.stringify(data.cookies))
      .then(() => {
        // Show success message
        message.success("success")
      })
      .catch((err) => {
        // Handle error
        message.error("Failed to copy text.")
        console.error("Error copying text: ", err)
      })
  }
  return (
    <div>
      <Flex gap="small" wrap style={{ width: "600px" }}>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={downloadAsTxt} // 获取 cookies 后更新数据
          size={size}>
          export as txt
        </Button>

        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={downloadAsJson} // 获取 cookies 后更新数据
          size={size}
          style={{ backgroundColor: "hotpink" }}>
          export as json
        </Button>

        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={downloadAsCsv} // 获取 cookies 后更新数据
          size={size}
          style={{ backgroundColor: "lightgreen" }}>
          export as csv
        </Button>

        <Button
          type="primary"
          onClick={copyToClipboard} // 获取 cookies 后更新数据
          size={size}>
          copy
        </Button>
      </Flex>

      <Table
        dataSource={data.cookies} // 表格的数据源
        columns={columns} // 表格的列
        rowKey="name" // 每行的唯一标识
        size={"small"}
        pagination={false}
      />
    </div>
  )
}

export default IndexPopup
