# 应用图标资源

这个目录包含应用程序的图标文件，用于不同平台的打包。

## 需要的图标文件

### macOS
- `icon.icns` - macOS 应用图标（包含多种尺寸）

### Windows  
- `icon.ico` - Windows 应用图标（包含多种尺寸）

## 图标尺寸要求

### macOS (.icns)
应包含以下尺寸：
- 16x16
- 32x32
- 64x64
- 128x128
- 256x256
- 512x512
- 1024x1024

### Windows (.ico)
应包含以下尺寸：
- 16x16
- 32x32
- 48x48
- 64x64
- 128x128
- 256x256

## 生成图标文件

可以使用以下工具生成图标：

1. **在线工具**：
   - https://iconverticons.com/online/
   - https://convertio.co/

2. **命令行工具**：
   - `iconutil` (macOS)
   - `ImageMagick`

3. **设计软件**：
   - Adobe Illustrator
   - Sketch
   - Figma

## 临时图标

如果暂时没有图标文件，可以：
1. 从 package.json 中移除 icon 配置
2. 或者使用默认的 Electron 图标
