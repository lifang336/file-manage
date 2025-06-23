# 版本发布指南

本文档介绍如何使用自动化系统发布智能文件管理器的新版本。

## 🚀 快速发布

### 方法一：使用发布脚本（推荐）

**Linux/macOS:**
```bash
# 发布补丁版本 (1.0.0 -> 1.0.1)
./scripts/release.sh patch

# 发布次要版本 (1.0.0 -> 1.1.0)
./scripts/release.sh minor

# 发布主要版本 (1.0.0 -> 2.0.0)
./scripts/release.sh major
```

**Windows:**
```cmd
# 发布补丁版本
scripts\release.bat patch

# 发布次要版本
scripts\release.bat minor

# 发布主要版本
scripts\release.bat major
```

### 方法二：手动发布

```bash
# 1. 更新版本号
pnpm version:patch  # 或 minor/major

# 2. 提交更改
git add package.json
git commit -m "chore: bump version to x.x.x"

# 3. 创建标签
git tag "vx.x.x"

# 4. 推送到远程
git push origin main
git push origin "vx.x.x"
```

## 📋 版本号规则

我们遵循 [语义化版本控制](https://semver.org/lang/zh-CN/) 规范：

- **主版本号 (MAJOR)**: 当你做了不兼容的 API 修改
- **次版本号 (MINOR)**: 当你做了向下兼容的功能性新增
- **修订号 (PATCH)**: 当你做了向下兼容的问题修正

### 示例

- `1.0.0` -> `1.0.1` (修复bug)
- `1.0.1` -> `1.1.0` (新增功能)
- `1.1.0` -> `2.0.0` (重大更改)

## 🔄 自动化流程

当你推送一个以 `v` 开头的标签时，GitHub Actions 会自动：

1. **构建应用**: 在 macOS 和 Windows 环境中构建应用
2. **打包应用**: 生成安装包（.dmg, .exe 等）
3. **创建 Release**: 在 GitHub 上创建新的 Release
4. **上传文件**: 将构建产物上传到 Release

## 📦 构建产物

### macOS
- `智能文件管理器-x.x.x.dmg` - DMG 安装包
- `智能文件管理器-x.x.x-mac.zip` - ZIP 压缩包
- `智能文件管理器-x.x.x-arm64.dmg` - Apple Silicon 版本
- `智能文件管理器-x.x.x-arm64-mac.zip` - Apple Silicon ZIP

### Windows
- `智能文件管理器 Setup x.x.x.exe` - NSIS 安装程序
- `智能文件管理器 x.x.x.exe` - 便携版

## 🛠️ 发布前检查清单

在发布新版本之前，请确保：

- [ ] 所有更改已提交并推送到主分支
- [ ] 工作区干净（没有未提交的更改）
- [ ] 已测试新功能和修复
- [ ] 更新了 CHANGELOG.md（如果有）
- [ ] 确认版本号类型正确（patch/minor/major）

## 🔧 配置说明

### GitHub Actions 配置

工作流文件位于 `.github/workflows/release.yml`，包含：

- **触发条件**: 推送 `v*` 标签时自动触发
- **构建矩阵**: 支持 macOS 和 Windows
- **缓存优化**: 使用 pnpm 缓存加速构建
- **自动发布**: 构建完成后自动创建 GitHub Release

### electron-builder 配置

在 `package.json` 中配置了：

```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "lifang336",
      "repo": "file-manage"
    }
  }
}
```

## 🚨 故障排除

### 常见问题

1. **构建失败**
   - 检查 GitHub Actions 日志
   - 确保所有依赖都在 package.json 中
   - 验证构建脚本是否正确

2. **发布失败**
   - 检查 GitHub Token 权限
   - 确保仓库设置允许 Actions 创建 Release
   - 验证标签格式是否正确（必须以 v 开头）

3. **版本号错误**
   - 检查 package.json 中的版本号
   - 确保标签与 package.json 版本一致

### 手动触发构建

如果需要手动触发构建，可以：

1. 访问 GitHub Actions 页面
2. 选择 "Build and Release" 工作流
3. 点击 "Run workflow" 按钮

## 📞 获取帮助

如果遇到问题，请：

1. 查看 GitHub Actions 构建日志
2. 检查本文档的故障排除部分
3. 在项目中创建 Issue 描述问题
