#!/usr/bin/env python3
"""SnapExtract demo · 本地 MiniMax 代理

用途：
  浏览器端 HTML 无法安全持有 API Key，这里开一个本地 HTTP 代理：
    browser  →  http://localhost:8765/chat  →  MiniMax (OpenAI-compatible)

配置方式（二选一）：
  1. 复制 snapextract_minimax_config.example.json 为 snapextract_minimax_config.json 并填写
  2. 使用环境变量覆盖：
       export MINIMAX_API_KEY="你的key"
       export MINIMAX_API_BASE="https://api.minimax.chat/v1"
       export MINIMAX_API_PATH="/chat/completions"
       export MINIMAX_MODEL="abab6.5s-chat"
       export PORT="8765"

运行：
  python3 proxy.py

打开 snapextract_speed_demo.html，点「⚡ 闪击解析」即可看到真实流式输出；
代理未启动时 HTML 会自动回退到 mock 模式，不影响其它演示。
"""

import json
import os
import base64
import re
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

CONFIG_PATH = Path(__file__).with_name("snapextract_minimax_config.json")
DEFAULT_CONFIG = {
    "api_key": "",
    "api_base": "https://api.minimax.chat/v1",
    "api_path": "/chat/completions",
    "model": "MiniMax-M2.1-highspeed",
    "fallback_models": [
        "MiniMax-M2.1-highspeed",
        "MiniMax-M2.1",
        "MiniMax-M2",
    ],
    "host": "127.0.0.1",
    "port": 8765,
    "system_prompt": "你是 SnapExtract 端侧视觉理解助手，用简洁中文回答。",
}


def load_config():
    config = dict(DEFAULT_CONFIG)

    if CONFIG_PATH.exists():
        try:
            file_config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
        except Exception as exc:
            sys.stderr.write(f"error: failed to parse {CONFIG_PATH.name}: {exc}\n")
            sys.exit(1)
        if not isinstance(file_config, dict):
            sys.stderr.write(f"error: {CONFIG_PATH.name} must be a JSON object\n")
            sys.exit(1)
        config.update({k: v for k, v in file_config.items() if v not in (None, "")})

    env_map = {
        "MINIMAX_API_KEY": "api_key",
        "MINIMAX_API_BASE": "api_base",
        "MINIMAX_API_PATH": "api_path",
        "MINIMAX_MODEL": "model",
        "MINIMAX_SYSTEM_PROMPT": "system_prompt",
    }
    for env_name, key in env_map.items():
        value = os.environ.get(env_name)
        if value:
            config[key] = value

    port_value = os.environ.get("PORT")
    if port_value:
        config["port"] = int(port_value)
    host_value = os.environ.get("HOST")
    if host_value:
        config["host"] = host_value.strip()

    config["api_base"] = str(config["api_base"]).rstrip("/")
    api_path = str(config["api_path"]).strip()
    config["api_path"] = api_path if api_path.startswith("/") else f"/{api_path}"
    config["host"] = str(config.get("host") or "127.0.0.1").strip()
    config["port"] = int(config["port"])
    return config


CONFIG = load_config()
API_KEY = str(CONFIG["api_key"]).strip()
API_BASE = CONFIG["api_base"]
API_PATH = CONFIG["api_path"]
MODEL = CONFIG["model"]
PORT = CONFIG["port"]
HOST = CONFIG["host"]
SYSTEM_PROMPT = CONFIG["system_prompt"]
FALLBACK_MODELS = [
    m for m in CONFIG.get("fallback_models", []) if isinstance(m, str) and m.strip()
]

if not API_KEY:
    sys.stderr.write("error: MiniMax API key not configured\n")
    sys.stderr.write(
        f"hint: create {CONFIG_PATH.name} from snapextract_minimax_config.example.json "
        "or set MINIMAX_API_KEY\n"
    )
    sys.exit(1)


def sse(obj):
    return ("data: " + json.dumps(obj, ensure_ascii=False) + "\n\n").encode("utf-8")


def build_payload(body):
    prompt = build_grounded_prompt(body)
    messages = body.get("messages")
    model = body.get("model") or MODEL

    if isinstance(messages, list) and messages:
        payload_messages = messages
    else:
        system = body.get("system") or SYSTEM_PROMPT
        payload_messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ]

    result = {
        "model": model,
        "stream": True,
        "messages": payload_messages,
    }
    # Optional passthrough: settings-panel overrides
    for key in ("temperature", "max_tokens", "top_p"):
        val = body.get(key)
        if isinstance(val, (int, float)):
            result[key] = val
    return result


def read_uploaded_file(body):
    file_name = str(body.get("file_name") or "").strip()
    file_type = str(body.get("file_type") or "").strip()
    file_bytes_b64 = body.get("file_bytes_b64")

    if not file_name:
        return None

    if not isinstance(file_bytes_b64, str) or not file_bytes_b64:
        return {
            "name": file_name,
            "type": file_type or "application/octet-stream",
            "kind": "missing_bytes",
            "text": "",
            "error": "uploaded file bytes missing",
        }

    try:
        raw = base64.b64decode(file_bytes_b64)
    except Exception:
        return {
            "name": file_name,
            "type": file_type or "application/octet-stream",
            "kind": "invalid_bytes",
            "text": "",
            "error": "uploaded file bytes invalid",
        }

    lowered = file_name.lower()
    mime = file_type.lower()

    if mime.startswith("text/") or lowered.endswith((".txt", ".md", ".csv", ".json")):
        try:
            text = raw.decode("utf-8")
        except UnicodeDecodeError:
            text = raw.decode("utf-8", errors="ignore")
        return {
            "name": file_name,
            "type": file_type or "text/plain",
            "kind": "text",
            "text": text[:20000],
        }

    if mime == "application/pdf" or lowered.endswith(".pdf"):
        with tempfile.TemporaryDirectory(prefix="snapextract_pdf_") as tmpdir:
            pdf_path = Path(tmpdir) / "upload.pdf"
            txt_path = Path(tmpdir) / "upload.txt"
            pdf_path.write_bytes(raw)
            try:
                subprocess.run(
                    ["/opt/homebrew/bin/pdftotext", "-layout", str(pdf_path), str(txt_path)],
                    check=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                )
                text = txt_path.read_text(encoding="utf-8", errors="ignore")
                return {
                    "name": file_name,
                    "type": file_type or "application/pdf",
                    "kind": "pdf",
                    "text": text[:20000],
                }
            except Exception as exc:
                return {
                    "name": file_name,
                    "type": file_type or "application/pdf",
                    "kind": "pdf",
                    "text": "",
                    "error": f"pdf_extract_failed: {exc}",
                }

    if mime.startswith("image/") or lowered.endswith((".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".svg")):
        return {
            "name": file_name,
            "type": file_type or "image/*",
            "kind": "image",
            "text": "",
            "error": "image_understanding_not_enabled_in_current_backend",
        }

    return {
        "name": file_name,
        "type": file_type or "application/octet-stream",
        "kind": "generic",
        "text": "",
        "error": "unsupported_file_type_for_content_extraction",
    }


def build_grounded_prompt(body):
    prompt = str(body.get("prompt") or "").strip()
    uploaded = read_uploaded_file(body)

    if not uploaded:
        return prompt

    meta = [
        "你正在处理用户上传的文件。",
        f"文件名：{uploaded['name']}",
        f"文件类型：{uploaded['type']}",
        f"文件类别：{uploaded['kind']}",
    ]

    if uploaded.get("text"):
        return (
            "\n".join(meta)
            + "\n\n以下是抽取到的文件内容，请严格基于这些内容回答：\n"
            + uploaded["text"]
            + "\n\n用户问题：\n"
            + prompt
        )

    if uploaded.get("error"):
        return (
            "\n".join(meta)
            + "\n\n当前后端无法直接理解该文件内容，原因："
            + uploaded["error"]
            + "\n请明确说明当前能力边界，并尽量基于文件类型给出下一步建议。\n\n用户问题：\n"
            + prompt
        )

    return prompt


def extract_delta(obj):
    choices = obj.get("choices") or []
    if not choices:
        return None

    choice = choices[0] or {}
    delta = choice.get("delta")
    if isinstance(delta, dict):
        content = delta.get("content")
        if isinstance(content, str) and content:
            return content

    message = choice.get("message")
    if isinstance(message, dict):
        content = message.get("content")
        if isinstance(content, str) and content:
            return content

    return None


def extract_usage(obj):
    usage = obj.get("usage")
    if not isinstance(usage, dict):
        return None

    prompt_tokens = usage.get("prompt_tokens")
    completion_tokens = usage.get("completion_tokens")
    total_tokens = usage.get("total_tokens")
    cached_prompt_tokens = (
        usage.get("cached_prompt_tokens")
        if isinstance(usage.get("cached_prompt_tokens"), int)
        else usage.get("cache_creation_input_tokens")
        if isinstance(usage.get("cache_creation_input_tokens"), int)
        else usage.get("cache_read_input_tokens")
        if isinstance(usage.get("cache_read_input_tokens"), int)
        else usage.get("input_cached_tokens")
    )

    result = {}
    if isinstance(prompt_tokens, int):
        result["prompt_tokens"] = prompt_tokens
    if isinstance(completion_tokens, int):
        result["completion_tokens"] = completion_tokens
    if isinstance(total_tokens, int):
        result["total_tokens"] = total_tokens
    if isinstance(cached_prompt_tokens, int):
        result["cached_prompt_tokens"] = cached_prompt_tokens

    if result:
        if "total_tokens" not in result:
            result["total_tokens"] = result.get("prompt_tokens", 0) + result.get("completion_tokens", 0)
        return result
    return None


class ThinkStripper:
    def __init__(self):
        self.buffer = ""
        self.in_think = False

    def feed(self, chunk):
        if not chunk:
            return ""

        self.buffer += chunk
        out = []

        while self.buffer:
            if self.in_think:
                end = self.buffer.find("</think>")
                if end == -1:
                    keep = max(0, len("</think>") - 1)
                    if len(self.buffer) > keep:
                        self.buffer = self.buffer[-keep:]
                    return "".join(out)
                self.buffer = self.buffer[end + len("</think>") :]
                self.in_think = False
                continue

            start = self.buffer.find("<think>")
            if start == -1:
                safe_len = max(0, len(self.buffer) - (len("<think>") - 1))
                if safe_len:
                    out.append(self.buffer[:safe_len])
                    self.buffer = self.buffer[safe_len:]
                return "".join(out)

            if start > 0:
                out.append(self.buffer[:start])
            self.buffer = self.buffer[start + len("<think>") :]
            self.in_think = True

        return "".join(out)

    def flush(self):
        if self.in_think:
            return ""
        out = self.buffer.replace("<think>", "").replace("</think>", "")
        self.buffer = ""
        return out


def build_request(payload):
    return urllib.request.Request(
        f"{API_BASE}{API_PATH}",
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
        },
        method="POST",
    )


def estimate_tokens(text):
    if not isinstance(text, str) or not text:
        return 0
    cjk_count = sum(1 for ch in text if "\u3400" <= ch <= "\u9FFF")
    latin_words = len(re.findall(r"[A-Za-z0-9_]+", text))
    punctuation = len(re.findall(r"[^\sA-Za-z0-9_\u3400-\u9FFF]", text))
    return max(0, cjk_count + latin_words + (punctuation + 2) // 3)


def estimate_prompt_tokens(payload):
    messages = payload.get("messages") or []
    total = 0
    if isinstance(messages, list):
        for message in messages:
            if not isinstance(message, dict):
                continue
            content = message.get("content")
            if isinstance(content, str):
                total += estimate_tokens(content)
            elif isinstance(content, list):
                for part in content:
                    if isinstance(part, dict) and isinstance(part.get("text"), str):
                        total += estimate_tokens(part["text"])
    return total


def merge_usage_with_estimate(usage, prompt_tokens=None, completion_tokens=None):
    result = dict(usage or {})

    if isinstance(prompt_tokens, int) and "prompt_tokens" not in result:
        result["prompt_tokens"] = prompt_tokens
    if isinstance(completion_tokens, int) and "completion_tokens" not in result:
        result["completion_tokens"] = completion_tokens

    if "total_tokens" not in result:
        result["total_tokens"] = result.get("prompt_tokens", 0) + result.get("completion_tokens", 0)

    if result and not result.get("usage_source"):
        result["usage_source"] = "estimated" if not usage else "mixed"

    return result or None


def should_retry_model(error_text):
    text = (error_text or "").lower()
    return "not support model" in text or "unsupported model" in text


class H(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path != "/health":
            self.send_response(404)
            self.end_headers()
            return

        body = {
            "ok": True,
            "provider": "minimax",
            "api_base": API_BASE,
            "api_path": API_PATH,
            "model": MODEL,
            "port": PORT,
            "config_file": str(CONFIG_PATH),
        }
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self._cors()
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        if self.path != "/chat":
            self.send_response(404)
            self.end_headers()
            return

        length = int(self.headers.get("Content-Length", 0))
        try:
            body = json.loads(self.rfile.read(length) or b"{}")
        except Exception:
            self.send_response(400)
            self.end_headers()
            return

        payload = build_payload(body)
        estimated_prompt_tokens = estimate_prompt_tokens(payload)
        model_candidates = [payload["model"]] + [
            m for m in FALLBACK_MODELS if m != payload["model"]
        ]

        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream; charset=utf-8")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("X-Accel-Buffering", "no")
        self._cors()
        self.end_headers()

        last_error = None
        streamed = False
        for model_name in model_candidates:
            payload["model"] = model_name
            req = build_request(payload)
            stripper = ThinkStripper()
            latest_usage = None
            visible_output_parts = []
            try:
                sys.stderr.write(f"[proxy] upstream model try: {model_name}\n")
                with urllib.request.urlopen(req, timeout=90) as resp:
                    for raw in resp:
                        line = raw.decode("utf-8", errors="ignore").strip()
                        if not line or not line.startswith("data:"):
                            continue
                        s = line[5:].strip()
                        if s == "[DONE]":
                            try:
                                self.wfile.write(b"data: [DONE]\n\n")
                                self.wfile.flush()
                            except Exception:
                                pass
                            streamed = True
                            break
                        try:
                            obj = json.loads(s)
                            usage = extract_usage(obj)
                            if usage:
                                latest_usage = usage
                            delta = extract_delta(obj)
                            if delta:
                                visible = stripper.feed(delta)
                                if visible:
                                    visible_output_parts.append(visible)
                                    self.wfile.write(sse({"t": visible}))
                                    self.wfile.flush()
                                    streamed = True
                        except Exception:
                            continue
                    tail = stripper.flush()
                    if tail:
                        visible_output_parts.append(tail)
                        self.wfile.write(sse({"t": tail}))
                        self.wfile.flush()
                        streamed = True
                    completion_estimate = estimate_tokens("".join(visible_output_parts))
                    merged_usage = merge_usage_with_estimate(
                        latest_usage,
                        prompt_tokens=estimated_prompt_tokens,
                        completion_tokens=completion_estimate,
                    )
                    if merged_usage:
                        self.wfile.write(sse({"usage": merged_usage}))
                        self.wfile.flush()
                    if streamed:
                        return
            except urllib.error.HTTPError as e:
                msg = e.read().decode("utf-8", errors="ignore")[:400]
                last_error = f"upstream {e.code}: {msg}"
                sys.stderr.write(f"[proxy] upstream {e.code}: {msg}\n")
                if should_retry_model(msg) and model_name != model_candidates[-1]:
                    continue
                break
            except Exception as e:
                last_error = str(e)
                sys.stderr.write(f"[proxy] error: {e}\n")
                break

        try:
            self.wfile.write(sse({"err": last_error or "upstream request failed"}))
            self.wfile.flush()
        except Exception:
            pass

    def log_message(self, fmt, *args):
        sys.stderr.write("[proxy] " + (fmt % args) + "\n")


if __name__ == "__main__":
    print(f"[proxy] listening on http://{HOST}:{PORT}", file=sys.stderr)
    print(f"[proxy] base  = {API_BASE}", file=sys.stderr)
    print(f"[proxy] path  = {API_PATH}", file=sys.stderr)
    print(f"[proxy] model = {MODEL}", file=sys.stderr)
    print(f"[proxy] conf  = {CONFIG_PATH}", file=sys.stderr)
    ThreadingHTTPServer((HOST, PORT), H).serve_forever()
