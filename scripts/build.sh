#!/bin/bash

# 智能文件管理器打包脚本
# 支持 macOS 和 Windows 平台

set -e

echo "🚀 开始构建智能文件管理器..."

# 检查 Node.js 和 pnpm
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "❌ 错误: 未找到 pnpm，请先安装 pnpm"
    echo "   安装命令: npm install -g pnpm"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
pnpm install

# 构建应用
echo "🔨 构建应用..."
pnpm run build

# 根据参数选择打包平台
case "$1" in
    "mac")
        echo "🍎 打包 macOS 版本..."
        pnpm run dist:mac
        ;;
    "win")
        echo "🪟 打包 Windows 版本..."
        pnpm run dist:win
        ;;
    "all")
        echo "🌍 打包所有平台版本..."
        pnpm run dist:all
        ;;
    *)
        echo "📋 使用方法:"
        echo "  ./scripts/build.sh mac    # 打包 macOS 版本"
        echo "  ./scripts/build.sh win    # 打包 Windows 版本"
        echo "  ./scripts/build.sh all    # 打包所有平台版本"
        echo ""
        echo "🔧 或者直接使用 pnpm 命令:"
        echo "  pnpm run dist:mac         # 打包 macOS 版本"
        echo "  pnpm run dist:win         # 打包 Windows 版本"
        echo "  pnpm run dist:all         # 打包所有平台版本"
        echo "  pnpm run pack             # 仅打包不压缩（用于测试）"
        exit 1
        ;;
esac

echo "✅ 打包完成！输出目录: release/"
echo "📁 查看打包结果: ls -la release/"
