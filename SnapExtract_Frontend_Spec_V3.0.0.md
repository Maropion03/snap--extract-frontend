# SnapExtract 前端规格说明 V3.0.0

| 版本 | 时间 | 修订人 | 备注 |
|------|------|--------|------|
| V2.0.0 | 2026/05/06 | Codex | 场景首页 + 统一内核架构 |
| V3.0.0 | 2026/05/07 | Codex | 解析对照页主导：首页 = 解析能力演示，场景 = 二级分析；单屏约束 |

> **配套文档**：[SnapExtract_PRD_V2.3.0.md](./SnapExtract_PRD_V2.3.0.md)
> **实施载体**：单文件 `snapextract_v3.html`（Tailwind CDN + 原生 JS + Lucide icons + Inter / JetBrains Mono）

---

## 一、视觉系统（沿用 V2.0.0，不变）

### 1.1 设计 token

```css
:root{
  /* 底色 */
  --bg-0:    #08090A;   /* 页面底 */
  --bg-1:    #0E1013;   /* 卡片 / 面板底 */
  --bg-2:    #14171B;   /* 浮起层 / hover */
  --bg-3:    #1B1F25;   /* 输入框 / 内嵌 */

  /* 分割线 */
  --line-1:  rgba(255,255,255,.06);
  --line-2:  rgba(255,255,255,.10);
  --line-3:  rgba(255,255,255,.16);

  /* 文本 */
  --t1:      #ECEDEE;
  --t2:      #9BA1A6;
  --t3:      #62676D;

  /* 品牌（焰橙 → 玫红 sunset） */
  --ba:      #FF7A18;
  --bb:      #FF2D87;
  --grad:    linear-gradient(135deg,#FF7A18 0%,#FF2D87 100%);
  --glow:    0 0 28px -6px #FF7A18, 0 0 64px -20px #FF2D87;

  /* 状态色（与品牌色刻意拉开亮度） */
  --ok:      #10B981;   /* 冷绿 */
  --warn:    #FACC15;   /* 纯黄（避开品牌橙） */
  --danger:  #DC2626;   /* 深 crimson */
}
```

### 1.2 字体

- Sans：`Inter` (400/500/600)
- Mono：`JetBrains Mono` (500)，用于 task_id / 状态码 / 章节标 / 数字
- 中文：`PingFang SC` 兜底

### 1.3 关键工具类（已存在 / 沿用）

`.chip` `.chip-{ok|warn|danger|brand|info}` · `.cta` · `.btn` `.btn-ghost` · `.iconbtn` · `.card` `.card-hover` · `.spotlight` `.surface-grad` · `.section-title` · `.dotgrid` · `.kbd` · `.text-grad` · `.ring-brand` · `.ticker` · `.pulse` · `.float-y` · `.scanbeam` · `.fade-in` · `.reveal` · `.numtile` · `.shimmer`

不引入新颜色 / 字体 / 工具类。

---

## 二、路由

| 路由 | 页面 | 说明 |
|---|---|---|
| `#/` | 解析对照页 | 新首页（V3.0.0 主体） |
| `#/scene/resume` | 简历场景 | 二级分析页 |
| `#/scene/contract` | 合同场景 | 二级分析页 |
| `#/scene/statement` | 对账单场景 | 二级分析页 |
| `#/scene/paper` | 论文场景 | 二级分析页（含 4 增强模块 modal） |
| `#/history` | 历史任务 | 沿用 V2.0.0，新增字段对齐 |
| `#/settings` | 设置中心 | 仍存在但 nav 中无入口（保留实现，预留备用） |

进入 `#/` 时若 `localStorage.snapextract_seen_splash` 不为 `1` → 弹 Splash Modal。

---

## 三、顶部导航 PageShell

### 3.1 最终结构

```html
<header class="sticky top-0 z-30 backdrop-blur bg-bg0/80 border-b border-line1">
  <div class="max-w-[1440px] mx-auto px-6 h-14 flex items-center justify-between gap-4">

    <!-- 左：logo（双击重弹 splash 彩蛋） -->
    <a href="#/" id="brand-logo">
      <span class="brand-mark"><!-- 渐变方块图标 --></span>
      <span>SnapExtract</span>
      <span class="hidden md:inline mono">AI Document Workbench</span>
    </a>

    <!-- 中：4 场景 chip -->
    <nav class="hidden lg:flex items-center gap-1">
      <a data-scn="resume"    class="scn-chip btn-ghost btn">简历</a>
      <a data-scn="contract"  class="scn-chip btn-ghost btn">合同</a>
      <a data-scn="statement" class="scn-chip btn-ghost btn">对账单</a>
      <a data-scn="paper"     class="scn-chip btn-ghost btn">论文</a>
    </nav>

    <!-- 右：仅历史 -->
    <div class="flex items-center gap-2">
      <a href="#/history" class="iconbtn" title="历史任务">
        <i data-lucide="clock"></i>
      </a>
    </div>

  </div>
</header>
```

### 3.2 logo 双击彩蛋

```js
let __lastLogoClick = 0;
document.getElementById('brand-logo').addEventListener('click', e=>{
  const now = Date.now();
  if (now - __lastLogoClick < 350){
    e.preventDefault();
    openSplashModal({ force: true });   // 强制再弹一次（不写 localStorage）
  }
  __lastLogoClick = now;
});
```

### 3.3 已删除项（注意：JS 里所有 DOM 引用必须一并清理）

- `#cmdk-btn`（搜索 ⌘K）
- `#demo-toggle` `#demo-dot` `#demo-label`（DEMO 切换）
- `[href="#/settings"]` 的 iconbtn（设置入口；路由本身保留）

`setDemoMode(on)` 函数保留作为 `SE.demoMode` 的内部 setter（仍可通过示例文件按钮等内部触发）。

---

## 四、Splash Modal

### 4.1 触发逻辑

```js
function maybeShowSplash(){
  if (location.hash !== '#/' && location.hash !== '') return;
  if (localStorage.getItem('snapextract_seen_splash') === '1') return;
  openSplashModal();
}

function openSplashModal({force} = {}){
  document.getElementById('splash').classList.add('show');
  document.body.style.overflow = 'hidden';
  if (!force) localStorage.setItem('snapextract_seen_splash','1');
}

function closeSplashModal(){
  document.getElementById('splash').classList.remove('show');
  document.body.style.overflow = '';
}
```

### 4.2 内容（保留现有 hero 整块）

把当前 `data-route="home"` section 内的 hero `<div id="hero">` 整块迁入 modal `<div id="splash" class="modal">` 容器，HTML 结构不变。

包含元素：
- `v2.0 chip` (`正式产品形态`)
- 主标 `h1` 「高敏文档，从此不再上云。」
- 副标 `p`「面向 AI PC 的高敏文档智能处理工作台。一个统一内核，承载四个独立场景：上传 · 理解 · 判断 · 带走。」
- 双 CTA：
  - **立即体验** → `closeSplashModal()`
  - **看演示** → `closeSplashModal()` + 自动载入示例文件 `sample_resume.pdf` + 触发解析 mock
- 三段 stats：38ms / 4 / 0（count-up）
- 实机演示屏 `#livedemo`（5 机位相机循环，不动）
- 底部 ticker（8 条不动）

### 4.3 关闭方式

- ✕ 按钮（modal 顶右角）
- ESC（document keydown 监听）
- 「立即体验」CTA
- 「看演示」CTA
- 点击背景遮罩 `.splash-backdrop`

### 4.4 样式（与 picker modal 同款）

```css
#splash{
  position: fixed; inset: 0; z-index: 60;
  display: none; align-items: center; justify-content: center;
}
#splash.show{ display: flex; }
.splash-backdrop{
  position: absolute; inset: 0;
  background: rgba(8,9,10,.78);
  backdrop-filter: blur(10px) saturate(120%);
}
.splash-panel{
  position: relative;
  width: 100%; max-width: 1280px;
  background: var(--bg-1);
  border: 1px solid var(--line-2);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 30px 80px -20px rgba(0,0,0,.6);
  /* 内层就是把现有 hero 整块挪进来 */
}
```

---

## 五、解析对照页（home）

### 5.1 整体布局（单屏 100vh）

```
┌─────────────────────────────────────────────────────────┐
│ 顶 nav (h=56)                                           │
├─────────────────────────────────────────────────────────┤
│ stepper (h=70)                                          │
├──────┬──────────────────────────────────────────────────┤
│side  │ ① 未解析    │ ② Tesseract  │ ③ SnapExtract       │
│ bar  │             │              │                     │
│(200) │             │              │                     │
│      │             │              │                     │
├──────┴──────────────────────────────────────────────────┤
│ 差异指标条 (h=60)                                       │
├─────────────────────────────────────────────────────────┤
│ ticker (h=32)                                           │
└─────────────────────────────────────────────────────────┘
```

容器：`<section data-route="home">` 内层 `<div class="parse-page">` 用 grid 划分高度。

### 5.2 顶部 stepper 组件

```html
<div class="parse-stepper">
  <div class="ps-step is-active" data-step="1">
    <span class="ps-num">01</span>
    <span class="ps-name">上传</span>
    <span class="ps-hint">PDF · DOC · 图片</span>
  </div>
  <div class="ps-line"></div>
  <div class="ps-step is-locked" data-step="2">
    <span class="ps-num">02</span>
    <span class="ps-name">解析对照</span>
    <span class="ps-hint">未解析 / Tesseract / SnapExtract</span>
  </div>
  <div class="ps-line"></div>
  <div class="ps-step is-locked" data-step="3">
    <span class="ps-num">03</span>
    <span class="ps-name">场景分析</span>
    <span class="ps-hint">字段 · 重点 · 总结</span>
  </div>
</div>
```

状态：`is-active`（当前）/ `is-done`（完成）/ `is-locked`（未解锁）。
连接线 `.ps-line` 在前一步 done 时填充品牌渐变（350ms ease）。

### 5.3 左 sidebar 组件

```html
<aside class="parse-sidebar" style="width:200px;">

  <div class="ps-block">
    <div class="ps-block-title">解析记录</div>
    <ul id="parse-recent">
      <!-- 最多 5 条；无记录时显示「还没有您的解析记录」 -->
    </ul>
  </div>

  <div class="ps-block">
    <div class="ps-block-title">示例文件</div>
    <ul id="parse-samples">
      <li data-sample="finance"><i data-lucide="file-text"></i>金融研报</li>
      <li data-sample="prospectus"><i data-lucide="file-text"></i>财报招股书</li>
      <li data-sample="paper"><i data-lucide="book-open-text"></i>学术论文</li>
      <li data-sample="patent"><i data-lucide="file-text"></i>专利文件</li>
      <li data-sample="textbook"><i data-lucide="book"></i>编程书</li>
      <li data-sample="exam"><i data-lucide="file-text"></i>各学科试卷</li>
      <li data-sample="workbook"><i data-lucide="file-text"></i>各学科练习册</li>
      <li data-sample="textbook-school"><i data-lucide="book"></i>各学科教科书</li>
      <li data-sample="scan"><i data-lucide="image"></i>扫描书</li>
      <li data-sample="invoice"><i data-lucide="file-text"></i>表格单据</li>
    </ul>
  </div>

</aside>
```

**无功能按钮**：去除上传 / 设置 / 反馈等。

### 5.4 中央三屏组件

```html
<div class="parse-3pane">

  <!-- 屏 1：未解析 -->
  <div class="ppane" id="pane-raw">
    <div class="ppane-toolbar">
      <button class="iconbtn"><i data-lucide="chevron-left"></i></button>
      <button class="iconbtn"><i data-lucide="chevron-right"></i></button>
      <span class="mono">1 / 1</span>
      <button class="iconbtn"><i data-lucide="zoom-in"></i></button>
      <button class="iconbtn"><i data-lucide="zoom-out"></i></button>
      <span class="ppane-title ml-auto">RAW · 未解析</span>
    </div>
    <div class="ppane-body" id="pane-raw-body">
      <!-- 上传前：拖拽提示 / 上传后：原文 PDF 渲染 -->
    </div>
  </div>

  <!-- 屏 2：Tesseract -->
  <div class="ppane" id="pane-tess">
    <div class="ppane-toolbar">
      <span class="ppane-title">TESSERACT · OCR</span>
      <span class="ppane-tag" id="pane-tess-tag">Standby</span>
    </div>
    <div class="ppane-body" id="pane-tess-body">
      <!-- 上传前：占位；解析中：shimmer；完成：碎片文本 -->
    </div>
  </div>

  <!-- 屏 3：SnapExtract -->
  <div class="ppane" id="pane-se">
    <div class="ppane-toolbar">
      <button class="ppane-tab is-active" data-tab="md-preview">MD-Preview</button>
      <button class="ppane-tab" data-tab="md-raw">MD-Raw</button>
      <button class="ppane-tab" data-tab="json">JSON</button>
      <span class="ppane-tag ml-auto" id="pane-se-tag">Standby</span>
    </div>
    <!-- 解析完成后顶部 CTA -->
    <div class="ppane-cta hidden" id="pane-se-cta">
      <span class="cta-prefix">✓ 识别为</span>
      <span class="cta-type" id="pane-se-type">合同</span>
      <a class="cta arrow-go" id="pane-se-link" href="#/scene/contract">
        进入合同场景分析 <i data-lucide="arrow-right"></i>
      </a>
    </div>
    <div class="ppane-body" id="pane-se-body">
      <!-- 上传前：占位；解析中：shimmer + scan beam；完成：结构化 markdown 渲染 -->
    </div>
  </div>

</div>
```

CSS 关键点：

```css
.parse-3pane{
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  height: 100%;        /* 充满剩余空间 */
  min-height: 0;
}
.ppane{
  display: flex; flex-direction: column;
  border: 1px solid var(--line-2);
  border-radius: 10px;
  background: var(--bg-1);
  overflow: hidden;
  min-height: 0;
}
.ppane-toolbar{
  display: flex; align-items: center; gap: 6px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--line-1);
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
}
.ppane-body{
  flex: 1; overflow: auto;
  padding: 14px;
}
.ppane-cta{
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255,122,24,.30);
  background: linear-gradient(135deg, rgba(255,122,24,.08), rgba(255,45,135,.04));
}
.ppane-cta.hidden{ display: none; }
```

### 5.5 底部差异指标条

```html
<div class="parse-diffbar">
  <div class="pdb-col">
    <div class="pdb-title">未解析</div>
    <div class="pdb-num">0</div>
    <div class="pdb-sub">字段抽取</div>
    <div class="pdb-extra">—</div>
  </div>
  <div class="pdb-col">
    <div class="pdb-title">Tesseract</div>
    <div class="pdb-num">12</div>
    <div class="pdb-sub">字段（碎片）</div>
    <div class="pdb-extra">准确率 64%</div>
  </div>
  <div class="pdb-col is-snap">
    <div class="pdb-title">SnapExtract</div>
    <div class="pdb-num gradient-text">8</div>
    <div class="pdb-sub">字段（结构化 + 红黄边界）</div>
    <div class="pdb-extra">准确率 96% · 含语义判断</div>
  </div>
</div>
```

数字按文件类型从 `DIFF_METRICS_BY_TYPE` 读取（见 §八）。

### 5.6 上传交互

支持的入口：
1. 拖拽文件到 `#pane-raw`（dragover / drop）
2. 点 `#pane-raw-body` 触发 `<input type="file">`
3. 截图后 `Ctrl+V` / `Cmd+V` paste（监听 paste 事件）
4. 点 sidebar `[data-sample]` 任意示例文件 → 自动载入预置数据

校验：
- 检查 MIME / 扩展名是否在支持列表
- 不通过 → toast 红色提示，不进入解析中

---

## 六、场景页（重构 — 单屏）

### 6.1 进入路径

| 来源 | 行为 |
|---|---|
| 解析对照页 SnapExtract 屏 CTA | 携带解析任务上下文跳转 `#/scene/{type}`，预填字段 |
| 顶 nav 4 chip | 跳转 `#/scene/{type}`；若无解析任务 → toast 「先在首页上传文件解析」+ 跳回 `#/` |
| 历史任务点击 | 重开任务，预填解析数据 |

### 6.2 单屏布局（沿用 V2.2.0 结构 + 高度收紧）

```
┌─────────────────────────────────────────────────────────┐
│ 顶 nav (56)                                             │
├─────────────────────────────────────────────────────────┤
│ scene header (40) + 6 步 timeline (60)                  │
├─────────┬───────────────────────────────────┬───────────┤
│ 主文件   │ baseline (折叠 32)               │ 视图清单  │
│ +补充    │ + 解析状态 (~140)                │ (col-3)   │
│ +预览    │ + 主结果摘要 (~120)              │           │
│ (col-3) │ ─────────────────────────         │           │
│         │ Layer 3：3 列子卡 (~140)          │           │
├─────────┴───────────────────────────────────┴───────────┤
│ ticker (32)                                             │
└─────────────────────────────────────────────────────────┘
```

总和约 580~640px，余 260~320px 给主区上下间隔。

### 6.3 已删除：导出产物

ActionBar 中 `[data-act="export"]` 按钮整体移除（HTML + JS 处理）。

剩余按钮：复制 / 重试 / 切换文件 / 返回首页。

### 6.4 字段级红黄

- 字段卡的 `.field-row` 增加 `data-alert="red|yellow"` 属性
- 行内显示 mono chip + tooltip
- 总结建议子卡顶部加 `<span class="chip">参考性判断 · 不构成确定结论</span>` 当 `st.degraded === true`

### 6.5 论文 4 增强模块 → modal 化

#### 6.5.1 入口
论文场景页右栏视图清单中 `lab-formula` / `lab-pdflayer` / `lab-heatmap` / `lab-point` 4 项。

#### 6.5.2 现有实现处置

V2.2.0 的实现是把 4 模块渲染到 `#vd-body`（场景页右栏视图详情面板）。V3.0.0 改为：

```js
// 旧 V2.2.0 行为（要替换）：
detailBody.innerHTML = r.view(st, key); // 直接写到右栏面板

// 新 V3.0.0 行为：
if (key.startsWith('lab-')) {
  openLabModal(key);   // 弹出全屏 modal，渲染到 modal 容器
} else {
  detailBody.innerHTML = r.view(st, key);
}
```

#### 6.5.3 Modal 结构

```html
<div id="lab-modal" class="modal">
  <div class="lab-modal-backdrop" data-close></div>
  <div class="lab-modal-panel">
    <div class="lab-modal-head">
      <span class="section-title" id="lab-modal-title"></span>
      <button class="iconbtn" data-close><i data-lucide="x"></i></button>
    </div>
    <div class="lab-modal-body" id="lab-modal-body">
      <!-- 4 模块对应 HTML（参见 V2.2.0 实现，复用 ID 结构） -->
    </div>
  </div>
</div>
```

ESC / ✕ / 背景点击 → 关闭，回到场景页主区。

---

## 七、状态机扩展

### 7.1 新增首页解析任务状态

挂在全局 `SE.parseTask`（独立于 4 个场景的 SE.state）：

```js
SE.parseTask = {
  task_id: null,
  state: 'idle',          // idle | validating | parsing | done | error
  file: null,             // {name, size, type}
  detected_type: null,    // 'resume' | 'contract' | 'statement' | 'paper' | null
  tess_progress: 0,       // 0..1
  se_progress: 0,         // 0..1
  tess_output: null,      // string
  se_output: null,        // {markdown, fields, decision}
  diff_metrics: null,     // see §八
  error: null,
};
```

### 7.2 状态切换

```
idle
  ↓ 上传 / 选示例文件
validating (~300ms)
  ↓ 校验通过
parsing
  ├── 即时：pane-raw 显示原文（也即"已完成"）
  ├── ~1.8s：tess_output 写入，tess_progress = 1
  └── ~3.5s：se_output 写入，se_progress = 1
  ↓ 三屏全部完成
done
  ├── stepper 第 2 步 done → 第 3 步 unlock
  ├── pane-se 顶部 CTA 显示
  └── diff_metrics 渲染到底部条
  ↓ 用户点 CTA
（跳转 #/scene/{detected_type}，parseTask 进入下游场景上下文）
```

### 7.3 切换文件 / 重置

`SE.parseTask = makeParseTask()` 重置全部，stepper 回到第 1 步。

---

## 八、Mock 数据 schema

### 8.1 文件类型识别（关键字 → 类型）

```js
const TYPE_KEYWORDS = {
  resume:    ['resume','cv','简历','candidate','applicant'],
  contract:  ['contract','agreement','nda','合同','协议','签'],
  statement: ['statement','bank','receipt','对账','流水','单据','票据'],
  paper:     ['paper','arxiv','attention','论文','nips','neurips','iclr','acl','cvpr'],
};

function detectType(filename){
  const lower = filename.toLowerCase();
  for (const [type, keys] of Object.entries(TYPE_KEYWORDS)){
    if (keys.some(k => lower.includes(k))) return type;
  }
  return 'paper'; // fallback
}
```

### 8.2 Tesseract mock 输出（按类型）

```js
const TESS_OUTPUT = {
  resume: `M . D oe
candidate@em ail.com    +86 13800138000
工作经验  5 年
学历: 硕 士  计算 机科学
            UCR
经历:
2023-至今    后端工程师  某科技公 司
        - 主导 分布 式任务 调度系 统
2020-2023   平 台研发    某互联 网公司
技能 G O Rust Postgr eSQL Kafk a
（OCR 识别于 12 个区域，行错位 / 个别字符识别错误）`,

  contract: `合 同编号: 2026 -SE 047
甲方: SnapExtract  Inc .
乙方: Acm e  Co.
标的: 提供 本地敏感 文档智 能处理服务
金额: USD 240, 000 / 年
期限: 12 个月
§4 付款 节点
§7 .2 终 止条款
§9 数 据所有权
§ 12 不 可抗力
违约 金: 合同金 额的 10 %`,

  statement: `日期       摘 要      收 入    支出     余额
2026-01- 04   工资        12,8 00            58 ,420
20 26-01-08   支付宝- 房租         5,8 00   52,620
2026-0 1-15   银行 手续费                12   52,608
20 26-01-21  利 息收入       38           52, 646
（识别 28 行流水 / 4 张手写单据，金额栏部分错位）`,

  paper: `Atte ntion Is All  You Ne ed
Ash ish  Vasw ani,  Noam  Shaze er,...
Abs tract:
We  pr opose  the Tra nsformer , a no vel
network architecture ba sed solely on
attentio n mech anisms, dispens ing with
recurrence and convolutio ns ent irely.
3.2 .1 Sca led Dot- Product  Atten tion
At tention(Q,K, V) = soft max(QK ⊤ /√d_k)V
（论文文本被切成 280 个碎片，公式格式破坏）`,
};
```

### 8.3 SnapExtract mock 输出（按类型 — markdown）

```js
const SE_OUTPUT = {
  resume: {
    markdown: `# 候选人摘要
**M. Doe** · 后端工程师 · 5 年经验

## 基础信息
| 字段 | 值 |
|---|---|
| 姓名 | M. Doe |
| 学历 | 硕士 · 计算机科学（UCR） |
| 工作年限 | 5 年 |
| 当前公司 | 某科技公司 |
| 技能 | Go · Rust · PostgreSQL · Kafka |

## 综合评价
技术深度合格，平台经验扎实。:warning: 缺少团队 lead 经验。`,
    fields: { /* 按 PRD V2.2.0 §3.1.8 schema */ },
    decision: 'pending',
    detected_type: 'resume',
  },
  contract: { /* ... */ },
  statement: { /* ... */ },
  paper: { /* ... */ },
};
```

### 8.4 差异指标（按类型）

```js
const DIFF_METRICS = {
  resume:    { tess: {n:14, acc:62}, se: {n:10, acc:96} },
  contract:  { tess: {n:18, acc:58}, se: {n:11, acc:94} },
  statement: { tess: {n:36, acc:71}, se: {n:14, acc:97} },
  paper:     { tess: {n:280,acc:64}, se: {n: 8, acc:96} },
};
```

### 8.5 解析时间预设

```js
const PARSE_TIMING = {
  validating: 300,     // ms
  tess_done:  1800,    // ms (Tesseract 输出完成)
  se_done:    3500,    // ms (SnapExtract 输出完成)
};
```

### 8.6 示例文件 → 类型映射

```js
const SAMPLE_TO_TYPE = {
  finance:         'paper',       // 金融研报当论文处理
  prospectus:      'paper',
  paper:           'paper',
  patent:          'paper',
  textbook:        'paper',
  exam:            'paper',
  workbook:        'paper',
  'textbook-school':'paper',
  scan:            'resume',      // 扫描书走简历演示
  invoice:         'statement',   // 表格单据走对账单演示
};
```

> 注：示例文件类型大多落到 paper / resume / statement，因为用户提供的示例大多是文档类素材。需要时可以扩展。

---

## 九、交互动画清单

### 9.1 沿用既有

- `.reveal` stagger 入场（IntersectionObserver + rAF 兜底，已实现）
- `.spotlight` conic 描边扫光 + cursor light（已实现）
- `.cta` 持续 shine sweep（已实现）
- `.pulse` 同心圆扩散（已实现）
- `.ticker` 40s 循环跑马灯（已实现）
- `.scanbeam` 扫描光束（已实现）
- `.shimmer` 占位条带流光（已实现）
- `.float-y` 浮动卡片（已实现）

### 9.2 新增

- **stepper 进度填充**：`.ps-line` 完成时 `transform: scaleX(1)` 350ms ease；当前步 num 圈品牌渐变 + glow
- **三屏内容入场**：每屏完成解析时整体 fade-up + opacity 0→1（350ms cubic-bezier(.25,.1,.25,1)）
- **Tesseract 碎片乱序入场**：每行带 30ms 错时延迟，从 `opacity:0; translateY(4px)` 入
- **SnapExtract markdown 入场**：先扫描光束扫一遍，然后内容整体显出 + 字段卡逐张 fade
- **CTA 出现**：`#pane-se-cta` 从顶部 slide down + glow flash（450ms）
- **Splash modal**：与 picker 同款（背景模糊 + 面板下沉淡入 350ms）
- **Lab modal**：与 splash 同款的进入退出，但面板更大（max-width: 1080px）

---

## 十、实现路线（7 phase，含当前状态）

### Phase 1 · 顶 nav 精简 ✅ 已完成

- 删除 cmdk-btn / demo-toggle / 设置入口
- 清理对应 JS 引用
- 保留 `setDemoMode` 作为内部 flag

### Phase 2 · Splash Modal ☐ 待开

1. 在 `<body>` 内插 `<div id="splash" class="modal">` 容器
2. 把现有 `data-route="home"` section 内的 `<div id="hero">` 整块剪切迁入
3. 写 `openSplashModal` / `closeSplashModal`
4. 在 `DOMContentLoaded` 末尾调用 `maybeShowSplash()`
5. 实现 logo 双击彩蛋
6. ESC / 背景点击关闭

**验收**：清 localStorage 后刷新 `#/` → modal 弹；关闭后刷新 → 不再弹；双击 logo → 重弹。

### Phase 3 · 解析对照页骨架 ☐ 待开

1. 在 `<section data-route="home">` 删除现有 4 主文件上传卡 + 最近任务 + 推荐演示等
2. 替换为新结构：parse-stepper / parse-sidebar / parse-3pane / parse-diffbar
3. 加 CSS（按 §五）
4. sidebar 渲染最近任务 + 示例文件列表
5. 三屏空状态 / 占位
6. 单屏约束（grid 划分高度）

**验收**：`#/` 进入后看到完整三屏 + sidebar + stepper，1440 × 900 不滚动。

### Phase 4 · Mock 解析引擎 ☐ 待开

1. `SE.parseTask` 状态管理
2. 上传 / 拖拽 / 粘贴 / 示例文件 4 种触发路径
3. 校验 → 解析中 → 三屏错时填充
4. shimmer 进度条 + 扫描光束动画

**验收**：上传任意文件，三屏依次完成解析，stepper 推进到第 2 步 done。

### Phase 5 · 自动识别 + 跳转 CTA ☐ 待开

1. `detectType(filename)` 实现
2. SnapExtract 屏顶部 CTA 显示
3. CTA 点击 → `#/scene/{type}`
4. 解析 task 上下文传递到场景页（`SE.state[type].main_file = SE.parseTask.file`）

**验收**：上传 `acme_nda.pdf` → 识别为合同 → CTA 「→ 进入合同场景分析」点击进入对应场景，主文件预填。

### Phase 6 · 场景页改单屏 ☐ 待开

1. 删除 ActionBar 中导出按钮
2. Layer 3 三列子卡高度收紧
3. 字段级红黄改行内 chip
4. 整体高度审查，确保 1440 × 900 不滚

**验收**：4 个场景页在 1440 × 900 均不滚动，无导出按钮。

### Phase 7 · 论文 4 增强模块 modal 化 ☐ 待开

1. 新建 `<div id="lab-modal">` 容器
2. 修改 `renderViewList` 中 lab.* 视图项的点击行为：写入 `#vd-body` → 改为弹 `openLabModal(key)`
3. lab modal 内复用现有 4 模块 HTML（同 ID 结构 → start* 函数仍可绑定）
4. ESC / 背景关闭

**验收**：论文场景点 4 个 lab.* 视图项 → 弹出全屏 modal；ESC 关闭；交互完整。

---

## 十一、当前文件状态（2026-05-07 截止）

### 11.1 路径

- 主原型：`/Users/medusa/Desktop/snap Extract/snapextract_v3.html`
- 备份：`/Users/medusa/Desktop/snap Extract/snapextract_v2.html`（V1 演示版，不动）
- PRD：`/Users/medusa/Desktop/snap Extract/SnapExtract_PRD_V2.3.0.md`
- 本文档：`/Users/medusa/Desktop/snap Extract/SnapExtract_Frontend_Spec_V3.0.0.md`
- 工作日志：`/Users/medusa/Desktop/snap Extract/DEVLOG.md`

### 11.2 已完成模块（保留，不动）

- 视觉系统 + 设计 token + 字体 + Tailwind config
- PageShell（顶 nav，已精简）
- hash 路由 + showRoute / navigate
- 场景选择 modal（picker）— 但 V3.0.0 后用户基本不需要主动打开它，可保留作为彩蛋入口
- 历史任务页 / 设置中心（路由保留）
- 实机演示屏（5 机位相机循环）— 即将迁入 splash
- Ticker 8 条循环
- 4 个场景的 mock 数据（PRD V2.2.0 字段表）
- 4 个场景的 SCENE_RENDERERS（headline / fields / keyJudgment / summaryDecision / view）
- 6 步 timeline 渲染
- 论文 4 增强模块（公式翻转 / PDF 分层 / 热力图 / 指点提问）

### 11.3 待删除 / 替换

| 项 | 现状 | 处置 |
|---|---|---|
| 首页 4 主文件上传卡（`#scn-cards`） | 渲染中 | Phase 3 删除 |
| 首页最近任务（`#recent-list`） | 渲染中 | Phase 3 移到 sidebar |
| 首页推荐演示（`#demo-list`） | 渲染中 | Phase 3 移到 sidebar 示例文件 |
| 首页 hero（`#hero`） | 渲染中 | Phase 2 整块迁入 splash |
| 场景页 ActionBar 导出按钮 | 渲染中 | Phase 6 删除 |
| `renderViewList` 中 lab.* 写入 `#vd-body` 的逻辑 | 已实现 | Phase 7 改为 `openLabModal` |

### 11.4 关键 CSS / class 命名约定（新增）

| 前缀 | 用途 |
|---|---|
| `parse-*` | 解析对照页相关组件 |
| `ps-*` | parse stepper / sidebar |
| `ppane-*` | parse pane（三屏单屏） |
| `pdb-*` | parse diff bar |
| `splash-*` | splash modal |
| `lab-modal-*` | lab modal 容器 |
| `lab-*` | 4 增强模块（已存在，沿用） |

---

## 十二、风险与注意

1. **localStorage 标记**：测试时记得清 `localStorage.snapextract_seen_splash`，否则不会再看到 splash。
2. **三屏单屏自适应**：屏宽 < 1280 时三栏会挤；建议 < 1280 时整屏 fallback 到「警告：请在 1280px+ 桌面浏览器查看演示」或叠成三行（演示不需要支持小屏，PRD 默认假设 ≥ 1440 × 900）。
3. **Tesseract / SE 时序竞态**：用户在解析中再次上传新文件 → 必须 `clearTimeout` 旧任务的所有定时器，否则旧的 mock 输出会污染新任务。统一通过 `SE.parseTask.task_id` 比对，过期回调直接 return。
4. **场景页 main_file 来源**：解析对照页跳转过来时，scene 的 main_file 来自 `SE.parseTask.file`；从历史任务跳转时，main_file 来自历史记录。两条路径要在 `renderScene` 入口统一处理。
5. **示例文件载入要触发完整解析动画**：不要直接跳过 parsing 状态，否则评委看不到对照演示。即便是预置数据，也要走完 1.8s + 3.5s 的错时填充。
6. **Lab modal 进入退出动画**：必须在 modal 完全打开后才调用 `startLabFormula` 等绑定函数（用 rAF 延迟），否则 querySelector 找不到 DOM。
7. **logo 彩蛋不要写 localStorage**：双击重弹 splash 时不要再写 `seen_splash=1`（已是 1，无影响），但需保证状态不污染下次正常访问。
