# 贡献指南

欢迎为智能文件管理器项目做出贡献！本项目是一个 **AI 编程实验项目**，旨在探索和展示 AI 辅助编程的可能性。

## 🤖 AI 编程原则

### 核心规则：仅允许使用 AI 编程工具

本项目遵循 **VIBE CODING** 理念，**所有代码贡献必须使用 AI 编程工具完成**。我们不接受纯手工编写的代码贡献。

### 推荐的 AI 编程工具

以下是我们推荐和支持的 AI 编程工具：

#### 🔧 主要工具
- **[Augment](https://augmentcode.com/)** - 世界领先的代码库上下文引擎
- **[Roo Cline](https://github.com/RooVetGit/Roo-Cline)** - VS Code 中的 AI 编程助手
- **[GitHub Copilot](https://github.com/features/copilot)** - GitHub 官方 AI 编程助手
- **[Cursor](https://cursor.sh/)** - AI 优先的代码编辑器
- **[Codeium](https://codeium.com/)** - 免费的 AI 编程助手

#### 🌟 其他支持的工具
- **[Tabnine](https://www.tabnine.com/)** - AI 代码补全工具
- **[Amazon CodeWhisperer](https://aws.amazon.com/codewhisperer/)** - AWS 的 AI 编程助手
- **[Replit Ghostwriter](https://replit.com/ai)** - Replit 的 AI 编程功能
- **[Claude](https://claude.ai/)** - Anthropic 的 AI 助手（用于代码生成）
- **[ChatGPT](https://chat.openai.com/)** - OpenAI 的 AI 助手（用于代码生成）

## 📋 贡献流程

### 1. 准备工作

1. **Fork 本仓库**到你的 GitHub 账户
2. **克隆你的 Fork**到本地：
   ```bash
   git clone https://github.com/你的用户名/file-manage.git
   cd file-manage
   ```
3. **安装依赖**：
   ```bash
   pnpm install
   ```
4. **配置你的 AI 编程工具**

### 2. 开发规范

#### 🤖 AI 工具使用要求

- **必须使用 AI 工具**：所有代码修改都必须通过 AI 编程工具完成
- **记录 AI 工具**：在 PR 描述中说明使用了哪个 AI 工具
- **保留 AI 对话**：如果可能，请保留与 AI 的关键对话记录

#### 📝 代码质量标准

- **遵循项目现有代码风格**
- **添加适当的注释**（可以让 AI 帮助生成）
- **确保代码可读性和可维护性**
- **编写或更新相关测试**

#### 🧪 测试要求

- **功能测试**：确保新功能正常工作
- **回归测试**：确保没有破坏现有功能
- **跨平台测试**：在 Windows 和 macOS 上测试（如果可能）

### 3. 提交规范

#### 📝 Commit 消息格式

使用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/) 格式：

```
<类型>[可选的作用域]: <描述>

[可选的正文]

[可选的脚注]
```

**类型示例：**
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

**示例：**
```
feat(ui): 使用 Cursor AI 添加文件预览功能

- 通过 Cursor AI 生成文件预览组件
- 支持图片、文本和 PDF 预览
- 添加了响应式设计

AI-Tool: Cursor
```

### 4. Pull Request 流程

#### 📤 提交 PR

1. **创建功能分支**：
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **提交更改**：
   ```bash
   git add .
   git commit -m "feat: 使用 AI 工具添加新功能"
   ```

3. **推送到你的 Fork**：
   ```bash
   git push origin feature/your-feature-name
   ```

4. **创建 Pull Request**

#### 📋 PR 模板

请在 PR 描述中包含以下信息：

```markdown
## 🤖 AI 工具信息
- **使用的 AI 工具**: [工具名称，如 Augment、Cursor 等]
- **AI 辅助程度**: [完全 AI 生成 / AI 辅助编写 / AI 优化现有代码]

## 📝 更改描述
- 简要描述你的更改
- 解释为什么需要这些更改

## 🧪 测试
- [ ] 本地测试通过
- [ ] 功能测试完成
- [ ] 跨平台测试（如适用）

## 📸 截图（如适用）
[添加截图展示 UI 更改]

## 🔗 相关 Issue
Closes #[issue 编号]
```

## 🚫 不被接受的贡献

以下类型的贡献将**不会被接受**：

- ❌ **纯手工编写的代码**（没有使用 AI 工具）
- ❌ **未说明使用 AI 工具的 PR**
- ❌ **破坏现有功能的更改**
- ❌ **不符合项目目标的功能**
- ❌ **缺乏适当测试的代码**

## 🎯 贡献建议

### 优先级高的贡献方向

1. **🐛 Bug 修复** - 使用 AI 工具诊断和修复问题
2. **🎨 UI/UX 改进** - 让 AI 帮助设计更好的用户界面
3. **⚡ 性能优化** - 使用 AI 分析和优化代码性能
4. **📚 文档完善** - 让 AI 帮助编写更好的文档
5. **🧪 测试覆盖** - 使用 AI 生成更全面的测试

### 新功能建议

- **多语言支持**
- **文件预览功能**
- **批量操作优化**
- **更智能的分类算法**
- **插件系统**

## 🤝 社区行为准则

- **尊重他人**：友善对待所有贡献者
- **开放心态**：欢迎不同的观点和建议
- **学习分享**：分享你使用 AI 工具的经验
- **质量优先**：追求高质量的代码和用户体验

## 📞 获取帮助

如果你在贡献过程中遇到问题：

1. **查看现有 Issues** - 可能已有相关讨论
2. **创建新 Issue** - 详细描述你的问题
3. **参与讨论** - 在 Discussions 中与社区交流

## 🎉 致谢

感谢所有使用 AI 工具为本项目做出贡献的开发者！你们的参与让这个 AI 编程实验项目变得更加精彩。

---

**记住：这是一个 AI 编程实验项目，让我们一起探索 AI 辅助编程的无限可能！** 🚀
