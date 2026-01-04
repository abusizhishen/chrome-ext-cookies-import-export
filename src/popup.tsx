// import 'bootstrap/dist/css/bootstrap.min.css';
import { DownloadOutlined, UploadOutlined } from "@ant-design/icons"
import {
  Button,
  Divider,
  Flex,
  Form,
  Input,
  message,
  Modal,
  Radio,
  Select,
  Table,
  Upload,
  type UploadProps
} from "antd"
import type { SizeType } from "antd/es/config-provider/SizeContext"
import React, { useEffect, useState } from "react"
import { readString } from "react-native-csv"

import "tailwindcss/base.css"

import TextArea from "antd/es/input/TextArea"

// dumpCookies 获取数据，并将其传递给父组件
function dumpCookies(setData) {
  chrome.runtime.sendMessage({ type: "dump_cookies" }, (response) => {
    // 假设 response 中包含了 cookies 数据
    console.log("response", response)
    response.cookies.map((item) => {
      // "hostOnly",
      // "sameSite",
      // "session",
      // "storeId",
      // "expirationDate"
      item.expires = item.expirationDate,
      delete item.httpOnly

      // delete item.sameSite
      delete item.session
      delete item.storeId
      // delete item.expirationDate
      // delete item.value

      return item
    })
    setData(response) // 将获取到的 cookies 数据更新到 state
  })
}

// async function getActiveTabUrl() {
//   // const tabs = await chrome.tabs.query({
//   //   active: true,
//   //   currentWindow: true
//   // })
//   //
//   // const activeTab = tabs[0]
//   // let origin
//   // try {
//   //   const url = new URL(activeTab.url)
//   //   origin = url.origin
//   // } catch (error) {
//   //   console.error("无法解析URL:", activeTab.url, error)
//   //   // 对于某些特殊页面（chrome://, about:等），无法使用URL API
//   //   origin = activeTab.url
//   // }
//   //
//   // console.log("激活标签页的origin:", origin)
//   // console.log("完整URL:", activeTab.url)
//   // console.log("标签页ID:", activeTab.id)
//   // console.log("标题:", activeTab.title)
//
//   let urls = await getTabUrls()
//   return urls[0]
// }

async function getTabUrls() {
  const tabs = await chrome.tabs.query({
    // active: true,
    // currentWindow: true
  })

  // const activeTab = tabs[0]
  // let origin
  // try {
  //   const url = new URL(activeTab.url)
  //   origin = url.origin
  // } catch (error) {
  //   console.error("无法解析URL:", activeTab.url, error)
  //   // 对于某些特殊页面（chrome://, about:等），无法使用URL API
  //   origin = activeTab.url
  // }
  //
  // console.log("激活标签页的origin:", origin)
  // console.log("完整URL:", activeTab.url)
  // console.log("标签页ID:", activeTab.id)
  // console.log("标题:", activeTab.title)

  let urls = tabs
      .map(tab => {
        try {
          return new URL(tab.url).origin
        } catch {
          return null
        }
      })
      .filter(Boolean)

  console.log('urls', urls)
  return urls
}

function IndexPopup() {
  useEffect(()=>{
    dumpCookies(setData) // 页面加载时调用 dumpCookies
    getTabUrls().then(urls=>setUrls([...new Set(urls)]))
  },[])

  const [data, setData] = useState({ url: { host: "" }, cookies: [] })

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Domain", dataIndex: "domain", key: "domain" },
    { title: "Path", dataIndex: "path", key: "path" },
    {
      title: "Expire",
      dataIndex: "expires",
      key: "expires",
      render: (text) =>
        text ? new Date(text * 1000).toLocaleString() : "Session",
      width:400
    },
    { title: "Value", dataIndex: "value", key: "value" }
  ]


  const [size, setSize] = useState<SizeType>("middle") // default is 'middle'

  const download = (blob, ext = "txt") => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `cookies_${data.url}.${ext}`
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
        "name",
        "value",
        "domain",
        "path",
        "expires",
        "httpOnly",
        "hostOnly",
        "secure",
        "sameSite"
        // "session",
        // "storeId"
      ].join(",") + "\n"
    const textContent = data.cookies
      .map((item) =>
        [
          item.name,
          item.value,
          item.domain,
          item.path,
          item.expires,
          item.httpOnly,
          item.hostOnly,
          item.secure,
          item.sameSite
          // item.session,
          // item.storeId
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
  const options = ["json", "csv", "txt"]

  const readFromCsv = (text) => {
    let config = {
      delimiter: "", // auto-detect
      newline: "", // auto-detect
      quoteChar: '"',
      escapeChar: '"',
      header: true,
      transformHeader: undefined,
      dynamicTyping: false,
      preview: 0,
      encoding: "",
      worker: false,
      comments: false,
      step: undefined,
      complete: undefined,
      error: undefined,
      download: false,
      downloadRequestHeaders: undefined,
      skipEmptyLines: false,
      chunk: undefined,
      fastMode: undefined,
      beforeFirstChunk: undefined,
      withCredentials: undefined,
      transform: undefined,
      delimitersToGuess: [",", "	", "|", ";"]
    }
    return readString(text, config)
      .data.map((item) => {
        item.httpOnly = item.httpOnly === "true"
        item.secure = item.secure === "true"
        // item.sameSite = item.sameSite === "true"
        return item
      })
      .filter((item) => item.domain)
  }
  const readFromJson = (text) => {
    return JSON.parse(text)
  }

  const props: UploadProps = {
    onChange({ file, fileList }) {
      if (file.status !== "uploading") {
        console.log(file, fileList)

        let read = file.name.endsWith(".csv") ? readFromCsv : readFromJson

        const reader = new FileReader()

        reader.onload = (e) => {
          const text = e.target.result
          // console.log("content ", text)
          // You can then parse the CSV manually or with a CSV parser
          let cookies = read(text)
          console.log("cookies: ", cookies)

          // getActiveTabUrl().then((url) => {
          //   chrome.runtime.sendMessage(
          //     { type: "import_cookies", data: { cookies, url } },
          //     (response) => {
          //       // 假设 response 中包含了 cookies 数据
          //
          //       console.log("response", response)
          //     }
          //   )
          // })
        }

        reader.readAsText(file.originFileObj)
      }
      console.log(file)
    },
    showUploadList: false,
    accept: ".csv,.json"
  }

  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [urls, setUrls] = useState([])
  const showModal = () => {
    setOpen(true)
  }

  const handleOk = (e: React.MouseEvent<HTMLElement>) => {
    console.log(e)
    setOpen(false)
  }

  const handleCancel = (e: React.MouseEvent<HTMLElement>) => {
    console.log(e)
    setOpen(false)
  }

  const handleSubmit = (e) => {
    console.log(e)
    let { type, cookies, url } = e
    url = Array.isArray(url) ? url.filter(url=>url)[0] : e.url
    console.log("cookies: ", cookies)
    try {
      if (type === "csv") {
        cookies = readFromCsv(cookies)
      } else {
        cookies = readFromJson(cookies)
      }
    } catch (e) {
      console.error(e)
      message.error("Could not parse cookies: ", e.message)
    }

    console.log("cookies: ", cookies)

    chrome.runtime.sendMessage(
      { type: "import_cookies", data: { cookies, url } },
      (response) => {
        // 假设 response 中包含了 cookies 数据

        console.log("response", response)
        if (response.success) {
          message.success(response.message)
        } else {
          message.error(response.message)
        }
      }
    )
  }

  return (
    <div
      style={{ width: "800px", height: "500px", overflowX: "scroll" }} // 设置表格的最大宽度
      className="flex-column">
      <Flex
        gap="small"
        wrap
        // style={{ width: "800px" }}
      >
        {/*<Select*/}
        {/*  style={{ width: "80px" }}*/}
        {/*  options={options.map((item) => {*/}
        {/*    return { label: item, value: item }*/}
        {/*  })}*/}
        {/*  defaultValue={"json"}>*/}
        {/*</Select>*/}
        {/*<Button*/}
        {/*  type="primary"*/}
        {/*  icon={<DownloadOutlined />}*/}
        {/*  onClick={downloadAsTxt} // 获取 cookies 后更新数据*/}
        {/*  size={size}>*/}
        {/*  export as txt*/}
        {/*</Button>*/}

        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={downloadAsJson} // 获取 cookies 后更新数据
          size={size}
          style={{ backgroundColor: "hotpink" }}>
          export as json
        </Button>

        {/*<Button*/}
        {/*  type="primary"*/}
        {/*  icon={<DownloadOutlined />}*/}
        {/*  onClick={downloadAsCsv} // 获取 cookies 后更新数据*/}
        {/*  size={size}*/}
        {/*  style={{ backgroundColor: "lightgreen" }}>*/}
        {/*  export as csv*/}
        {/*</Button>*/}

        <Button
          type="primary"
          onClick={copyToClipboard} // 获取 cookies 后更新数据
          size={size}>
          copy
        </Button>
        {/*<Upload {...props}>*/}
        {/*  <Button icon={<UploadOutlined />}>import from csv/json </Button>*/}
        {/*</Upload>*/}
        <Button type="primary" onClick={showModal}>
          上传cookie
        </Button>
      </Flex>

      <Table
        dataSource={data.cookies} // 表格的数据源
        columns={columns} // 表格的列
        rowKey={(record) => `${record.domain}_${record.path}_${record.name}`}
        size={"small"}
        pagination={false}
        // style={{ maxWidth: "800px", overflowX: "scroll" }} // 设置表格的最大宽度
      />
      <Modal
        title="导入cookie"
        open={open}
        onOk={handleOk}
        onCancel={handleCancel}
        okButtonProps={{ disabled: true }}
        cancelButtonProps={{ disabled: true }}
        footer={null}>
        <Form
          name="wrap"
          labelCol={{ flex: "110px" }}
          labelAlign="left"
          labelWrap
          wrapperCol={{ flex: 1 }}
          colon={false}
          style={{ maxWidth: 600 }}
          onFinish={handleSubmit}
          initialValues={{ // Set default values here
            type:"json",
            url: [],
            // urls:urls,
            // remember: true,
          }}
        >
          <Form.Item label="type" name="type" rules={[{ required: true }]}>
            <Radio.Group  options={[{value: 'json', label: 'json'}]}/>
          </Form.Item>
          {/*<Form.Item label="Url" name="url" rules={[{ required: true }]} >*/}
          {/*  <Input />*/}
          {/*</Form.Item>*/}
          <Form.Item label="Url" name="url" rules={[{ required: true }]} >
            <Select
                mode="tags"
                showSearch
                maxTagCount={1}
                // showSearch={{ optionFilterProp: 'label',  }}
                placeholder="选择或者输入url"
                // onChange={onChange}
                options={urls.map((item) => {return{
                  value: item,
                  label: item,
                }})}
            />
          </Form.Item>


          <Form.Item
            label="cookies"
            name="cookies"
            rules={[{ required: true }]}>
            <TextArea rows={5} placeholder="cookies" />
          </Form.Item>

          <Form.Item label=" ">
            <Button type="primary" htmlType="submit">
              导入
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default IndexPopup
