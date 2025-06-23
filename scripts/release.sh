#!/bin/bash

# 智能文件管理器版本发布脚本
# 使用方法: ./scripts/release.sh [patch|minor|major]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 检查是否在git仓库中
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "当前目录不是git仓库"
    exit 1
fi

# 检查工作区是否干净
if ! git diff-index --quiet HEAD --; then
    print_error "工作区有未提交的更改，请先提交或暂存更改"
    exit 1
fi

# 检查是否在主分支
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ] && [ "$current_branch" != "master" ]; then
    print_warning "当前不在主分支 ($current_branch)，确定要继续吗？(y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        print_message "已取消发布"
        exit 0
    fi
fi

# 获取版本类型参数
VERSION_TYPE=${1:-patch}

if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
    print_error "无效的版本类型: $VERSION_TYPE"
    print_message "使用方法: $0 [patch|minor|major]"
    exit 1
fi

# 获取当前版本
current_version=$(node -p "require('./package.json').version")
print_message "当前版本: $current_version"

# 更新版本号
print_step "更新版本号 ($VERSION_TYPE)"
pnpm version:$VERSION_TYPE --no-git-tag-version

# 获取新版本号
new_version=$(node -p "require('./package.json').version")
print_message "新版本: $new_version"

# 提交版本更改
print_step "提交版本更改"
git add package.json
git commit -m "chore: bump version to $new_version"

# 创建并推送标签
print_step "创建标签 v$new_version"
git tag "v$new_version"

print_step "推送更改和标签到远程仓库"
git push origin "$current_branch"
git push origin "v$new_version"

print_message "✅ 版本发布完成！"
print_message "📦 新版本: $new_version"
print_message "🏷️  标签: v$new_version"
print_message "🚀 GitHub Actions 将自动开始构建和发布流程"
print_message "📋 请访问 https://github.com/lifang336/file-manage/actions 查看构建状态"
