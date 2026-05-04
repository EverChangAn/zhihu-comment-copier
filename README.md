2. README.md

# 知乎评论区一键复制

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Tampermonkey](https://img.shields.io/badge/Tampermonkey-✓-brightgreen)](https://www.tampermonkey.net/)

一个油猴脚本，在知乎回答页面添加浮动按钮，一键复制评论区内容（支持带序号 / 纯文本两种模式）。

## ✨ 功能

- 🎯 自动提取问题描述 + 所有评论正文
- 🧹 自动过滤日期、地点、「热评」「回复」等元数据
- 🔢 **带序号模式**：`1：问题描述\n2：评论1\n3：评论2...`
- 📝 **纯文本模式**：`问题描述\n评论1\n评论2...`（无序号）
- 🎨 紫色浮动按钮，两个子选项清晰标注
- 🔄 支持知乎 SPA 页面切换（监听 URL 变化）
- 📋 多种剪贴板写入策略（GM_setClipboard → navigator.clipboard → textarea 回退）

## 📸 效果演示

点击右下角紫色按钮：
    ┌──────┐
    │  📋  │  ← 点击
    └──────┘
       │
┌──────┴──────┐
│ 🔢 带序号   │  ← 紫蓝色胶囊
│ 📝 纯文本   │  ← 绿色胶囊
└─────────────┘

复制结果示例（带序号）：



## 📥 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
2. 点击下方链接安装脚本：

👉 [**一键安装**](https://github.com/EverChangAn/zhihu-comment-copier/raw/main/zhihu-comment-copier.user.js)

3. Tampermonkey 会自动弹出安装页面，点击「安装」即可

## 🚀 使用

1. 打开任意知乎回答页面（`zhihu.com/question/xxx/answer/xxx`）
2. 滚动到评论区，确保评论已加载
3. 点击右下角紫色 📋 按钮
4. 选择「🔢 带序号」或「📝 纯文本」
5. 内容已复制到剪贴板，直接粘贴即可

## 🛠 技术细节

- 选择器：`div.CommentContent`（知乎当前 DOM 结构）
- 自动过滤占位文本（「理性发言，友善互动」等）
- 问题描述获取多级回退（RichText → QuestionHeader → h1 → document.title）

## 📄 License

MIT © EverChangAn

3. 项目目录结构

zhihu-comment-copier/
├── README.md                      ← 项目说明
├── zhihu-comment-copier.user.js   ← 油猴脚本（主文件）
└── LICENSE                        ← MIT 许可证




