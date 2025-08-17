# Video Parse API

视频解析API服务，支持抖音和快手无水印视频解析。

## 功能特性

- 🎯 抖音视频解析
- 🎯 快手视频解析  
- 🚀 无水印视频下载
- 🌐 支持微信小程序调用
- ⚡ 基于Vercel Serverless部署

## API接口

### 1. 视频解析
```
POST /api/parse
Content-Type: application/json

{
  "url": "视频链接",
  "platform": "douyin|kuaishou"
}
```

### 2. 视频下载
```
POST /api/download
Content-Type: application/json

{
  "url": "视频直链"
}
```

## 部署方法

1. 上传到GitHub仓库
2. 在Vercel导入该仓库
3. 自动部署完成

## 使用示例

```javascript
// 解析视频
const response = await fetch('https://your-api.vercel.app/api/parse', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://v.douyin.com/xxxxx/',
    platform: 'douyin'
  })
});

const result = await response.json();
console.log(result.videoUrl);
```

## 文件结构

```
├── api/
│   ├── parse.js      # 视频解析API
│   └── download.js   # 视频下载API
├── vercel.json       # Vercel配置
├── package.json      # 项目配置
└── README.md         # 说明文档
```
