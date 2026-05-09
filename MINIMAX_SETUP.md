# SnapExtract MiniMax 接入说明

## 1. 配置文件

复制模板文件：

```bash
cp snapextract_minimax_config.example.json snapextract_minimax_config.json
```

然后填写：

- `api_key`: 你的 MiniMax API Key
- `api_base`: MiniMax OpenAI-compatible base URL
- `api_path`: 默认 `/chat/completions`
- `model`: 你要使用的模型名
- `fallback_models`: 当前模型不可用时的自动降级模型列表
- `port`: 本地代理端口，默认 `8765`
- `system_prompt`: 默认系统提示词

## 2. 启动代理

```bash
python3 proxy.py
```

启动后可检查健康状态：

```bash
curl http://127.0.0.1:8765/health
```

## 3. 连接演示页

打开：

`/Users/medusa/Desktop/snap Extract/snapextract_speed_demo.html`

点击 `⚡ 闪击解析`。

- 代理在线：页面会显示 `LIVE · via local proxy`
- 代理离线：页面会自动回退到 `MOCK · proxy offline`

## 4. 当前可用性判断

这套接法适合现在的目标：验证新增前端功能的整体可用性和演示感染力。

当前结论：

- 可用于 `流式输出 / 首字延迟 / 在线答案替换 mock` 的真接口验证
- 可用于判断 `闪击工作台`、`NPU 脉冲面板`、`双向高亮` 这类交互在真实输出下是否顺畅
- 不足以证明 `端侧 NPU` 真正参与了推理
- 不足以验证 `视觉输入`、`PDF/OCR`、`多文档比对` 的真实后端能力
- 更像“前端交互可用性验证层”，不是完整产品后端

## 5. 建议的验证顺序

先验证这 4 项：

1. `LIVE` 模式是否稳定返回流式文本
2. 首字延迟、tokens/s、wall-time 是否随真实输出变化
3. 页面在多次点击解析后是否会串状态
4. 代理异常时前端是否能平滑回退到 mock

如果这 4 项通过，说明新增前端功能的“演示可用性”基本成立。
