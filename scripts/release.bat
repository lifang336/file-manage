@echo off
setlocal enabledelayedexpansion

REM 智能文件管理器版本发布脚本 (Windows)
REM 使用方法: scripts\release.bat [patch|minor|major]

echo [INFO] 智能文件管理器版本发布脚本

REM 检查是否在git仓库中
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo [ERROR] 当前目录不是git仓库
    exit /b 1
)

REM 检查工作区是否干净
git diff-index --quiet HEAD --
if errorlevel 1 (
    echo [ERROR] 工作区有未提交的更改，请先提交或暂存更改
    exit /b 1
)

REM 获取版本类型参数
set VERSION_TYPE=%1
if "%VERSION_TYPE%"=="" set VERSION_TYPE=patch

if not "%VERSION_TYPE%"=="patch" if not "%VERSION_TYPE%"=="minor" if not "%VERSION_TYPE%"=="major" (
    echo [ERROR] 无效的版本类型: %VERSION_TYPE%
    echo [INFO] 使用方法: %0 [patch^|minor^|major]
    exit /b 1
)

REM 获取当前版本
for /f "tokens=*" %%i in ('node -p "require('./package.json').version"') do set current_version=%%i
echo [INFO] 当前版本: %current_version%

REM 更新版本号
echo [STEP] 更新版本号 (%VERSION_TYPE%)
call pnpm version:%VERSION_TYPE% --no-git-tag-version

REM 获取新版本号
for /f "tokens=*" %%i in ('node -p "require('./package.json').version"') do set new_version=%%i
echo [INFO] 新版本: %new_version%

REM 提交版本更改
echo [STEP] 提交版本更改
git add package.json
git commit -m "chore: bump version to %new_version%"

REM 创建并推送标签
echo [STEP] 创建标签 v%new_version%
git tag "v%new_version%"

REM 获取当前分支
for /f "tokens=*" %%i in ('git branch --show-current') do set current_branch=%%i

echo [STEP] 推送更改和标签到远程仓库
git push origin %current_branch%
git push origin "v%new_version%"

echo [INFO] ✅ 版本发布完成！
echo [INFO] 📦 新版本: %new_version%
echo [INFO] 🏷️  标签: v%new_version%
echo [INFO] 🚀 GitHub Actions 将自动开始构建和发布流程
echo [INFO] 📋 请访问 https://github.com/lifang336/file-manage/actions 查看构建状态

pause
