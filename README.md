# Chromatic Flow · V0.2

全屏三维粒子波浪壁纸，使用 GPU 实时生成。蓝紫、玫红、琥珀与青绿渐变；默认中密度（35,040 粒子）、65% 音乐响应、35% 待机速度、60% 亮度。无音乐时继续舒缓流动。

**[在线预览](https://zllyyy-ultra.github.io/chromatic-flow/)** · [验收记录](docs/VALIDATION.md) · [实现说明](docs/ARCHITECTURE.md)

![Chromatic Flow preview](preview.png)

## 浏览器运行

直接打开 index.html 即可离线运行，无 CDN、无运行依赖。也可使用 Node.js 22+：

```sh
npm start
# http://127.0.0.1:4173
npm test
npm run build
```

点击“模拟音乐预览”测试低、中、高频的视觉响应。模拟器生成频谱，不播放音乐，不代表浏览器可以捕获系统音频。H 收起面板，F 全屏，空格暂停；控件聚焦时保留原生键盘行为。?clean 从隐藏面板开始。

需要支持 WebGL 的浏览器。实际验证的环境和限制见验收记录。若出现初始化提示，请检查硬件加速和驱动。

## Wallpaper Engine 导入

1. 下载仓库 ZIP 并解压。保留同一目录内的 index.html、style.css、audio.js、app.js、project.json、preview.png。
2. 在 Wallpaper Engine 壁纸编辑器中新建 Web 壁纸，导入 index.html 及其关联资源。也可将文件夹复制到 wallpaper_engine/projects/myprojects/chromatic-flow/ 后在编辑器打开。
3. 编辑器若创建新的 project.json，保留本项目 general.properties 与 general.supportsaudioprocessing: true，保存并重新加载预览。
4. 播放系统音乐，确认启用 Wallpaper Engine 音频响应；调整音乐响应、流速、亮度与密度。宿主下网页面板自动隐藏，音频监听只注册一次。
5. 实机确认音频、暂停策略和 GPU 占用后再发布 Workshop。此版本提供可导入资源，不是已通过 Wallpaper Engine 实机认证的 V1。

npm run build 同时生成 dist/（Pages）和 wallpaper/（导入包）。成功的 GitHub Actions 运行也提供 chromatic-flow-wallpaper 下载附件。

## 部署

仓库 Settings → Pages → Source 选择 GitHub Actions。推送 main 自动执行音频测试、构建、上传导入包并部署 Pages。部署只包含明确列出的壁纸资源。可在 Actions 页面手动重新运行。

## V0.2 改进

- 透视三维曲面；WebGL 1 / GLSL ES 1.00，降低 WebGL2 限制。
- Shader 限制透明度，避免负数非整数幂；音频数值先校验和限幅。
- 立体声 64+64 频谱分为低、中、高频，按时间平滑；音频停止或断流后自然衰减。
- 每帧一次绘制，静态 UV 缓冲；只有密度变化时重新上传。像素比上限 1.5，总渲染像素约 360 万；点大小随像素比修正。
- 页面隐藏与宿主暂停时停止绘制；遵循宿主 FPS；支持图形上下文恢复。
- 提供预览控制、错误提示、导入元数据和自动部署。

## 隐私与范围

无录音、上传、遥测或外部请求。Wallpaper Engine 只提供本地频谱。本轮完成浏览器渲染和宿主接口模拟验收；系统音频、多显卡性能和 Wallpaper Engine 实机验收仍待完成。

接口依据：[音频可视化](https://docs.wallpaperengine.io/en/web/audio/visualizer.html)、[属性与暂停](https://docs.wallpaperengine.io/en/web/api/propertylistener.html)。
