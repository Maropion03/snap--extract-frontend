# SnapExtract V2.2.0 标准示例文件检索清单

基于 `/Users/medusa/Desktop/snap Extract/SnapExtract 产品需求文档 V2.2.0 (1).pdf` 中四个主场景与补充材料要求整理。

## 1. 结论先看

如果你现在是为了比赛演示快速组一套公开样例，最建议先用下面这组：

1. 简历主文件: UCR Arts Resume Sample
2. JD 补充材料: Cleveland State University Sample Job Description
3. 我方合同: City of Oakland Professional Service Agreement
4. 对方合同/补充对照: Mississippi Sample Contract
5. 手写单据: University of Michigan Handwritten Receipt Example
6. 银行对账单: Texas Education Agency Sample Bank Statement
7. 目标论文: Attention Is All You Need
8. 论文增强备选: OCR-free Document Understanding Transformer

这组的优点是：

- 全部是公开网页或 PDF，可直接引用
- 结构比较标准，字段清晰，适合做 `baseline -> SnapExtract` 对照
- 论文和文档理解方向与产品定位相关，评委更容易理解

## 2. 按场景整理

### A. 简历场景

#### 主文件: 简历

1. UCR Arts Resume Sample
   - 链接: https://careers.ucr.edu/media/3116/download?attachment=
   - 来源页: https://careers.ucr.edu/document/artsresumesample2023pdf
   - 适配原因:
     - 标准单页英文简历
     - 包含教育、经历、技能，适合抽 `name / education / current_title / skills / projects`
     - 文本密度适中，适合演示“结构化提取 + 初筛判断”
   - 风险:
     - 偏艺术方向，不如技术岗简历适合展示 JD 匹配

2. UT Dallas Resume Guide / Example Resumes
   - 来源页: https://career.utdallas.edu/career-resource-library/resume-and-cover-letter/
   - 适配原因:
     - 学校官方求职中心材料，格式标准
     - 页面里同时有模板和示例，方便后续替换成更贴近目标岗位的版本
   - 风险:
     - 示例文件落在 Box，可能有访问限制

#### 补充材料: JD

1. Cleveland State University Sample Job Description
   - 链接: https://www.csuohio.edu/sites/default/files/Sample%20job%20description.pdf
   - 适配原因:
     - 结构标准，包含 `POSITION TITLE / SUMMARY / RESPONSIBILITIES / QUALIFICATIONS / SKILLS`
     - 适合演示 JD 补充后生成 `job_match_summary / interview_focus`
   - 风险:
     - 内容较模板化，最好后续替换成更真实的 AI PM / 前端岗位 JD

### B. 合同场景

#### 主文件: 我方合同

1. City of Oakland Professional Service Agreement
   - 链接: https://www.oaklandca.gov/files/assets/city/v/1/workplace-employment-standards/documents/sample-professional-services-and-specialized-agreement.pdf
   - 来源页: https://www.oaklandca.gov/Business/For-Business-Owners/Neighborhood-Business-Assistance/Sample-Contract-Agreements
   - 适配原因:
     - 政府公开样本，条款完整
     - 明确包含 `Scope / Term / Compensation / Confidential Information / Insurance / Indemnification`
     - 很适合抽取 `party_a / party_b / subject / clauses / risk_points`
   - 风险:
     - 文件较长，演示时建议只截取关键页做 baseline 对照

#### 补充材料: 对方合同

1. State of Mississippi Sample Contract
   - 链接: https://www.dfa.ms.gov/sites/default/files/Office%20of%20Purchasing%2C%20Travel%20and%20Fleet%20Home/Purchasing%20and%20Contracting/Current%20Bids%20and%20Proposals/Water%20Treatment%20Chemicals/Sample%20Contract_WaterTreatmentChemicals.pdf
   - 适配原因:
     - 同样是公开正式合同文本
     - 具备 `scope / payment terms / cancellation / assignment` 等典型对比位
     - 适合做双合同差异对照视图
   - 风险:
     - 品类是水处理化学品采购，业务语义偏采购，不是最理想的商业合作合同

### C. 对账单场景

#### 主文件: 手写单据

1. University of Michigan Handwritten Receipt Example
   - 链接: https://ssc.umich.edu/wp-content/uploads/2019/08/Updated-Handwritten-Receipt-.pdf
   - 适配原因:
     - 官方公开“手写收据示例”
     - 明确包含 `Transaction Date / To and From Destinations / Proof of Payment / Vendor Name`
     - 很适合做“先识别手写单据”的主路径演示
   - 风险:
     - 这是费用/差旅型手写收据，不是零售票据；交易字段不够丰富

#### 补充材料: 银行对账单

1. Texas Education Agency Sample Bank Statement
   - 链接: https://www.txcte.org/sites/default/files/resources/documents/Sample-Bank-Statement.pdf
   - 适配原因:
     - 标准对账单模板，具备 `statement period / deposits / debits / balance`
     - 适合你们做一版本地填充后的脱敏样例
   - 风险:
     - 当前是空模板，没有真实交易行
     - 直接拿来演示“匹配与验算”不够强

2. South Dakota Mines Sample Bank Statement
   - 链接: https://www.sdsmt.edu/admissions-aid/assets/pdf-files/Sample%20Bank%20Statement.pdf
   - 适配原因:
     - 学校官方样例，格式规范
     - 可作为“银行证明/账户证明”类文档测试补充
   - 风险:
     - 这是资金证明型 bank statement，不是交易流水型 statement
     - 不适合直接承担 `statement_entries / matched_pairs / calc_metrics`

结论:

- 对账单场景里，`手写单据` 公开样例能找到
- `银行流水型对账单` 的高质量公开标准样例比较少
- 如果你要把这个场景做强，建议直接用模板本地合成一份脱敏版交易流水 PDF

### D. 论文 / 长 PDF 场景

#### 主文件: 目标论文

1. Attention Is All You Need
   - 链接: https://arxiv.org/pdf/1706.03762.pdf
   - 来源页: https://arxiv.org/abs/1706.03762
   - 适配原因:
     - 公开、稳定、经典
     - 含摘要、章节、表格、公式，适合演示长 PDF 解析
     - 评委基本都知道，沟通成本低
   - 风险:
     - 不是文档理解方向论文，和 SnapExtract 的产品语义关联中等

2. OCR-free Document Understanding Transformer
   - 链接页: https://arxiv.org/abs/2111.15664
   - HTML 阅读页: https://ar5iv.labs.arxiv.org/html/2111.15664
   - 适配原因:
     - 主题与文档理解、OCR 替代高度相关
     - 文中明确涉及 receipts、invoices、JSON structured output，和产品叙事贴得很近
     - 更适合演示“相关性判断 / 可借鉴点”
   - 风险:
     - 比 `Attention Is All You Need` 更技术向，非技术评委未必立刻熟悉

## 3. 对 PRD 的对应关系

### 简历

- PRD 要求: `信息卡片、综合评价、面试问题、初筛结论`
- 当前最合适组合: `UCR Resume + CSU JD`

### 合同

- PRD 要求: `信息提取、风险点识别、建议、合同判断摘要`
- 当前最合适组合: `Oakland PSA + Mississippi Sample Contract`

### 对账单

- PRD 要求: `手写单据识别 + 银行对账单结构化 + 比对 + 验算 + 分析`
- 当前最合适组合: `Michigan 手写收据 + 本地合成脱敏银行流水 PDF`
- 说明: 这一场景公开标准样例最弱，建议你们自己造一份高质量脱敏流水

### 论文

- PRD 要求: `研究问题、方法、核心结果、参考价值、相关性判断、可借鉴点`
- 当前最合适组合:
  - 主演示文件: `Attention Is All You Need`
  - 增强演示文件: `OCR-free Document Understanding Transformer`

## 4. 最后的建议

如果你是为了这版比赛演示，我建议：

1. 先直接采用上面 8 个链接作为公开素材池
2. 对账单场景不要硬找公开真实流水，直接本地生成一份脱敏交易样例
3. 简历场景最好再补一份更贴 AI PM / 前端岗位的 JD
4. 论文场景用 `Attention Is All You Need` 做主路径，用 `Donut` 做“相关性判断”增强样例

如果你下一步要，我可以继续直接帮你做两件事之一：

1. 把这份清单再压成一版“最终推荐 4 套演示素材组合”
2. 继续帮你把这些链接里的文件下载到本地并整理成 demo 素材包
