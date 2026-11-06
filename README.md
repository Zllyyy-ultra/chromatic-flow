# Chromatic Flow · V0.3.1

音乐驱动的全屏粒子壁纸。默认 110,592 粒子，最高档 196,608；主形态与全屏流动粒子层共同覆盖四角和边缘。

[在线预览](https://zllyyy-ultra.github.io/chromatic-flow/?v=0.3.1) · [本轮验收](docs/V0.3.1.md)

## 效果与控制

- 流光丝带、星际旋涡、漂浮星云，可自动交融或手动选择。
- 极光、落日、深海、绯梦四套流动配色；柔光、星芒、光环三种粒子外观。
- 音乐响应默认 65%，空间舒展默认 75%。无音频时舒缓流动。
- 主面板直接调节密度：轻盈 49,152 / 充盈 110,592 / 繁星 196,608。
- H 隐藏面板，F 全屏，空格暂停。模拟音乐只生成频谱，不播放或录制声音。

## 运行与构建

直接打开 index.html，或使用 Node.js 22+：

```sh
npm start
npm test
npm run build
```

本地地址 http://127.0.0.1:4173 。构建生成 dist/ 和 wallpaper/，无 CDN、无运行依赖。

## Wallpaper Engine

解压 Actions 中的 chromatic-flow-wallpaper 附件，或使用构建后的 wallpaper/ 目录。将 index.html 和 style.css、audio.js、evolution.js、app.js、project.json 一同导入 Web 壁纸编辑器。

若编辑器重新生成 project.json，保留 general.properties 与 general.supportsaudioprocessing: true，保存并重新加载。宿主下网页面板自动隐藏，在宿主属性中调节。当前包不包含预览缩略图，可在编辑器内保存封面。

## 验证与部署

7 项 Node 测试和 20 项浏览器检查通过。npm start 后打开 /tests/visual.html，检查三种形态的 8×6 全屏分块覆盖、所有外观、音频与断流、属性限幅、最高档、暂停和上下文恢复。该测试页面不进入部署包。

main 推送自动测试、构建并部署 GitHub Pages，Source 选择 GitHub Actions。

增加粒子会增加 GPU 工作量；保持单次绘制、静态缓冲和内部像素预算。浏览器检查不能替代各显卡实测；真实 Wallpaper Engine 系统音频与长期 GPU 占用仍待验证。

无录音、上传或遥测。此前 B 站参考在本环境无法播放，效果依据用户的描述与后续反馈开发。
