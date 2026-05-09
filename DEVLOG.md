# SnapExtract Frontend · 工作记录

单文件原型 `snapextract_v3.html`，对齐 PRD V2.2.0。

## 视觉系统

- 深底 `#08090A` + 焰橙 `#FF7A18` → 玫红 `#FF2D87` sunset 渐变
- Inter（Sans）+ JetBrains Mono（数值 / task_id / 章节标）
- 状态色刻意远离品牌区间：`#10B981` 冷绿 / `#FACC15` 纯黄 / `#DC2626` 深 crimson

## 已完成

### 首页

- Hero：主标 **「高敏文档，从此不再上云。」**，"从此不再上云。" 用品牌渐变作爆点；副标用 PRD 工作流叙事
- 4 张主文件上传槽位卡（简历 / 我方合同 / 手写单据 / 目标论文）— 上传后才点亮场景入口
- 最近任务 + 推荐演示 + 场景选择 modal
- 底部 Ticker 8 条循环：大赛归属 / 端侧推理 / 隐私不出本机 / 4 类高敏场景 / Hexagon NPU / 工作流 / 用户价值
- 右侧实机演示屏（ScreenStudio 风格相机）：5 机位 12 秒一轮，鼠标 SVG 指针 + 涟漪 + 对焦框，hover 暂停

### 场景页

- 顶部 6 步演示 timeline（PRD 2.2.3）：原始 → baseline → 补充 → 解析 → 结果 → 追问；baseline 默认折叠，DEMO 模式自动展开
- 三层结果区：左栏（主文件 / 补充槽位 / 预览）+ 中栏（baseline / 解析 / 三列子卡）+ 右栏（场景视图清单）
- 状态机按 PRD 2.3.2：`idle / scene_entered / baseline_viewing / supplement_added / parsing / result_ready / followup_active / error`

### 论文 4 增强模块（上传后解锁）

数据统一用 **Vaswani et al. "Attention Is All You Need" (NeurIPS 2017)**，4 模块从 4 个角度切看同一篇论文。

- **公式翻转卡**：4 个公式 tab（SDPA / Multi-Head / PE / FFN），3D 翻面看白话翻译 + 变量出处
- **PDF 分层视图**：正文 / 公式 / 图表 / 表格 4 层独立 toggle，按论文真实版面摆位
- **相关性热力图**：abstract 9 句，with/without 研究上下文即时重绘
- **指点提问**：Fig.1 / Eq.1 / Tab.2 / §3.5 四区域，4.5s 自动循环 + 答案打字

未上传主文件时 → 视图清单 4 项灰色 `🔒 需上传主文件`，详情面板显示「4 个增强模块待激活 + 返回首页上传」CTA。

### Mock 数据

按 PRD 3.x.8 字段表写：
- 简历：`name / education_top / work_years / skills / projects / job_match_summary / weak_phrases / interview_focus`
- 合同：`contract_type / party_a / party_b / clauses / risk_points / clause_diffs / negotiation_list`
- 对账单：`receipt_entries / statement_entries / matched_pairs / mismatch_items / calc_metrics`（**主文件 = 手写单据**，银行流水是补充）
- 论文：`target_paper_profile / paper_summary / user_research_context / relevance_judgement / reference_value`

## 待办

- [ ] BaselineCompare 三栏对照组件（无解析 / Tesseract / SnapExtract）
- [ ] 字段级红黄 chip + 「参考性判断」降级标签 — 字段就绪、UI 未挂出
- [ ] 导出 dropdown 按场景拆分 + 真实 MD/JSON/CSV/PNG 下载
- [ ] 隐私雷达浮动面板（PRIVACY RADAR）
- [ ] 历史 / 设置中心字段 schema 对齐新数据模型

## 注意点

- **"高级 / 增强 / 实验"能力默认放在场景页解锁路径里**，不在首页平铺（之前把 PAPER LAB 当首页功能介绍是错的）
- 对账单主文件是**手写单据**不是银行对账单（V2.0.0 实现刚好反了，V2.2.0 已纠正）
- 视觉系统已锁定，新增组件不引入新颜色 / 字体

## 文件路径

- 主原型：`/Users/medusa/Desktop/snap Extract/snapextract_v3.html`
- PRD V2.2.0：`/Users/medusa/Downloads/SnapExtract 产品需求文档 V2.2.0 (1).pdf`
- V1 备份（不动）：`/Users/medusa/Desktop/snap Extract/snapextract_v2.html`
