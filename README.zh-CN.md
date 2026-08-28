# Web-VSCode

[English](README.md) | [简体中文](README.zh-CN.md)

一款开源的 VS Code 扩展，将 AI 编程辅助能力集成到编辑器中：流式聊天、内联补全、右键快捷操作，支持 OpenAI 兼容 API（DeepSeek、OpenAI 等）。

> **当前状态：** v0.0.1，持续开发中。基于 RAG 的标准知识获取、跨任务结果传递等功能在路线图中。

---

## 功能特性

### 聊天与会话

- 侧边栏聊天面板，支持 **流式输出**
- 回复中自动渲染 Markdown 代码块
- **多会话** 管理，重启后历史不丢失
- 面板内 **设置**（API 地址、Key、模型、补全选项）
- **国际化**，界面随 VS Code 显示语言切换（中/英）

### 内联代码补全

- 对所有文件类型提供 AI 内联补全
- 可配置是否自动触发、最大 Token 数
- 基于光标前上下文生成续写建议

### 编辑器右键菜单

选中代码 → 右键 **Web-VSCode AI 助手**：

| 功能 | 说明 |
|------|------|
| 打开聊天 | 聚焦侧边栏聊天面板 |
| 解释代码 | 解释选中代码的含义 |
| 用例分析 | 分析典型输入/输出、边界与异常场景 |
| 生成注释 | 生成带注释代码，支持 **一键插入编辑器** |
| 生成单元测试 | 为选中代码生成单元测试 |
| 修复 Bug | 检查问题并给出修复建议 |

---

## 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) 18+
- [VS Code](https://code.visualstudio.com/) ≥ 1.108.1

### 安装与调试

```bash
git clone https://github.com/huibuaa/web-vscode.git
cd web-vscode
npm install
npm run compile
```

在 VS Code 中按 **F5** 启动 **Extension Development Host**，然后：

1. 点击活动栏 **Web-VSCode AI** 图标
2. 点击聊天面板右上角 **设置**（齿轮）
3. 填写 **API Key** 并保存
4. 开始聊天，或对选中代码使用右键菜单

### 配置项

| 设置项 | 键名 | 默认值 |
|--------|------|--------|
| API 地址 | `web-vscode.apiUrl` | `https://api.deepseek.com/v1` |
| API Key | `web-vscode.apiKey` | _(空)_ |
| 模型 | `web-vscode.model` | `deepseek-chat` |
| 自动补全 | `web-vscode.autoTriggerCompletion` | `true` |
| 补全最大 Token | `web-vscode.completionMaxTokens` | `256` |

可通过聊天面板设置、VS Code 设置界面或 `settings.json` 配置。

---

## 脚手架 vs 扩展功能

本仓库由 **官方 VS Code 扩展脚手架** 与 **自研 AI 业务** 两部分组成。理清边界有助于阅读和贡献代码。

### 来自脚手架（`yo code` / `@vscode/generator-code`）

使用官方生成器创建，选型为 **TypeScript + Webpack**：

| 文件/目录 | 作用 |
|-----------|------|
| `webpack.config.js` | 将 `src/` 打包为 `dist/extension.js` |
| `tsconfig.json` | TypeScript 编译配置 |
| `eslint.config.mjs` | ESLint 扁平配置 |
| `.vscode/launch.json` | F5 调试（Extension Development Host） |
| `.vscode/tasks.json` | 构建 / watch 任务 |
| `.vscode/extensions.json` | 推荐安装的扩展 |
| `.vscode-test.mjs` | 测试运行器配置 |
| `src/test/extension.test.ts` | 占位测试 |

**脚手架提供的 npm 脚本：**

```bash
npm run compile    # webpack 编译
npm run watch      # 监听模式
npm run package    # 生产环境打包
npm run lint       # eslint 检查
npm run test       # 运行扩展测试
```

### 自研扩展（项目业务代码）

在脚手架之上实现的 AI 能力：

```
src/
├── extension.ts                 # 入口：注册 Provider 与命令
├── commands/register-commands.ts
├── providers/
│   ├── chat-webview-provider.ts # 侧边栏聊天、多会话、流式输出
│   └── completion-provider.ts   # 内联补全
├── services/ai-service.ts       # OpenAI 兼容 API（流式 / 非流式）
├── chat/
│   ├── session-manager.ts       # 多会话逻辑
│   └── session-store.ts         # 会话持久化（globalState）
├── webview/chat-panel.ts        # 聊天 UI（HTML/CSS/JS）
├── config/settings.ts           # 读写 VS Code 配置
├── i18n/ui-strings.ts           # 界面国际化文案
├── prompts/l10n-prompts.ts      # 右键菜单 Prompt 模板
├── constants/index.ts
└── types/
resources/
├── l10n/                        # 扩展国际化资源
├── assets/images/icon.svg       # 活动栏图标
package.nls.json                 # package.json 英文文案
package.nls.zh-cn.json           # package.json 中文文案
```

**运行时依赖：** [axios](https://github.com/axios/axios) — 用于调用 AI 接口。

---

## 架构概览

```
用户
 ├── 侧边栏聊天（Webview）  ──► ChatViewProvider ──► AiService（流式）
 ├── 内联补全               ──► CompletionProvider ──► AiService（非流式）
 └── 右键菜单命令           ──► register-commands ──► ChatViewProvider
                                      │
                                      ▼
                              OpenAI 兼容 API
                              POST /chat/completions
```

**流式输出：** 聊天使用 `stream: true` + SSE 解析；内联补全为一次性返回。

**规划中：** 基于 RAG 的标准知识获取；任务间结果自动传递（如生成代码 → 测试生成）。

---

## 目录结构（项目根）

```
web-vscode/
├── src/              # TypeScript 源码（不打进 .vsix）
├── dist/             # Webpack 输出（扩展入口）
├── resources/        # 图标、国际化资源（会打包）
├── docs/             # 文档（可选）
├── .vscode/          # 开发调试配置（不打包）
├── package.json      # 扩展清单
├── webpack.config.js
├── README.md         # 英文说明
└── README.zh-CN.md   # 中文说明（本文件）
```

---

## 参与贡献

欢迎 Issue 与 Pull Request。较大改动建议先开 Issue 讨论。

1. Fork 本仓库
2. 创建功能分支
3. 运行 `npm run compile && npm run lint`
4. 提交 PR

---

## 许可证

本项目采用 [MIT License](LICENSE) 开源。

---

## 致谢

- [VS Code Extension API](https://code.visualstudio.com/api)
- 脚手架来自 [@vscode/generator-code](https://github.com/microsoft/vscode-generator-code)（`yo code`）
