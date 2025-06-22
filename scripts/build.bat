@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo 🚀 开始构建智能文件管理器...

REM 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

REM 检查 pnpm
where pnpm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到 pnpm，请先安装 pnpm
    echo    安装命令: npm install -g pnpm
    pause
    exit /b 1
)

REM 安装依赖
echo 📦 安装依赖...
call pnpm install
if %errorlevel% neq 0 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)

REM 构建应用
echo 🔨 构建应用...
call pnpm run build
if %errorlevel% neq 0 (
    echo ❌ 应用构建失败
    pause
    exit /b 1
)

REM 根据参数选择打包平台
if "%1"=="mac" (
    echo 🍎 打包 macOS 版本...
    call pnpm run dist:mac
) else if "%1"=="win" (
    echo 🪟 打包 Windows 版本...
    call pnpm run dist:win
) else if "%1"=="all" (
    echo 🌍 打包所有平台版本...
    call pnpm run dist:all
) else (
    echo 📋 使用方法:
    echo   scripts\build.bat mac    # 打包 macOS 版本
    echo   scripts\build.bat win    # 打包 Windows 版本
    echo   scripts\build.bat all    # 打包所有平台版本
    echo.
    echo 🔧 或者直接使用 pnpm 命令:
    echo   pnpm run dist:mac         # 打包 macOS 版本
    echo   pnpm run dist:win         # 打包 Windows 版本
    echo   pnpm run dist:all         # 打包所有平台版本
    echo   pnpm run pack             # 仅打包不压缩（用于测试）
    pause
    exit /b 1
)

if %errorlevel% neq 0 (
    echo ❌ 打包失败
    pause
    exit /b 1
)

echo ✅ 打包完成！输出目录: release\
echo 📁 查看打包结果: dir release\
pause
