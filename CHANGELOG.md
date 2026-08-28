# Changelog

本文件记录 Web-VSCode 的用户可见变更，格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Planned

- 基于 RAG 的项目知识检索，让回答更贴合当前代码库
- 跨任务结果传递（例如「解释代码」的结论可带入后续补全）

## [0.0.1] - 2026-07-15

首个可用版本：把 AI 编程辅助接到 VS Code 侧边栏和编辑器里，支持 OpenAI 兼容接口（DeepSeek、OpenAI 等）。

### Added

- 活动栏 **Web-VSCode AI** 侧边栏聊天面板，回复 **流式输出**，边生成边显示
- 助手消息中的 Markdown 代码块自动高亮渲染
- 多会话管理：新建 / 切换 / 删除会话，窗口重启后历史仍保留
- 面板内设置：API 地址、API Key、模型、是否自动补全、补全最大 Token
- 界面中英双语，跟随 VS Code 显示语言切换
- 全文件类型 **内联补全**：根据光标前上下文续写，可关闭自动触发
- 选中代码后右键 **Web-VSCode AI 助手**：
  - 打开聊天
  - 解释代码
  - 用例分析（输入/输出、边界与异常）
  - 生成注释，并支持一键插入编辑器
  - 生成单元测试
  - 修复 Bug
- 配置项 `web-vscode.apiUrl` / `apiKey` / `model` / `autoTriggerCompletion` / `completionMaxTokens`

### Notes

- API Key 只保存在用户设置中，请勿写入仓库
- 当前默认 API 为 `https://api.deepseek.com/v1`，模型 `deepseek-chat`，可在设置中改为其它兼容服务
