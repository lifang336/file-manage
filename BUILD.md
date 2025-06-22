# 智能文件管理器 - 打包构建指南

本文档介绍如何为 macOS 和 Windows 平台构建和打包智能文件管理器应用程序。

## 前置要求

### 必需软件
- **Node.js** (版本 18 或更高)
- **pnpm** (推荐的包管理器)
- **Git** (用于版本控制)

### 平台特定要求

#### macOS 打包
- **macOS** 操作系统
- **Xcode Command Line Tools**
  ```bash
  xcode-select --install
  ```

#### Windows 打包
- **Windows** 操作系统，或
- **macOS/Linux** + **Wine** (用于交叉编译)

## 安装依赖

```bash
# 安装 pnpm (如果尚未安装)
npm install -g pnpm

# 安装项目依赖
pnpm install
```

## 构建命令

### 开发构建
```bash
# 构建主进程和渲染进程
pnpm run build

# 开发模式运行
pnpm run electron:dev
```

### 生产打包

#### 使用脚本 (推荐)
```bash
# 打包 macOS 版本
./scripts/build.sh mac

# 打包 Windows 版本  
./scripts/build.sh win

# 打包所有平台版本
./scripts/build.sh all
```

#### 使用 pnpm 命令
```bash
# 仅打包不压缩 (用于测试)
pnpm run pack

# 打包 macOS 版本
pnpm run dist:mac

# 打包 Windows 版本
pnpm run dist:win

# 打包所有平台版本
pnpm run dist:all
```

## 输出文件

打包完成后，文件将输出到 `release/` 目录：

### macOS 输出
- `智能文件管理器-{version}.dmg` - DMG 安装包
- `智能文件管理器-{version}-mac.zip` - ZIP 压缩包

### Windows 输出
- `智能文件管理器 Setup {version}.exe` - NSIS 安装程序
- `智能文件管理器 {version}.exe` - 便携版程序

## 应用图标

应用图标文件应放置在 `assets/` 目录中：
- `assets/icon.icns` - macOS 图标
- `assets/icon.ico` - Windows 图标

详细的图标要求请参考 `assets/README.md`。

## 配置说明

打包配置位于 `package.json` 的 `build` 字段中，主要配置项：

- `appId`: 应用程序唯一标识符
- `productName`: 应用程序显示名称
- `directories.output`: 输出目录
- `files`: 要包含的文件
- `mac`: macOS 特定配置
- `win`: Windows 特定配置

## 故障排除

### 常见问题

1. **缺少图标文件**
   - 从 `package.json` 中移除 `icon` 配置，或
   - 添加对应的图标文件到 `assets/` 目录

2. **权限错误 (macOS)**
   ```bash
   chmod +x scripts/build.sh
   ```

3. **依赖安装失败**
   ```bash
   # 清理缓存重新安装
   pnpm store prune
   rm -rf node_modules
   pnpm install
   ```

4. **Windows 交叉编译失败**
   - 确保安装了 Wine (在 macOS/Linux 上)
   - 或在 Windows 系统上进行打包

### 调试模式

```bash
# 启用详细日志
DEBUG=electron-builder pnpm run dist

# 仅构建不打包 (用于调试)
pnpm run pack
```

## 发布流程

1. 更新版本号
   ```bash
   npm version patch  # 或 minor, major
   ```

2. 构建所有平台
   ```bash
   ./scripts/build.sh all
   ```

3. 测试打包结果

4. 发布到分发平台

## 自动化构建

可以使用 GitHub Actions 或其他 CI/CD 工具实现自动化构建：

```yaml
# .github/workflows/build.yml 示例
name: Build and Release
on:
  push:
    tags: ['v*']
jobs:
  build:
    strategy:
      matrix:
        os: [macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install -g pnpm
      - run: pnpm install
      - run: pnpm run dist
```
