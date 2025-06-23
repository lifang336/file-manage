# Electron 智能文件管理器

> 🤖 **AI 编程项目说明**  
> 此项目为 AI 编写，使用了 ROO CODE、AUGMENT 等工具，是 VIBE CODING 的一次尝试。  
> 本项目展示了 AI 辅助编程在现代软件开发中的可能性和潜力。

## 简介

智能文件管理器是一款基于 Electron 的桌面应用，利用大语言模型（LLM）帮助用户智能整理和分类本地文件。

## 核心功能

### 🎯 智能分类
- **手动分类**：用户预定义分类规则
- **AI 自动分类**：LLM 分析文件名并自动生成分类建议
- **语义理解**：基于文件名语义进行智能分类

### 📁 文件操作
- **目录选择**：灵活选择源目录和输出目录
- **递归处理**：支持处理子文件夹
- **安全移动**：自动处理文件名冲突
- **预览功能**：操作前预览分类结果

### ⚙️ 配置管理
- **API 配置**：支持多种 LLM 服务商
- **规则管理**：保存和复用分类规则
- **日志记录**：详细的操作日志

## 快速开始

### 开发环境

```bash
# 1. 克隆仓库
git clone https://github.com/lifang336/file-manage.git
cd file-manage

# 2. 安装依赖
pnpm install

# 3. 开发模式运行
pnpm run electron:dev
```

### 构建打包

```bash
# 构建应用
pnpm run build

# 打包所有平台
pnpm run dist:all

# 或使用脚本
./scripts/build.sh all
```

### 版本发布

```bash
# 发布新版本（自动构建和发布）
./scripts/release.sh patch  # 或 minor/major
```

详细发布流程请参考 [RELEASE.md](RELEASE.md)。

## 技术栈

- **前端**: Vue 3 + TypeScript + Vite
- **桌面**: Electron
- **AI**: OpenAI 兼容 API（默认通义千问）
- **包管理**: pnpm

## 贡献

欢迎对本项目做出贡献！请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 了解更多细节。

**特别说明**：本项目遵循 AI 编程原则，所有贡献必须使用 AI 编程工具完成。

## 许可证

本项目采用 [MIT](LICENSE) 许可证。
