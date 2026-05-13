
/* ============================================================
   SnapExtract V3 — Single-file prototype
   Aligned with Frontend Spec V2.0.0
   ============================================================ */

/* SnapExtract V3 — aligned to PRD V2.2.0 (2026-05-06)
   Each scenario has a strict main_file (uploaded on Home) and an optional
   supplement (uploaded inside scene). Demo flow = 6 fixed steps. */
const SE = window.SE = {
  scenarios: {
    resume: {
      key:'resume', name:'简历', icon:'user-round',
      tagline:'快速判断候选人是否值得继续推进',
      desc:'解析简历、按 JD 收束判断、产出可直接用于初筛的卡片与问题清单。',
      main:   { name:'简历',     icon:'file-user',     hint:'PDF / DOCX · 候选人简历' },
      supp:   { name:'JD',       icon:'briefcase',     hint:'岗位描述 · 用于匹配判断与待确认项', desc:'补 JD 后追加：岗位匹配摘要、能力证据链、待确认项' },
      outputs:[
        {fmt:'MD',   label:'评估报告',      ext:'md',   filename:'resume_report.md'},
        {fmt:'PNG',  label:'候选人卡',      ext:'png',  filename:'candidate_card.png'},
        {fmt:'JSON', label:'字段结果',      ext:'json', filename:'resume_fields.json'},
      ],
      views: [
        {key:'info',     name:'候选人信息卡',   always:true},
        {key:'timeline', name:'经历时间线 / gap', always:true},
        {key:'jdmatch',  name:'JD 对照视图',     condition:'supp'},
        {key:'iq',       name:'面试问题 / 待确认', always:true},
      ],
    },
    contract: {
      key:'contract', name:'合同', icon:'file-signature',
      tagline:'快速判断合同能不能签、哪些条款必须修订',
      desc:'解析我方合同关键字段与风险条款，可补对方合同对照差异、整理谈判清单。',
      main:   { name:'我方合同', icon:'file-text',     hint:'PDF · 我方拟签合同（主文件）' },
      supp:   { name:'对方合同', icon:'files',         hint:'对方版本 · 用于条款差异对照（可选）', desc:'补对方合同后追加：双合同差异、责任对照、必谈判项' },
      outputs:[
        {fmt:'MD',   label:'风险报告',      ext:'md',   filename:'contract_risk.md'},
        {fmt:'PNG',  label:'红绿灯快照',    ext:'png',  filename:'risk_dashboard.png'},
        {fmt:'MD',   label:'谈判清单',      ext:'md',   filename:'negotiation_list.md'},
      ],
      views: [
        {key:'kv',       name:'关键信息卡片',     always:true},
        {key:'risks',    name:'条款风险红绿灯',   always:true},
        {key:'diffs',    name:'双合同差异对照',   condition:'supp'},
        {key:'todo',     name:'待谈判事项清单',   always:true},
      ],
    },
    statement: {
      key:'statement', name:'对账单', icon:'banknote',
      tagline:'先识别手写单据，再核对银行流水',
      desc:'主文件是手写单据（先解析）；补银行对账单后切换为单据 + 流水 + 结果三栏核对视图。',
      main:   { name:'手写单据', icon:'pen-line',      hint:'PNG / JPG · 手写记账或票据（主文件）' },
      supp:   { name:'银行对账单', icon:'banknote',    hint:'PDF / XLSX · 银行流水（可选，用于核对）', desc:'补银行对账单后追加：单据/流水比对、差异清单、验算结果' },
      outputs:[
        {fmt:'CSV',  label:'交易表',        ext:'csv',  filename:'transactions.csv'},
        {fmt:'MD',   label:'月度报告',      ext:'md',   filename:'statement_report.md'},
        {fmt:'PNG',  label:'可视化海报',    ext:'png',  filename:'statement_poster.png'},
      ],
      views: [
        {key:'receipt',  name:'手写单据识别',     always:true},
        {key:'reconcile',name:'三栏核对视图',     condition:'supp'},
        {key:'diff',     name:'差异映射',         condition:'supp'},
        {key:'metrics',  name:'验算指标卡片',     always:true},
      ],
    },
    paper: {
      key:'paper', name:'论文', icon:'book-open-text',
      tagline:'判断这篇论文对你的课题有没有用',
      desc:'解析目标论文的研究问题 / 方法 / 结果 / 参考价值；补研究上下文后追加相关性与可借鉴点。',
      main:   { name:'目标论文', icon:'book-open-text', hint:'PDF · 目标论文 / 长 PDF（主文件）' },
      supp:   { name:'研究上下文', icon:'graduation-cap', hint:'你的研究方向 / 关注问题 / 方法偏好（可选）', desc:'补研究上下文后追加：相关性判断、可借鉴点、阅读建议' },
      outputs:[
        {fmt:'MD',   label:'摘要卡',        ext:'md',   filename:'paper_summary.md'},
        {fmt:'PNG',  label:'知识快照',      ext:'png',  filename:'paper_snapshot.png'},
        {fmt:'JSON', label:'提取结果',      ext:'json', filename:'paper_fields.json'},
      ],
      views: [
        {key:'profile',  name:'目标论文解析卡',   always:true},
        {key:'context',  name:'研究上下文补充',   condition:'supp'},
        {key:'inspire',  name:'可借鉴点摘要',     condition:'supp'},
        {key:'enhance',  name:'公式 / PDF 分层',  always:true, exp:true},
      ],
    },
  },

  /* per-scenario state — aligned with PRD 2.3.2 state nodes */
  state: makeState(),

  /* runtime modes */
  demoMode: false,

  /* history mock */
  history: seedHistory(),

  /* settings */
  settings: {
    lang: 'zh-CN',
    density: 'comfortable',
    showBaseline: true,
    keepNoise: true,
    enableExpDemo: false,
  },
};

/* PRD 2.2.3 fixed 6-step demo flow */
const FLOW_STEPS = [
  {key:'raw',       name:'原始材料',         hint:'查看主文件预览'},
  {key:'baseline',  name:'baseline 对照',     hint:'无解析 / Tesseract / SnapExtract 三段差异'},
  {key:'supp',      name:'补充材料',         hint:'按场景补 JD / 对方合同 / 流水 / 研究上下文'},
  {key:'parse',     name:'端侧解析',         hint:'preparing → extracting → summarizing'},
  {key:'output',    name:'结果物',           hint:'字段卡 + 重点判断 + 总结建议 + 导出'},
  {key:'persist',   name:'本地留存 / 追问',  hint:'本地缓存 + 继续追问'},
];

function makeState(){
  const s = {};
  for (const k of ['resume','contract','statement','paper']) {
    s[k] = {
      scenario: k,
      task_id: null,
      // PRD 2.3.2 state machine:
      state: 'idle',            // idle | scene_entered | baseline_viewing | supplement_added | parsing | result_ready | followup_active | error
      parsing_phase: null,      // preparing | extracting | summarizing | null
      main_file: null,          // {name, size, type, url?}
      supp_file: null,          // {name, size, type, url?}
      fields: null,             // PRD 3.x.8 schema
      field_alerts: [],         // [{key, level, reason}]
      baseline_result: null,    // {raw, tesseract, snapextract}
      view_active: null,        // current right-panel view key
      confidence_level: null,
      error: null,
      banner: null,             // page-level alert {level, message}
      degraded: false,          // 参考性判断 / 降级结论
    };
  }
  return s;
}

function newTaskId(){
  const r = (crypto.getRandomValues(new Uint8Array(4)));
  return Array.from(r,b=>b.toString(16).padStart(2,'0')).join('');
}

function seedHistory(){
  const now = Date.now();
  const rows = [];
  const samples = [
    {scenario:'resume',    file:'candidate_doe.pdf',   supp:'jd_backend_lead.txt',          state:'result_ready', confidence:'high',   decision:'recommended'},
    {scenario:'contract',  file:'nda_v3_ours.pdf',     supp:'nda_v3_theirs.pdf',            state:'result_ready', confidence:'medium', decision:'revise'},
    {scenario:'statement', file:'receipts_jan.png',    supp:'icbc_jan_2026.pdf',            state:'result_ready', confidence:'high',   decision:'reviewed'},
    {scenario:'paper',     file:'attention_is_all.pdf',supp:null,                            state:'result_ready', confidence:'medium', decision:'pending'},
    {scenario:'contract',  file:'sow_kickoff.pdf',     supp:null,                            state:'error',        confidence:'low',    decision:'legal_review'},
    {scenario:'resume',    file:'candidate_lin.pdf',   supp:'jd_platform.txt',              state:'result_ready', confidence:'high',   decision:'recommended'},
  ];
  samples.forEach((s,i)=>{
    rows.push({
      task_id: newTaskId(),
      scenario: s.scenario,
      file: s.file,
      supp: s.supp,
      state: s.state,
      confidence: s.confidence,
      decision: s.decision,
      created: now - (i+1)*3600*1000*(2 + Math.random()*22),
    });
  });
  return rows;
}

/* =============== MOCK FIELDS — aligned to PRD 3.x.8 schemas =============== */

const MOCK = {
  /* ---------- 简历 (PRD 3.1) ---------- */
  resume: ({hasSupp}) => ({
    confidence: 'high',
    fields: {
      name: 'M. Doe',
      education_top: { degree:'硕士', major:'计算机科学', school:'某 985', year:'2020' },
      work_years: 5,
      current_company: '某科技公司',
      current_title: '后端工程师',
      skills: ['Go','Rust','PostgreSQL','Kafka','Distributed Systems'],
      projects: [
        {co:'某科技公司', role:'后端工程师', dur:'2023 — 至今', detail:'主导分布式任务调度系统，QPS 提升 4×。'},
        {co:'某互联网平台', role:'平台研发', dur:'2020 — 2023', detail:'参与多租户存储引擎，沉淀通用 SDK。'},
      ],
      job_match_summary: hasSupp ? {
        score: 78, level: 'recommended',
        evidences: [
          {dim:'分布式系统', from:'projects[0].detail', match:'强'},
          {dim:'高可用经验', from:'projects[0].detail', match:'中'},
          {dim:'团队 lead',  from:'(missing)',          match:'弱'},
        ],
        pending: ['是否带过 ≥ 5 人团队', '是否参与过架构评审主导'],
      } : null,
      weak_phrases: [
        {at:'projects[0]', phrase:'主导', reason:'role=后端工程师 与 主导 强度不匹配，需追问'},
      ],
      interview_focus: [
        '请基于最近的项目，描述一次因架构权衡导致的关键决策。',
        '在分布式调度中，你如何处理 task 重复消费？给出实际场景。',
        '若重做一次平台项目，最先改动的两件事是什么？为什么？',
        '你对团队 lead 角色的预期？过去带过多少人？',
      ],
    },
    field_alerts: [
      {key:'projects[0]', level:'yellow', reason:'弱表达：role 与 主导 强度不匹配'},
    ],
    summary: hasSupp
      ? '技术深度合格，平台经验扎实；岗位匹配 78 分，建议推进至下一轮。'
      : '技术深度合格，平台经验扎实；建议补 JD 后形成岗位匹配判断。',
    decision: hasSupp ? 'recommended' : 'pending',     // recommended | pending | reject
  }),

  /* ---------- 合同 (PRD 3.2) ---------- */
  contract: ({hasSupp}) => ({
    confidence: 'medium',
    fields: {
      contract_type: '技术服务合同（NDA + SOW）',
      party_a: { name:'SnapExtract Inc.', repr:'毛睿平', addr:'深圳前海' },
      party_b: { name:'Acme Co.',          repr:'J. Lin',   addr:'北京海淀' },
      subject: '提供本地敏感文档智能处理能力的服务集成',
      total_amount: { amount:240000, currency:'USD', period:'年（季度结算）' },
      start_date: '2026-06-01',
      end_date:   '2027-05-31',
      clauses: [
        {no:'§4',  title:'付款节点',     summary:'按季度等额支付，与交付节点解耦。'},
        {no:'§7.2',title:'终止条款',     summary:'仅授予甲方单方面终止权。'},
        {no:'§9',  title:'数据所有权',   summary:'乙方训练数据归属定义模糊。'},
        {no:'§12', title:'不可抗力',     summary:'未列举具体情形。'},
      ],
      risk_points: [
        {level:'red',  no:'§7.2', txt:'单方面终止条款只授予甲方，无对等机制。'},
        {level:'red',  no:'§9',   txt:'数据所有权归属模糊，存在乙方训练数据被回收风险。'},
        {level:'warn', no:'§4',   txt:'付款节点与交付里程碑脱钩，存在现金流压力。'},
        {level:'warn', no:'§12',  txt:'不可抗力未列举具体情形。'},
      ],
      clause_diffs: hasSupp ? [
        {dim:'终止权',     ours:'仅甲方',     theirs:'双方对等',   diff:'red',  note:'对方版本更平衡，建议采纳'},
        {dim:'付款节奏',   ours:'季度等额',   theirs:'里程碑挂钩', diff:'warn', note:'对方与交付绑定，对乙方更友好'},
        {dim:'违约金',     ours:'10%',        theirs:'15%',        diff:'warn', note:'差距 5pp'},
        {dim:'司法管辖',   ours:'深圳前海',   theirs:'香港 ICC',   diff:'red',  note:'需法务评估'},
      ] : null,
      negotiation_list: hasSupp ? [
        '采纳对方 §7.2 双方对等终止条款。',
        '将 §4 付款节点绑定至 SOW 中的具体交付项。',
        '澄清 §9 衍生模型权利归属。',
        '调整违约金区间至 12% — 13%。',
      ] : [
        '在 §7.2 加入乙方对等终止权，或明确触发条件。',
        '在 §9 增补"乙方在服务期内产生的衍生模型权利"条款。',
        '将 §4 付款节点绑定至 SOW 中的具体交付项。',
      ],
    },
    field_alerts: [
      {key:'clauses[§7.2]', level:'red',    reason:'高风险：终止权失衡'},
      {key:'clauses[§9]',   level:'red',    reason:'高风险：数据所有权模糊'},
    ],
    summary: hasSupp
      ? '在补对方版本后，§7.2 / §9 的修订路径清晰；建议采纳对方对等条款后返签。'
      : '整体可推进，但 §7.2 与 §9 必须先修订再签署。',
    decision: 'revise',  // sign | revise | legal_review
  }),

  /* ---------- 对账单 (PRD 3.3，主文件 = 手写单据) ---------- */
  statement: ({hasSupp}) => ({
    confidence: hasSupp ? 'high' : 'medium',
    fields: {
      receipt_entries: [
        {date:'2026-01-04', amount:12800, dir:'in',  party:'公司',     purpose:'工资'},
        {date:'2026-01-21', amount:40,    dir:'in',  party:'银行',     purpose:'利息'},
        {date:'2026-02-04', amount:12800, dir:'in',  party:'公司',     purpose:'工资'},
        {date:'2026-02-08', amount:3200,  dir:'out', party:'供应商 A', purpose:'采购'},
      ],
      statement_entries: hasSupp ? [
        {date:'2026-01-04', amount:12800, dir:'in',  desc:'工资 — 公司发放'},
        {date:'2026-01-08', amount:5800,  dir:'out', desc:'支付宝 — 房租'},
        {date:'2026-01-15', amount:12,    dir:'out', desc:'银行手续费'},
        {date:'2026-01-21', amount:38,    dir:'in',  desc:'利息收入'},
        {date:'2026-01-28', amount:3000,  dir:'out', desc:'跨行 — 父母'},
        {date:'2026-02-04', amount:12800, dir:'in',  desc:'工资 — 公司发放'},
      ] : null,
      matched_pairs: hasSupp ? [
        {receipt:0, statement:0, status:'ok',     diff:0,    note:'金额日期一致'},
        {receipt:2, statement:5, status:'ok',     diff:0,    note:'金额日期一致'},
        {receipt:1, statement:3, status:'warn',   diff:-2,   note:'利息差 2 元，疑似四舍五入'},
      ] : [],
      mismatch_items: hasSupp ? [
        {receipt:3, status:'red',  reason:'¥3,200 单据无对应流水（疑现金支付或回单未到）'},
      ] : [],
      calc_metrics: {
        income_total:  25640,
        expense_total: hasSupp ? 8812 : 3200,
        net:           hasSupp ? 16828 : 22440,
        recovery_rate: hasSupp ? 0.94 : null,
        verified:      hasSupp,
      },
      analysis_summary: hasSupp
        ? '本月单据 4 笔、流水 6 笔。匹配率 75%，1 笔 ¥3,200 单据无对应流水；利息存 ¥2 微差。建议核查 02-08 现金支出。'
        : '已识别 4 笔手写单据。补银行对账单后可完成核对、验算与差异归因。',
    },
    field_alerts: hasSupp ? [
      {key:'mismatch_items[0]', level:'red', reason:'¥3,200 流水缺失'},
    ] : [
      {key:'statement_entries', level:'yellow', reason:'未补银行对账单，验算结果仅基于单据'},
    ],
    summary: hasSupp ? '核对率 75%，1 笔异常待核' : '已识别单据，待补流水完成核对',
    decision: hasSupp ? 'reviewed' : 'partial',
  }),

  /* ---------- 论文 (PRD 3.4) ---------- */
  paper: ({hasSupp}) => ({
    confidence: hasSupp ? 'medium' : 'medium',
    fields: {
      target_paper_profile: {
        title:    'Sample-Efficient Document Parsing under Distribution Shift',
        authors:  'M. Doe, J. Lin, A. Kim',
        venue:    'NeurIPS 2025',
        keywords: ['document AI','NPU','sample efficiency'],
        rq:       '在边缘 NPU 资源受限条件下，文档解析模型如何在分布偏移场景下保持准确率？',
        method:   ['mixture-of-rationale 训练框架','NPU-aware 量化与 token routing','跨域 benchmark（4 域 × 3 噪声）'],
        results:  [
          {metric:'F1 (in-domain)',  value:'0.913'},
          {metric:'F1 (OOD avg)',    value:'0.847', delta:'+6.2pp vs SOTA'},
          {metric:'NPU latency',     value:'38 ms / page · 12 W'},
        ],
        scope:    '适用于文档结构稳定、跨域噪声有限的场景；不覆盖大规模手写体。',
      },
      paper_summary: '提出 rationale + routing 训练范式，结合 NPU-aware 量化，在 4 个垂域上将 OOD F1 提升 6.2pp，运行延迟 38 ms / page。',
      user_research_context: hasSupp ? {
        direction: '边缘端文档智能处理',
        focus:     '高敏文档的本地解析与隐私保护',
        method_pref:'端侧推理 + 量化 + 鲁棒训练',
        purpose:   '撰写实验段落 + 准备答辩',
      } : null,
      relevance_judgement: hasSupp ? {
        level:'high', score:0.83,
        points:['任务相关性高（document AI）','方法可借鉴（routing + 量化）','部署假设一致（NPU）'],
        gaps: ['评估侧重 OOD 而你侧重隐私','无对手写文档的扩展实验'],
      } : null,
      reference_value: hasSupp ? [
        {dim:'方法',     val:'引入 routing 模块以平衡通用与领域子模型'},
        {dim:'实验设计', val:'增加跨域评估，至少 2 个垂域'},
        {dim:'部署度量', val:'补充 NPU 上的延迟与能耗指标'},
      ] : null,
      evidence_links: [
        {section:'§3.2 Method',     ref:'rationale routing 设计图 Fig.3'},
        {section:'§4.1 Benchmark', ref:'4 domain × 3 noise level 表'},
        {section:'§5 Deployment',  ref:'NPU latency 测量结果'},
      ],
    },
    field_alerts: hasSupp ? [] : [
      {key:'user_research_context', level:'yellow', reason:'未补研究上下文，输出为参考性判断'},
    ],
    summary: hasSupp
      ? '与你研究方向高度相关；建议精读 §3.2 / §5，并复现 routing 策略。'
      : '完成了目标论文解析。补充研究上下文后可输出相关性与可借鉴点。',
    decision: hasSupp ? 'deep_read' : 'pending',  // deep_read | skim | skip | pending
    degraded: !hasSupp,                            // PRD 4.1.1: 研究信息不足 → 降级
  }),
};

/* Baseline 对照表（PRD 2.4.4 预生成） */
const BASELINE = {
  resume: {
    raw:        '需要人工通读简历，自行提炼经历、技能和风险点。',
    tesseract:  '可抽取原始文本，但结果偏碎片化，难以直接支持招聘判断。',
    snapextract:'输出信息卡片、综合评价、面试问题，直接支撑初筛与后续沟通。',
    diff_focus: '突出从「读简历」升级到「做初筛决定」。',
  },
  contract: {
    raw:        '需要逐条阅读正文，人工定位金额、责任、期限和违约条款。',
    tesseract:  '可识别条文文本，但不能稳定给出风险层级和签署建议。',
    snapextract:'输出关键信息提取、风险点识别、修改或签署建议。',
    diff_focus: '突出从「读合同」升级到「判断能不能签」。',
  },
  statement: {
    raw:        '需要先读手写单据，再人工对照银行对账单，自行核对金额和计算结果。',
    tesseract:  '可分别识别票据或流水文本，但难以稳定完成字段对齐、比对和验算。',
    snapextract:'先识别手写单据，再在补传银行对账单后完成结构化、比对、验算和分析。',
    diff_focus: '突出从「看票据和流水」升级到「完成核对与分析」。',
  },
  paper: {
    raw:        '需要人工通读目标论文，自己判断研究问题、方法、结果和参考价值。',
    tesseract:  '可抽取论文文本，但不能稳定形成研究问题、方法、结果与当前研究方向的关联判断。',
    snapextract:'先解析目标论文，再结合用户补充的研究信息输出相关性、可借鉴点和阅读建议。',
    diff_focus: '突出从「读论文」升级到「判断它对我当前研究有没有用」。',
  },
};

const SAMPLE_LIBRARY = {
  resume: {
    main: {
      id: 'ucr_resume_sample',
      name: 'ucr_resume_sample.pdf',
      size: 221213,
      type: 'application/pdf',
      url: './demo_sample_files_public/ucr_resume_sample.pdf',
      label: 'UCR 简历样例',
    },
    supp: {
      id: 'csu_sample_job_description',
      name: 'csu_sample_job_description.pdf',
      size: 186397,
      type: 'application/pdf',
      url: './demo_sample_files_public/csu_sample_job_description.pdf',
      label: '岗位 JD 样例',
    },
  },
  contract: {
    main: {
      id: 'mississippi_sample_contract',
      name: 'mississippi_sample_contract.pdf',
      size: 27442,
      type: 'application/pdf',
      url: './demo_sample_files_public/mississippi_sample_contract.pdf',
      label: '我方合同样例',
    },
    supp: {
      id: 'calaveras_sample_agreement',
      name: 'calaveras_sample_agreement.pdf',
      size: 944329,
      type: 'application/pdf',
      url: './demo_sample_files_public/calaveras_sample_agreement.pdf',
      label: '对方合同样例',
    },
  },
  statement: {
    main: {
      id: 'umich_handwritten_receipt_example',
      name: 'umich_handwritten_receipt_example.pdf',
      size: 244433,
      type: 'application/pdf',
      url: './demo_sample_files_public/umich_handwritten_receipt_example.pdf',
      label: '手写单据样例',
    },
    supp: {
      id: 'nbh_sample_bank_statement',
      name: 'nbh_sample_bank_statement.pdf',
      size: 55941,
      type: 'application/pdf',
      url: './demo_sample_files_public/nbh_sample_bank_statement.pdf',
      label: '银行对账单样例',
    },
  },
  paper: {
    main: {
      id: 'attention_is_all_you_need',
      name: 'attention_is_all_you_need.pdf',
      size: 2215244,
      type: 'application/pdf',
      url: './demo_sample_files_public/attention_is_all_you_need.pdf',
      label: '目标论文样例',
    },
    supp: {
      id: 'ocr_free_document_understanding_transformer',
      name: 'ocr_free_document_understanding_transformer.pdf',
      size: 7105978,
      type: 'application/pdf',
      url: './demo_sample_files_public/ocr_free_document_understanding_transformer.pdf',
      label: '研究上下文补充样例',
    },
  },
};

function cloneFileRef(file){
  return file ? {...file} : null;
}

function sampleRef(scn, kind){
  return cloneFileRef(SAMPLE_LIBRARY[scn]?.[kind] || null);
}

/* =============== ROUTER =============== */

function showRoute(name){
  document.querySelectorAll('[data-route]').forEach(el=>el.classList.remove('active'));
  const el = document.querySelector(`[data-route="${name}"]`);
  if (el){ el.classList.add('active'); el.classList.remove('fade-in'); void el.offsetWidth; el.classList.add('fade-in'); }
  // actionbar visible only on scene
  document.getElementById('actionbar').classList.toggle('hidden', name !== 'scene');
  // re-render lucide icons for newly shown DOM
  if (window.lucide) lucide.createIcons();
}

let currentScn = 'resume';

function navigate(){
  const h = location.hash || '#/';
  if (h === '#/' || h === ''){ showRoute('home'); renderHome(); return; }
  if (h.startsWith('#/scene/')){
    const k = h.replace('#/scene/','').split('?')[0];
    if (!SE.scenarios[k]) { location.hash = '#/'; return; }
    currentScn = k;
    showRoute('scene'); renderScene(); return;
  }
  if (h === '#/history'){ showRoute('history'); renderHistory(); return; }
  if (h === '#/settings'){ showRoute('settings'); renderSettings(); return; }
  showRoute('home'); renderHome();
}
window.addEventListener('hashchange', navigate);

/* =============== HOME (PRD V2.2.0 — main file upload hub) =============== */

function renderHome(){
  const wrap = document.getElementById('scn-cards');
  const items = Object.values(SE.scenarios);

  wrap.innerHTML = items.map((s,i) => {
    const st = SE.state[s.key];
    const filled = !!st.main_file;
    return `
      <div class="reveal card spotlight scn-card group relative overflow-hidden p-7 min-h-[280px] flex flex-col"
           data-d="${i+1}" data-scn="${s.key}" data-filled="${filled}">
        <!-- big numeral -->
        <div class="absolute right-6 top-5 font-mono text-[120px] leading-none font-semibold tracking-tighter pointer-events-none select-none scn-num">
          ${String(i+1).padStart(2,'0')}
        </div>

        <!-- header -->
        <div class="relative flex items-center gap-3 mb-7">
          <div class="w-9 h-9 rounded-lg flex items-center justify-center" style="background:var(--bg-2); border:1px solid var(--line-2);">
            <i data-lucide="${s.main.icon}" class="w-4 h-4" style="color:var(--ba)"></i>
          </div>
          <span class="font-mono text-[10px] uppercase tracking-[0.22em] text-t3">scenario.${s.key}</span>
          <span class="chip ml-auto ${filled ? 'chip-ok' : ''}" style="${filled ? '' : 'border-style:dashed;'}">
            <span class="dot"></span>${filled ? 'main file ready' : 'main file required'}
          </span>
        </div>

        <!-- title -->
        <div class="relative">
          <h3 class="text-[26px] font-medium tracking-[-0.02em] leading-none mb-1.5">${s.name}</h3>
          <p class="text-t2 text-[13.5px] leading-relaxed max-w-md">${s.tagline}。</p>
        </div>

        <!-- main file slot -->
        <div class="relative mt-auto pt-5">
          ${filled ? `
            <div class="rounded-10 border border-line2 bg-bg2 p-3 mb-3 flex items-center gap-3">
              <i data-lucide="file-check-2" class="w-4 h-4 shrink-0" style="color:var(--ok)"></i>
              <div class="min-w-0 flex-1">
                <div class="text-[13px] truncate">${st.main_file.name}</div>
                <div class="text-t3 text-[11px] font-mono">${formatSize(st.main_file.size)} · 已上传 · 主文件 = ${s.main.name}</div>
              </div>
              <button data-mfclear="${s.key}" class="iconbtn shrink-0" title="移除"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>
            </div>
            <div class="flex items-center gap-2">
              <a href="#/scene/${s.key}" class="cta arrow-go flex-1 justify-center">
                进入${s.name}场景 <i data-lucide="arrow-right" class="w-4 h-4"></i>
              </a>
            </div>
          ` : `
            <label class="block rounded-10 border border-dashed border-line2 p-4 cursor-pointer hover:border-ba/60 transition-colors mfslot">
              <input type="file" class="hidden" data-mfinput="${s.key}" accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx" />
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style="background:var(--grad-soft); border:1px solid rgba(255,122,24,.4);">
                  <i data-lucide="upload-cloud" class="w-4 h-4" style="color:var(--ba)"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-[13px]">上传${s.main.name} <span class="text-t3">(主文件)</span></div>
                  <div class="text-t3 text-[11px] font-mono mt-0.5">${s.main.hint}</div>
                </div>
              </div>
            </label>
            <div class="mt-2 flex items-center gap-2">
              <button data-loadsample="${s.key}" class="btn flex-1 justify-center text-[12px]">
                <i data-lucide="folder-open" class="w-3.5 h-3.5"></i> 载入本地样例
              </button>
            </div>
            <div class="mt-3 text-t3 font-mono text-[11px] uppercase tracking-wider">
              未上传主文件 · 场景入口 disabled
            </div>
          `}
        </div>
      </div>
    `;
  }).join('');

  // wire main-file inputs
  wrap.querySelectorAll('[data-mfinput]').forEach(inp => {
    const k = inp.getAttribute('data-mfinput');
    inp.addEventListener('change', e => {
      const f = e.target.files[0]; if (!f) return;
      uploadMainFile(k, {name:f.name, size:f.size, type:f.type, url:URL.createObjectURL(f)});
      inp.value='';
    });
  });
  wrap.querySelectorAll('.mfslot').forEach(label=>{
    ['dragover','dragenter'].forEach(t=>label.addEventListener(t, e=>{e.preventDefault(); label.classList.add('ring-brand');}));
    ['dragleave','drop'].forEach(t=>label.addEventListener(t, e=>{e.preventDefault(); label.classList.remove('ring-brand');}));
    label.addEventListener('drop', e=>{
      const k = label.querySelector('[data-mfinput]').getAttribute('data-mfinput');
      const f = e.dataTransfer.files[0]; if (!f) return;
      uploadMainFile(k, {name:f.name, size:f.size, type:f.type, url:URL.createObjectURL(f)});
    });
  });
  wrap.querySelectorAll('[data-mfclear]').forEach(btn=>{
    btn.addEventListener('click', e=>{ e.stopPropagation(); clearMainFile(btn.getAttribute('data-mfclear')); });
  });
  wrap.querySelectorAll('[data-loadsample]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const k = btn.getAttribute('data-loadsample');
      const sample = sampleRef(k, 'main');
      if (!sample){ toast('该场景暂未配置样例'); return; }
      uploadMainFile(k, sample);
    });
  });

  // Recent
  const recent = SE.history.slice(0,4);
  document.getElementById('recent-list').innerHTML = recent.map((r,i) => {
    const s = SE.scenarios[r.scenario];
    const stMap = {result_ready:'ok', enhancement_ready:'ok', error:'danger', baseline_viewing:'warn'};
    const stCls = stMap[r.state || r.status] || 'info';
    const lbl = (r.state || r.status || '').replace('_',' ');
    return `
      <a href="#/scene/${r.scenario}" class="reveal card card-hover spotlight block p-5 group" data-d="${i+1}">
        <div class="flex items-center justify-between mb-5">
          <span class="font-mono text-[11px] uppercase tracking-wider text-t3">${s.name}</span>
          <span class="font-mono text-[10px] text-t3">${r.task_id}</span>
        </div>
        <div class="text-[14px] truncate mb-1 font-medium">${r.file}</div>
        <div class="text-t3 text-[11px] font-mono mb-6">${timeAgo(r.created)}</div>
        <div class="flex items-center justify-between pt-4 border-t border-line1">
          <span class="chip chip-${stCls}"><span class="dot"></span>${lbl}</span>
          <span class="arrow-go text-t2 group-hover:text-t1 text-[12px]">
            <i data-lucide="arrow-up-right" class="w-3.5 h-3.5"></i>
          </span>
        </div>
      </a>
    `;
  }).join('');

  // Demo
  const demos = [
    {scn:'resume',    title:'5 年后端 + 平台 JD',  sub:'简历主文件 + 岗位 JD。完整演示 6 步流程，含 baseline 三段对照。', tag:'baseline 对照'},
    {scn:'contract',  title:'我方 NDA + 对方修订', sub:'我方合同主文件 + 对方版本。展示双合同差异 + 红绿灯。',           tag:'双合同差异'},
    {scn:'statement', title:'手写单据 + 银行流水', sub:'手写单据主文件 + 银行对账单补充。三栏核对 + 验算。',              tag:'三栏核对'},
  ];
  document.getElementById('demo-list').innerHTML = demos.map((d,i) => {
    const s = SE.scenarios[d.scn];
    return `
      <a href="#/scene/${d.scn}?demo=1" data-demo="${d.scn}"
         class="reveal card card-hover spotlight block p-7 relative overflow-hidden group" data-d="${i+1}">
        <div class="absolute right-5 top-5 w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
             style="background:var(--bg-2); border:1px solid var(--line-2);">
          <i data-lucide="play" class="w-3.5 h-3.5" style="color:var(--ba); margin-left:2px;"></i>
        </div>
        <div class="font-mono text-[10px] uppercase tracking-[0.22em] text-t3 mb-7">${s.name} · demo.0${i+1}</div>
        <div class="text-[20px] font-medium tracking-tight mb-2">${d.title}</div>
        <p class="text-t2 text-[13px] leading-relaxed mb-7 max-w-[260px]">${d.sub}</p>
        <div class="flex items-center justify-between pt-4 border-t border-line1">
          <span class="chip chip-warn"><span class="dot"></span>${d.tag}</span>
          <span class="arrow-go text-grad font-medium text-[12px]">
            launch <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
          </span>
        </div>
      </a>
    `;
  }).join('');

  document.querySelectorAll('[data-demo]').forEach(el=>{
    el.addEventListener('click', ()=>{ setDemoMode(true); });
  });

  bindSpotlight();
  bindReveal();
  bindCountUp();

  if (window.lucide) lucide.createIcons();
}

function uploadMainFile(k, f){
  const st = SE.state[k];
  // PRD 2.3.2: 切换主文件 → 立即清旧场景结果
  st.main_file = {...f};
  st.task_id = newTaskId();
  st.state = 'scene_entered';
  st.parsing_phase = null;
  st.supp_file = null;
  st.fields = null;
  st.field_alerts = [];
  st.baseline_result = BASELINE[k];
  st.confidence_level = null;
  st.error = null;
  st.banner = null;
  st.degraded = false;
  st.view_active = null;
  if (location.hash === '#/' || location.hash === '') renderHome();
  toast(`已收到 ${SE.scenarios[k].main.name}：${f.name}`);
}

function clearMainFile(k){
  SE.state[k] = makeState()[k];
  if (location.hash === '#/' || location.hash === '') renderHome();
  toast('已移除主文件，场景结果已清空');
}

function bindSpotlight(){
  document.querySelectorAll('.spotlight').forEach(el=>{
    if (el.__sp) return; el.__sp = true;
    el.addEventListener('mousemove', e=>{
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX - r.left)/r.width*100)+'%');
      el.style.setProperty('--my', ((e.clientY - r.top)/r.height*100)+'%');
    });
  });
}

function bindReveal(){
  const els = document.querySelectorAll('.reveal:not(.in)');
  if (!els.length) return;

  // Force-reveal everything currently in viewport on next frame
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    els.forEach(el=>{
      const r = el.getBoundingClientRect();
      if (r.top < (window.innerHeight + 80) && r.bottom > -80) el.classList.add('in');
    });
  }));

  // Safety net: anything still un-revealed after 600ms gets revealed
  setTimeout(()=>{
    document.querySelectorAll('.reveal:not(.in)').forEach(el=>{
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight*1.2) el.classList.add('in');
    });
  }, 600);

  if (!('IntersectionObserver' in window)) {
    els.forEach(el=>el.classList.add('in')); return;
  }
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{ if (en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
  }, {threshold: 0, rootMargin: '0px 0px -8% 0px'});
  els.forEach(el=>io.observe(el));
}

/* ===== Scenario picker modal ===== */
function renderPickerCards(){
  const grid = document.getElementById('picker-grid');
  const scenarios = Object.values(SE.scenarios);
  grid.innerHTML = scenarios.map((s,i)=>`
    <a href="#/scene/${s.key}" class="pcard" data-key="${s.key}" data-idx="${i}">
      <div class="index">${String(i+1).padStart(2,'0')}</div>

      <div class="relative">
        <div class="flex items-center gap-3 mb-5">
          <div class="w-9 h-9 rounded-lg flex items-center justify-center" style="background:var(--bg-2); border:1px solid var(--line-2);">
            <i data-lucide="${s.icon}" class="w-4 h-4" style="color:var(--ba)"></i>
          </div>
          <span class="font-mono text-[10px] uppercase tracking-[0.22em] text-t3">scenario.${s.key}</span>
          <span class="chip chip-brand ml-auto"><span class="dot"></span>+ ${s.supp.name}</span>
        </div>
        <h3 class="text-[24px] font-medium tracking-[-0.02em] leading-none mb-2">${s.name}</h3>
        <p class="text-t2 text-[13px] leading-relaxed max-w-md">${s.tagline}。</p>
      </div>

      <div class="relative flex items-end justify-between mt-6 pt-5 border-t border-line1">
        <div class="font-mono text-[11px] uppercase tracking-wider text-t3">
          主文件 <span class="text-t1">${s.main.name}</span> · ${s.outputs.length} 项产出
        </div>
        <span class="arrow-pill">
          进入 <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
        </span>
      </div>
    </a>
  `).join('');

  // cursor light tracking on each pcard
  grid.querySelectorAll('.pcard').forEach(el=>{
    el.addEventListener('mousemove', e=>{
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX - r.left)/r.width*100)+'%');
      el.style.setProperty('--my', ((e.clientY - r.top)/r.height*100)+'%');
    });
    el.addEventListener('mouseenter', ()=>{
      const items = Array.from(grid.querySelectorAll('.pcard'));
      setActive(items, items.indexOf(el));
    });
    el.addEventListener('click', ()=>{ closePicker(); /* href takes over */ });
  });

  // default active = 0
  const cards = Array.from(grid.querySelectorAll('.pcard'));
  setActive(cards, 0);

  if (window.lucide) lucide.createIcons();
}

function setActive(items, idx){
  items.forEach((el,i)=>el.classList.toggle('is-active', i===idx));
}

function openPicker(){
  renderPickerCards();
  const m = document.getElementById('picker');
  m.classList.remove('hidden');
  // double rAF so transition triggers
  requestAnimationFrame(()=>requestAnimationFrame(()=>m.classList.add('show')));
  document.body.style.overflow = 'hidden';
}

function closePicker(){
  const m = document.getElementById('picker');
  m.classList.remove('show');
  setTimeout(()=>{ m.classList.add('hidden'); document.body.style.overflow=''; }, 260);
}

/* ============ LIVE DEMO — ScreenStudio-style keyframe sequencer ============ */

/* Each keyframe: target element selector, camera scale, cursor lands at target,
   optional click ripple, hold duration. */
const LD_KEYFRAMES = [
  { sel:null,                    scale:1.00, hold:1800, label:'wide',     stage:'workspace' },
  { sel:'[data-target="upload"]',scale:1.85, hold:2200, label:'upload',   stage:'main file', click:true },
  { sel:'[data-target="result"]',scale:1.65, hold:2400, label:'result',   stage:'解析' },
  { sel:'[data-target="layer3"]',scale:1.65, hold:2400, label:'layer3',   stage:'结果物' },
  { sel:'[data-target="export"]',scale:2.30, hold:2800, label:'export',   stage:'导出', click:true, openMenu:true },
];

let LD_IDX = 0;
let LD_TIMER = null;
let LD_PAUSED = false;

function newTaskShort(){
  const r = crypto.getRandomValues(new Uint8Array(3));
  return Array.from(r,b=>b.toString(16).padStart(2,'0')).join('');
}

function ldGetCenter(el, viewport){
  const r = el.getBoundingClientRect();
  const v = viewport.getBoundingClientRect();
  return {
    x: (r.left + r.width/2) - v.left,
    y: (r.top + r.height/2) - v.top,
    w: r.width, h: r.height,
    left: r.left - v.left, top: r.top - v.top,
  };
}

function ldApplyKeyframe(kf){
  const viewport = document.getElementById('ld-viewport');
  const camera = document.getElementById('ld-camera');
  const cursor = document.getElementById('ld-cursor');
  const focus = document.getElementById('ld-focus');
  if (!viewport || !camera || !cursor) return;

  const stageLabel = document.getElementById('ld-stage-name');
  if (stageLabel) stageLabel.textContent = kf.stage || 'resume';

  const counter = document.getElementById('ld-counter');
  if (counter) counter.textContent = String(LD_IDX + 1).padStart(2,'0');

  // Reset prior visual state on cards
  document.querySelectorAll('#ld-camera .ld-card').forEach(c => c.classList.remove('is-focus'));
  // Close any open export menu unless this kf opens it
  const menu = document.getElementById('ld-export-menu');
  if (menu && !kf.openMenu) menu.classList.remove('show');

  if (!kf.sel){
    // wide shot — reset transform
    camera.style.transform = 'scale(1) translate(0, 0)';
    if (focus) focus.classList.remove('show');
    // park cursor near top-left workspace
    cursor.style.setProperty('--cx', '36px');
    cursor.style.setProperty('--cy', '40px');
    cursor.style.transform = 'translate(36px, 40px)';
    return;
  }

  // Find target in unscaled DOM
  const target = camera.querySelector(kf.sel);
  if (!target) return;

  // Compute target center *in viewport coordinates with camera at scale 1, no translate*.
  // Reset transform momentarily to measure.
  const prev = camera.style.transform;
  camera.style.transition = 'none';
  camera.style.transform = 'scale(1) translate(0,0)';
  const t = ldGetCenter(target, viewport);
  // Restore transition
  // Force reflow
  void camera.offsetWidth;
  camera.style.transition = '';

  // Compute pan so the target center lands at viewport center after scaling.
  const v = viewport.getBoundingClientRect();
  const cx = v.width / 2;
  const cy = v.height / 2;
  const s = kf.scale;
  // Camera transform-origin is 50% 50%. After scale, the world coordinate (cx,cy) stays at center.
  // We want the target world point (t.x, t.y) to map to viewport (cx, cy).
  // World after scale: (sx', sy') = ( (x - cx)*s + cx, (y - cy)*s + cy )
  // Then add translate (tx, ty) (which is in scaled space when applied after scale via transform shorthand)
  // Using `scale(s) translate(tx,ty)` in CSS: order matters — translate is applied first in user-space, then scaled.
  // So final viewport pos = ( (x + tx - cx)*s + cx, ... )
  // Want this == (cx, cy)  →  (x + tx - cx)*s = 0  →  tx = cx - x.
  const tx = cx - t.x;
  const ty = cy - t.y;
  camera.style.transform = `scale(${s}) translate(${tx}px, ${ty}px)`;

  // Highlight focus on the target card if it has .ld-card or contains one
  let card = target.closest('.ld-card') || target.querySelector('.ld-card') || target;
  if (card){
    card.classList.add('is-focus');
    // Place focus reticle around the target after camera transitions (offset by tx,ty applied via camera, so reticle outside camera needs absolute viewport coords post-scale)
    if (focus){
      // reticle is OUTSIDE camera, so we need final viewport coords.
      const fx = (t.left + tx - cx) * s + cx;
      const fy = (t.top  + ty - cy) * s + cy;
      const fw = t.w * s;
      const fh = t.h * s;
      focus.style.left   = (fx - 4) + 'px';
      focus.style.top    = (fy - 4) + 'px';
      focus.style.width  = (fw + 8) + 'px';
      focus.style.height = (fh + 8) + 'px';
      focus.classList.add('show');
    }
  }

  // Cursor lands near target's bottom-right after camera settles
  // Compute final viewport coord of target's bottom-right then offset cursor a bit toward inside.
  const targetVx = (t.x + tx - cx) * s + cx;
  const targetVy = (t.y + ty - cy) * s + cy;
  const finalCx = targetVx - 8;
  const finalCy = targetVy - 4;
  cursor.style.setProperty('--cx', finalCx + 'px');
  cursor.style.setProperty('--cy', finalCy + 'px');
  cursor.style.transform = `translate(${finalCx}px, ${finalCy}px)`;

  // Click + ripple after cursor lands
  if (kf.click){
    setTimeout(()=>{
      // click squish
      cursor.classList.remove('click');
      void cursor.offsetWidth;
      cursor.classList.add('click');

      // ripple at cursor tip
      const ripple = document.getElementById('ld-ripple');
      if (ripple){
        ripple.style.left = finalCx + 'px';
        ripple.style.top  = finalCy + 'px';
        ripple.classList.remove('fire');
        void ripple.offsetWidth;
        ripple.classList.add('fire');
      }

      if (kf.openMenu && menu){
        setTimeout(()=>menu.classList.add('show'), 220);
      }

      // refresh task_id when clicking upload (suggests new task)
      if (kf.label === 'upload'){
        const tk = document.getElementById('ld-task');
        if (tk) tk.textContent = newTaskShort();
      }
    }, 950); // wait for cursor tween to settle
  }
}

function ldTick(){
  if (LD_PAUSED) { LD_TIMER = setTimeout(ldTick, 600); return; }
  const kf = LD_KEYFRAMES[LD_IDX];
  ldApplyKeyframe(kf);
  LD_TIMER = setTimeout(()=>{
    LD_IDX = (LD_IDX + 1) % LD_KEYFRAMES.length;
    ldTick();
  }, kf.hold);
}

function startLiveDemo(){
  const livedemo = document.getElementById('livedemo');
  if (!livedemo) return;

  // Pause when user hovers (let them inspect frozen frame)
  livedemo.addEventListener('mouseenter', ()=>{ LD_PAUSED = true; });
  livedemo.addEventListener('mouseleave', ()=>{ LD_PAUSED = false; });

  // Re-apply current keyframe on resize so geometry stays correct
  let resizeT = null;
  window.addEventListener('resize', ()=>{
    clearTimeout(resizeT);
    resizeT = setTimeout(()=>ldApplyKeyframe(LD_KEYFRAMES[LD_IDX]), 120);
  });

  // Wait for fonts/icons to settle, then start
  setTimeout(()=>{
    LD_IDX = 0;
    ldTick();
  }, 600);
}

function bindCountUp(){
  document.querySelectorAll('.count').forEach(el=>{
    if (el.__c) return; el.__c = true;
    const target = parseInt(el.getAttribute('data-target')||'0',10);
    const dur = 900; const start = performance.now();
    function step(t){
      const p = Math.min(1,(t-start)/dur);
      const eased = 1 - Math.pow(1-p,3);
      el.textContent = Math.round(target*eased).toString();
      if (p<1) requestAnimationFrame(step);
    }
    setTimeout(()=>requestAnimationFrame(step), 200);
  });
}

function stateChip(state){
  const map = {
    idle:              ['',           'idle'],
    scene_entered:     ['chip-info',  'ready'],
    baseline_viewing:  ['chip-warn',  'baseline'],
    supplement_added:  ['chip-info',  'supp added'],
    parsing:           ['chip-brand', 'parsing…'],
    result_ready:      ['chip-ok',    'done'],
    followup_active:   ['chip-brand', 'follow-up'],
    error:             ['chip-danger','error'],
  };
  const [cls,label] = map[state] || ['','—'];
  return {cls,label};
}
// Backwards-compat shim used by recent-list etc.
function statusChip(st){
  const {cls,label} = stateChip(st);
  return `<span class="chip ${cls}"><span class="dot"></span>${label}</span>`;
}

function timeAgo(ts){
  const m = Math.floor((Date.now()-ts)/60000);
  if (m < 1) return 'just now';
  if (m < 60) return m+'m ago';
  const h = Math.floor(m/60); if (h < 24) return h+'h ago';
  const d = Math.floor(h/24); return d+'d ago';
}

/* =============== SCENE — PRD V2.2.0 =============== */

function flowStepIndex(st){
  // 01 raw, 02 baseline, 03 supp, 04 parse, 05 output, 06 persist
  if (!st.main_file) return -1;
  if (st.state === 'parsing') return 3;
  if (st.state === 'result_ready' || st.state === 'followup_active'){
    return st.state === 'followup_active' ? 5 : 4;
  }
  if (st.supp_file) return 3;            // ready to parse with supp
  if (st.state === 'baseline_viewing') return 1;
  return 0;                               // raw
}

function renderScene(){
  const k = currentScn;
  const s = SE.scenarios[k];
  const st = SE.state[k];

  // Header
  document.getElementById('scn-title').textContent = `${s.name}场景`;
  document.getElementById('scn-desc').textContent  = s.desc;
  document.getElementById('scn-type-text').textContent = s.key;
  document.getElementById('scn-taskid').textContent = st.task_id || '—';

  // 6-step flow timeline
  renderFlowRow(st);

  // Layer 1
  renderMainFileCard(s, st);
  renderSupplementSlot(s, st);
  renderPreview(st);

  // Baseline 02 (collapsible)
  renderBaselinePanel(s, st);

  // Layer 2: result main
  renderResultMain(s, st);

  // Layer 3: 3-col subcards
  renderLayer3(s, st);

  // Right: views + view detail
  renderViewList(s, st);

  // Banner
  renderBanner(st);

  // State chip + degraded chip
  const sc = stateChip(st.state);
  const elc = document.getElementById('scn-state-chip');
  elc.className = 'chip ' + sc.cls;
  document.getElementById('scn-state-label').textContent = sc.label;
  document.getElementById('scn-degraded').classList.toggle('hidden', !st.degraded);

  // Demo sidebar
  document.getElementById('demo-sidebar').classList.toggle('hidden', !SE.demoMode);

  // Action bar enable / disable
  const hasResult = (st.state === 'result_ready' || st.state === 'followup_active');
  document.querySelectorAll('#actionbar [data-act]').forEach(b=>{
    const act = b.getAttribute('data-act');
    const enable = (act==='switch') || (act==='retry') || hasResult;
    b.style.opacity = enable ? '1' : '.4';
    b.style.pointerEvents = enable ? 'auto' : 'none';
  });

  bindSpotlight();
  if (window.lucide) lucide.createIcons();
}

function renderFlowRow(st){
  const idx = flowStepIndex(st);
  const baselineExpanded = SE.state[currentScn]._baselineOpen || SE.demoMode;
  document.getElementById('flow-row').innerHTML = FLOW_STEPS.map((stp,i)=>{
    const cls = i < idx ? 'is-done' : (i === idx ? 'is-active' : '');
    return `
      <div class="flow-step ${cls}" data-flow="${stp.key}" data-i="${i}">
        <span class="num"><span class="dot"></span>STEP 0${i+1}</span>
        <span class="label">${stp.name}</span>
        <span class="hint">${stp.hint}</span>
      </div>
    `;
  }).join('');

  document.querySelectorAll('#flow-row .flow-step').forEach(el=>{
    el.addEventListener('click', ()=>{
      const key = el.getAttribute('data-flow');
      if (key === 'baseline') toggleBaseline();
      if (key === 'supp')     document.querySelector('[data-component="SupplementSlot"]')?.scrollIntoView({behavior:'smooth', block:'center'});
      if (key === 'parse' && SE.state[currentScn].main_file && SE.state[currentScn].state !== 'parsing') startParse();
      if (key === 'output' && SE.state[currentScn].state === 'result_ready'){
        document.querySelector('[data-component="ResultMain"]')?.scrollIntoView({behavior:'smooth', block:'center'});
      }
    });
  });
}

function renderMainFileCard(s, st){
  const wrap = document.getElementById('mf-body');
  const status = document.getElementById('mf-status');
  if (st.main_file){
    status.className = 'chip chip-ok';
    status.querySelector('span:nth-child(2)').textContent = 'ready';
    wrap.innerHTML = `
      <div class="rounded-10 border border-line2 bg-bg2 p-3 mb-3 flex items-center gap-3">
        <i data-lucide="${s.main.icon}" class="w-4 h-4 shrink-0" style="color:var(--ba)"></i>
        <div class="min-w-0 flex-1">
          <div class="text-[13px] truncate">${st.main_file.name}</div>
          <div class="text-t3 text-[11px] font-mono">${formatSize(st.main_file.size)} · ${s.main.name}</div>
        </div>
        <button id="mf-clear-scene" class="iconbtn shrink-0" title="清空主文件"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>
      </div>
      <div class="text-t3 text-[11px] font-mono">主文件锁定 · 切换需返回首页</div>
    `;
    document.getElementById('mf-clear-scene').addEventListener('click', ()=>{
      if (confirm('清空主文件后将退出当前场景，确定？')){
        SE.state[currentScn] = makeState()[currentScn];
        location.hash = '#/';
      }
    });
  } else {
    status.className = 'chip chip-danger';
    status.querySelector('span:nth-child(2)').textContent = 'missing';
    wrap.innerHTML = `
      <div class="rounded-10 border border-dashed p-4 text-center" style="border-color: rgba(220,38,38,.4); background: rgba(220,38,38,.06);">
        <i data-lucide="alert-triangle" class="w-4 h-4 mx-auto mb-1.5" style="color:var(--danger)"></i>
        <div class="text-[13px] mb-1">主文件未上传</div>
        <div class="text-t3 text-[11px] font-mono mb-3">无法进入 04 端侧解析</div>
        <a href="#/" class="btn text-[12px] inline-flex"><i data-lucide="arrow-left" class="w-3 h-3"></i>返回首页上传 ${s.main.name}</a>
      </div>
    `;
  }
}

function renderSupplementSlot(s, st){
  const wrap = document.getElementById('supp-body');
  const status = document.getElementById('supp-status');
  document.getElementById('supp-desc').textContent = s.supp.hint;
  const localSample = sampleRef(currentScn, 'supp');

  if (st.supp_file){
    status.className = 'chip chip-ok';
    status.querySelector('span:nth-child(2)').textContent = 'attached';
    wrap.innerHTML = `
      <div class="rounded-10 border border-line2 bg-bg2 p-3 flex items-center gap-3 mb-3">
        <i data-lucide="${s.supp.icon}" class="w-4 h-4 shrink-0" style="color:var(--bb)"></i>
        <div class="min-w-0 flex-1">
          <div class="text-[13px] truncate">${st.supp_file.name}</div>
          <div class="text-t3 text-[11px] font-mono">${formatSize(st.supp_file.size)} · ${s.supp.name}</div>
        </div>
        <button id="supp-clear-btn" class="iconbtn shrink-0"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>
      </div>
      <button id="supp-reparse" class="cta w-full justify-center text-[12.5px]" ${st.state==='parsing'?'disabled':''}>
        <i data-lucide="zap" class="w-3.5 h-3.5"></i> 重新解析（含补充材料）
      </button>
      <div class="text-t3 text-[11px] font-mono mt-2">${s.supp.desc}</div>
    `;
    document.getElementById('supp-clear-btn').addEventListener('click', clearSupplement);
    document.getElementById('supp-reparse').addEventListener('click', startParse);
  } else {
    status.className = 'chip';
    status.querySelector('span:nth-child(2)').textContent = 'optional';
    wrap.innerHTML = `
      <label class="block rounded-10 border border-dashed border-line2 p-3 cursor-pointer hover:border-bb/60 transition-colors text-[12px] supp-drop">
        <input type="file" class="hidden" id="supp-input" />
        <div class="flex items-center gap-2.5">
          <i data-lucide="${s.supp.icon}" class="w-3.5 h-3.5 shrink-0" style="color:var(--bb)"></i>
          <div class="min-w-0 flex-1">
            <div>补传 ${s.supp.name}</div>
            <div class="text-t3 text-[10.5px] font-mono mt-0.5">仅当前场景生效，不创建跨场景任务</div>
          </div>
          <i data-lucide="plus" class="w-3.5 h-3.5 text-t3"></i>
        </div>
      </label>
      ${localSample ? `
        <button id="supp-load-sample" class="btn w-full justify-center text-[12px] mt-2">
          <i data-lucide="folder-open" class="w-3.5 h-3.5"></i> 载入 ${localSample.label}
        </button>
      ` : ''}
    `;
    const inp = document.getElementById('supp-input');
    const drop = document.querySelector('.supp-drop');
    inp.addEventListener('change', e=>{
      const f = e.target.files[0]; if (!f) return;
      uploadSupplement({name:f.name, size:f.size, type:f.type, url:URL.createObjectURL(f)});
      inp.value='';
    });
    ['dragover','dragenter'].forEach(t=>drop.addEventListener(t, e=>{e.preventDefault(); drop.classList.add('ring-brand');}));
    ['dragleave','drop'].forEach(t=>drop.addEventListener(t, e=>{e.preventDefault(); drop.classList.remove('ring-brand');}));
    drop.addEventListener('drop', e=>{
      const f = e.dataTransfer.files[0]; if (!f) return;
      uploadSupplement({name:f.name, size:f.size, type:f.type, url:URL.createObjectURL(f)});
    });
    document.getElementById('supp-load-sample')?.addEventListener('click', ()=>{
      uploadSupplement(localSample);
    });
  }
}

function renderPreview(st){
  const prv = document.getElementById('prv-body');
  const prvStatus = document.getElementById('prv-status');
  if (!st.main_file){
    prvStatus.textContent = 'empty';
    prv.innerHTML = `<div class="text-center text-t3 text-[12px] font-mono"><i data-lucide="file" class="w-6 h-6 mx-auto mb-2 opacity-50"></i>no main file</div>`;
    return;
  }
  const isScanning = st.state === 'parsing';
  prvStatus.textContent = isScanning ? 'scanning' : 'ready';
  const file = st.main_file;
  const fileType = (file.type || '').toLowerCase();
  const ext = (file.name.split('.').pop() || fileType.split('/').pop() || 'file').toLowerCase();
  const fileUrl = file.url || '';
  let content = `
    <div class="flex h-full items-center justify-center text-center text-t3 text-[12px] font-mono">
      <div>
        <i data-lucide="file" class="w-6 h-6 mx-auto mb-2 opacity-50"></i>
        该文件类型暂不支持内嵌预览
      </div>
    </div>`;
  if (fileUrl && (fileType.includes('pdf') || ext === 'pdf')){
    content = `<iframe src="${fileUrl}#toolbar=0&navpanes=0&scrollbar=1" title="${escapeHtml(file.name)}"></iframe>`;
  } else if (fileUrl && (fileType.startsWith('image/') || ['png','jpg','jpeg','gif','webp'].includes(ext))){
    content = `<img src="${fileUrl}" alt="${escapeHtml(file.name)}" class="object-contain w-full h-full" />`;
  }
  prv.innerHTML = `
    <div class="preview-frame scanwrap relative h-full">
      ${isScanning ? '<div class="scanbeam"></div>' : ''}
      <div class="absolute inset-x-3 top-3 z-10 flex items-center justify-between text-[10px] font-mono text-t3 pointer-events-none">
        <span>${file.sample ? 'LOCAL SAMPLE' : 'LOCAL FILE'} · ${escapeHtml(file.name)}</span>
        ${isScanning ? '<span style="color:var(--ba)" class="flex items-center gap-1"><span class="w-1 h-1 rounded-full bg-ba pulse"></span>scan</span>' : ''}
      </div>
      <div class="w-full h-full pt-8">${content}</div>
      <div class="preview-modebar">
        <span class="chip chip-info"><span class="dot"></span>${ext}</span>
        <span class="chip"><span class="dot"></span>${formatSize(file.size)}</span>
      </div>
    </div>`;
}

function renderBaselinePanel(s, st){
  const body = document.getElementById('baseline-body');
  const caret = document.getElementById('baseline-caret');
  const chip = document.getElementById('baseline-chip');
  const hint = document.getElementById('baseline-hint');

  const open = !!SE.state[currentScn]._baselineOpen || SE.demoMode;
  body.classList.toggle('hidden', !open);
  caret.style.transform = open ? 'rotate(180deg)' : '';
  if (SE.demoMode) {
    chip.className = 'chip chip-warn';
    chip.querySelector('span:nth-child(2)').textContent = 'demo · auto-expand';
  } else {
    chip.className = 'chip';
    chip.querySelector('span:nth-child(2)').textContent = '预生成 · 不参与正式解析';
  }
  hint.textContent = open
    ? '同一素材的三段差异：评委可直观看到从「读' + s.main.name + '」升级到「做判断」的能力差。'
    : '点击查看 无解析 / Tesseract / SnapExtract 三段差异';

  if (open){
    const b = BASELINE[currentScn] || {};
    body.innerHTML = `
      <div class="bl-row">
        <div class="bl-col">
          <div class="bl-name">无解析</div>
          <div class="bl-text">${b.raw || '—'}</div>
        </div>
        <div class="bl-col">
          <div class="bl-name">Tesseract</div>
          <div class="bl-text">${b.tesseract || '—'}</div>
        </div>
        <div class="bl-col">
          <div class="bl-name">SnapExtract</div>
          <div class="bl-text">${b.snapextract || '—'}</div>
        </div>
      </div>
      <div class="px-5 py-3 border-t border-line1 text-[12px] flex items-center gap-2">
        <i data-lucide="target" class="w-3.5 h-3.5" style="color:var(--ba)"></i>
        <span class="text-t2">演示重点：</span><span class="text-t1">${b.diff_focus || '—'}</span>
      </div>
    `;
  }

  // Toggle handler (re-bind each render since innerHTML changes)
  document.getElementById('baseline-toggle').onclick = toggleBaseline;
}

function toggleBaseline(){
  const st = SE.state[currentScn];
  st._baselineOpen = !st._baselineOpen;
  renderBaselinePanel(SE.scenarios[currentScn], st);
  if (window.lucide) lucide.createIcons();
}

function renderResultMain(s, st){
  const body = document.getElementById('res-body');
  const modeChip = document.getElementById('res-mode-chip');
  const followup = document.getElementById('res-followup');

  // Mode chip
  if (st.state === 'parsing'){
    modeChip.classList.remove('hidden');
    modeChip.className = 'chip chip-brand';
    modeChip.querySelector('span:nth-child(2)').textContent = (st.parsing_phase || 'parsing') + '…';
  } else if (st.state === 'result_ready' && st.supp_file){
    modeChip.classList.remove('hidden');
    modeChip.className = 'chip chip-ok';
    modeChip.querySelector('span:nth-child(2)').textContent = 'main + supplement';
  } else if (st.state === 'followup_active'){
    modeChip.classList.remove('hidden');
    modeChip.className = 'chip chip-brand';
    modeChip.querySelector('span:nth-child(2)').textContent = 'follow-up';
  } else {
    modeChip.classList.add('hidden');
  }
  followup.classList.toggle('hidden', st.state !== 'result_ready');

  if (!st.main_file){
    body.innerHTML = `
      <div class="text-center py-12">
        <div class="mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-4" style="background:var(--grad-soft); border:1px solid var(--line-2);">
          <i data-lucide="alert-triangle" class="w-5 h-5" style="color:var(--warn)"></i>
        </div>
        <div class="text-t1 text-[14px]">主文件未上传 · 不进入正式结果区</div>
        <div class="text-t3 text-[12px] mt-1 font-mono">PRD 2.3.1 · 主文件缺失则不展示场景结果</div>
        <a href="#/" class="btn mt-4 inline-flex text-[12px]"><i data-lucide="arrow-left" class="w-3 h-3"></i> 返回首页上传 ${s.main.name}</a>
      </div>`;
    return;
  }

  if (st.state === 'idle' || st.state === 'scene_entered'){
    body.innerHTML = `
      <div class="flex flex-col items-center text-center py-10">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-3 ring-brand" style="background:var(--bg-2);">
          <i data-lucide="zap" class="w-5 h-5" style="color:var(--ba)"></i>
        </div>
        <div class="text-t1 text-[14px]">主文件已就绪 · 点击启动 04 端侧解析</div>
        <div class="text-t3 text-[12px] mt-1 font-mono">npu local · 38ms / page</div>
        <button class="cta arrow-go mt-4" id="res-start-parse">
          <i data-lucide="zap" class="w-4 h-4"></i> 开始解析
        </button>
      </div>`;
    document.getElementById('res-start-parse').addEventListener('click', startParse);
    return;
  }

  if (st.state === 'parsing'){
    const phase = st.parsing_phase || 'preparing';
    const phases = [
      {k:'preparing',  l:'准备中', d:'校验输入与本地缓存'},
      {k:'extracting', l:'抽取中', d:'按字段 schema 解析'},
      {k:'summarizing',l:'总结中', d:'生成重点判断与摘要'},
    ];
    body.innerHTML = `
      <div class="space-y-3">
        <div class="flex items-center gap-2 text-t2 text-[13px]">
          <i data-lucide="loader-2" class="w-4 h-4 animate-spin" style="color:var(--ba)"></i>
          <span>正在按场景主路径解析…</span>
          <span class="ml-auto font-mono text-[11px] text-t3">npu local · 38ms / page</span>
        </div>
        <div class="grid grid-cols-3 gap-3">
          ${phases.map(p=>`
            <div class="rounded-10 border ${p.k===phase?'border-ba':'border-line1'} p-3" style="${p.k===phase?'background:rgba(255,122,24,.06)':''}">
              <div class="font-mono text-[10px] uppercase tracking-wider ${p.k===phase?'text-grad':'text-t3'}">${p.l}</div>
              <div class="text-[12.5px] mt-1 ${p.k===phase?'text-t1':'text-t3'}">${p.d}</div>
              ${p.k===phase ? '<div class="h-1 rounded-full mt-2 shimmer"></div>' : ''}
            </div>
          `).join('')}
        </div>
        <div class="text-t3 text-[11.5px] font-mono pt-1">PRD 2.3.2 · 字段 / 重点判断 / 总结结果将同批次刷新</div>
      </div>`;
    return;
  }

  if (st.state === 'error'){
    const e = st.error || {code:'E_UNKNOWN', message:'未知错误'};
    body.innerHTML = `
      <div class="text-center py-12">
        <div class="mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-3" style="background:rgba(220,38,38,.14); border:1px solid rgba(220,38,38,.4);">
          <i data-lucide="x-circle" class="w-5 h-5" style="color:var(--danger)"></i>
        </div>
        <div class="text-t1 text-[14px]">解析失败 · 不输出强结论</div>
        <div class="text-t3 text-[12px] mt-1 font-mono">${e.code}</div>
        <div class="text-t2 text-[13px] mt-2">${e.message}</div>
        <button class="btn mt-4" onclick="retry()"><i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>重试</button>
      </div>`;
    return;
  }

  // result_ready / followup_active — show summary card here; details go to layer 3
  const f = st.fields || {};
  const r = SCENE_RENDERERS[currentScn];
  body.innerHTML = r.headline(st);
  if (window.lucide) lucide.createIcons();
}

function renderLayer3(s, st){
  const wrap = document.getElementById('layer3-cards');
  if (st.state !== 'result_ready' && st.state !== 'followup_active'){
    wrap.innerHTML = '';
    return;
  }
  const r = SCENE_RENDERERS[currentScn];
  wrap.innerHTML = `
    <div class="l3-card">
      <div class="l3-title"><span class="num">L3 · 01</span> 字段卡片</div>
      ${r.fields(st)}
    </div>
    <div class="l3-card">
      <div class="l3-title"><span class="num">L3 · 02</span> 重点判断</div>
      ${r.keyJudgment(st)}
    </div>
    <div class="l3-card">
      <div class="l3-title"><span class="num">L3 · 03</span> 总结建议 / 导出</div>
      ${r.summaryDecision(st)}
      <div class="mt-4 relative" id="export-anchor">
        <button class="cta w-full justify-center text-[12.5px]" id="export-btn">
          <i data-lucide="download" class="w-3.5 h-3.5"></i> 导出产物
        </button>
        <div class="export-menu" id="export-menu"></div>
      </div>
    </div>
  `;
  bindExportMenu();
  if (window.lucide) lucide.createIcons();
}

function renderViewList(s, st){
  const wrap = document.getElementById('view-list');
  const detailTitle = document.getElementById('vd-title');
  const detailMeta = document.getElementById('vd-meta');
  const detailBody = document.getElementById('vd-body');

  const list = s.views.map((v,i)=>{
    const enabled = v.always || (v.condition === 'supp' ? !!st.supp_file : true);
    const active = st.view_active === v.key && enabled;
    return {v, i, enabled, active};
  });
  document.getElementById('view-count').textContent = `${list.filter(x=>x.enabled).length} / ${list.length}`;

  wrap.innerHTML = list.map(({v,i,enabled,active})=>`
    <div class="view-item ${active?'is-active':''} ${enabled?'':'is-disabled'}" data-view="${v.key}">
      <span class="vno">${String(i+1).padStart(2,'0')}</span>
      <span class="vname">${v.name}</span>
      ${v.exp ? '<span class="vtag">EXP</span>' : ''}
      ${!enabled ? '<span class="vtag">需补 ' + s.supp.name + '</span>' : ''}
    </div>
  `).join('');

  wrap.querySelectorAll('.view-item').forEach(el=>{
    el.addEventListener('click', ()=>{
      if (el.classList.contains('is-disabled')) return;
      const k = el.getAttribute('data-view');
      st.view_active = (st.view_active === k) ? null : k;
      renderViewList(s, st);
    });
  });

  // detail
  if (st.view_active){
    const v = s.views.find(x=>x.key === st.view_active);
    detailTitle.textContent = (v?.name || 'VIEW DETAIL').toUpperCase();
    detailMeta.textContent = (st.fields ? 'live' : 'pending parse');
    const r = SCENE_RENDERERS[currentScn];
    detailBody.innerHTML = (r.view && r.view(st, st.view_active)) || `<div class="text-center py-10 text-t3 font-mono text-[11px]">该视图暂无数据</div>`;
  } else {
    detailTitle.textContent = 'VIEW DETAIL';
    detailMeta.textContent = 'empty';
    detailBody.innerHTML = `<div class="text-center py-10 text-t3 font-mono text-[11px]">选择左侧任意视图查看详情</div>`;
  }
  if (window.lucide) lucide.createIcons();
}

function renderBanner(st){
  const wrap = document.getElementById('scn-banner');
  if (!st.banner){ wrap.innerHTML=''; return; }
  const {level, message} = st.banner;
  const icon = level==='red' ? 'octagon-x' : 'alert-triangle';
  const colorVar = level==='red' ? 'var(--danger)' : 'var(--warn)';
  wrap.innerHTML = `
    <div class="card flex items-start gap-3 p-3" style="border-color:${colorVar}40; background:${colorVar}14;">
      <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style="background:${colorVar}22;">
        <i data-lucide="${icon}" class="w-4 h-4" style="color:${colorVar}"></i>
      </div>
      <div class="text-[13px] leading-relaxed flex-1">
        <div class="font-medium mb-0.5">${level==='red' ? '红色提醒 · 阻断结论' : '黄色提醒 · 倾向性判断'}</div>
        <div class="text-t2">${message}</div>
      </div>
      <button class="btn btn-ghost text-[12px]" onclick="dismissBanner()">忽略</button>
    </div>`;
  if (window.lucide) lucide.createIcons();
}
window.dismissBanner = ()=>{ SE.state[currentScn].banner = null; renderScene(); };

/* =============== SCENE RENDERERS — per-scenario, field schema aware =============== */

function alertChip(level, reason){
  if (!level) return '';
  return `<span class="field-alert lvl-${level}" title="${reason||''}">${level==='red'?'red':'yellow'}</span>`;
}

function findAlert(st, key){
  return (st.field_alerts||[]).find(a => a.key === key);
}

function decisionBadge(decision, scenarioKey){
  const map = {
    recommended:{cls:'chip-ok',    label:'建议推进 / 录取'},
    pending:    {cls:'chip-warn',  label:'待确认 · 需补 JD'},
    reject:     {cls:'chip-danger',label:'不推荐'},
    sign:       {cls:'chip-ok',    label:'建议签署'},
    revise:     {cls:'chip-warn',  label:'建议修订后签署'},
    legal_review:{cls:'chip-danger',label:'需法务复核'},
    reviewed:   {cls:'chip-ok',    label:'已完成核对'},
    partial:    {cls:'chip-warn',  label:'仅基于单据 · 待补流水'},
    deep_read:  {cls:'chip-ok',    label:'值得精读'},
    skim:       {cls:'chip-warn',  label:'可作参考'},
    skip:       {cls:'chip-danger',label:'可跳过'},
  };
  const m = map[decision] || {cls:'',label:decision||'—'};
  return `<span class="chip ${m.cls}"><span class="dot"></span>${m.label}</span>`;
}

const SCENE_RENDERERS = {

  /* ---------- 简历 ---------- */
  resume: {
    headline(st){
      const f = st.fields || {};
      const conf = st.confidence_level;
      return `
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style="background:var(--grad-soft); border:1px solid var(--line-2);">
            <i data-lucide="user-round" class="w-5 h-5" style="color:var(--ba)"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <h3 class="text-[18px] font-medium tracking-tight">${f.name||'—'}</h3>
              <span class="text-t3 text-[12.5px]">· ${f.current_title||''} @ ${f.current_company||''}</span>
              ${decisionBadge(st.fields?.job_match_summary?.level || (st.supp_file?'recommended':'pending'))}
            </div>
            <p class="text-t2 text-[13.5px] leading-relaxed">${st.summary||''}</p>
            <div class="flex items-center gap-3 mt-3 text-[11px] font-mono text-t3">
              <span><span class="text-t1">${f.work_years||0}</span>y · <span class="text-t1">${f.education_top?.degree||'—'}</span></span>
              <span class="text-t3">·</span>
              <span>conf: <span class="text-t1">${conf||'—'}</span></span>
            </div>
          </div>
        </div>
      `;
    },
    fields(st){
      const f = st.fields||{};
      const items = [
        ['name', '姓名', f.name],
        ['education_top','最高学历', f.education_top ? `${f.education_top.degree} · ${f.education_top.major}（${f.education_top.school}）`:''],
        ['work_years','工作年限', f.work_years ? `${f.work_years} 年`:''],
        ['current_title','当前职位', f.current_title],
        ['current_company','当前公司', f.current_company],
        ['skills','技能', (f.skills||[]).slice(0,4).join(' · ')+(f.skills?.length>4?' · …':'')],
      ];
      return items.map(([k,label,v])=>{
        const a = findAlert(st, k);
        return `<div class="field-row">
          <div class="k">${label}</div>
          <div class="v">${v||'—'} ${a?alertChip(a.level,a.reason):''}</div>
        </div>`;
      }).join('');
    },
    keyJudgment(st){
      const f = st.fields||{};
      const m = f.job_match_summary;
      if (!m){
        return `
          <p class="text-t2 text-[13px] leading-relaxed">未补 JD · 仅按经历输出能力线索：</p>
          <ul class="text-t2 text-[12.5px] leading-relaxed list-disc pl-4 space-y-1 mt-2">
            <li>分布式系统经验扎实（${f.work_years||5}y）</li>
            <li>缺少 0→1 / 团队 lead 经验证据</li>
            <li>简历有 1 处弱表达，待面试核实</li>
          </ul>
        `;
      }
      return `
        <div class="flex items-baseline gap-2 mb-2">
          <span class="numtile" style="font-size:32px;">${m.score}</span>
          <span class="text-t3 text-[11px] font-mono uppercase tracking-wider">match score</span>
        </div>
        <div class="space-y-1.5">
          ${m.evidences.map(e=>`
            <div class="flex items-center justify-between text-[12.5px]">
              <span class="text-t1">${e.dim}</span>
              <span class="chip ${e.match==='强'?'chip-ok':(e.match==='中'?'chip-warn':'chip-danger')}"><span class="dot"></span>${e.match}</span>
            </div>
          `).join('')}
        </div>
      `;
    },
    summaryDecision(st){
      const f = st.fields||{};
      const m = f.job_match_summary;
      return `
        <p class="text-[13.5px] leading-relaxed mb-3">${st.summary||''}</p>
        <div class="flex flex-wrap gap-1.5">
          ${decisionBadge(st.decision)}
          ${st.degraded ? '<span class="chip chip-warn"><span class="dot"></span>参考性判断</span>' : ''}
        </div>
        ${m?.pending?.length ? `
          <div class="hr-grad my-3"></div>
          <div class="section-title mb-2">PENDING · 待确认</div>
          <ul class="text-t2 text-[12px] leading-relaxed list-disc pl-4 space-y-0.5">
            ${m.pending.map(p=>`<li>${p}</li>`).join('')}
          </ul>
        `:''}
      `;
    },
    view(st, key){
      const f = st.fields||{};
      if (key === 'info') return SCENE_RENDERERS.resume.fields(st).replace(/<\/div>$/,'</div>');
      if (key === 'timeline'){
        return `
          <div class="space-y-3">
            ${(f.projects||[]).map(p=>`
              <div class="flex items-start gap-3">
                <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style="background:var(--grad-soft);">
                  <i data-lucide="briefcase" class="w-3.5 h-3.5" style="color:var(--ba)"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-baseline gap-2 flex-wrap">
                    <span class="text-[13px] font-medium">${p.role}</span>
                    <span class="text-t3 text-[12px]">@ ${p.co}</span>
                  </div>
                  <div class="text-t3 text-[11px] font-mono">${p.dur}</div>
                  <div class="text-t2 text-[12.5px] mt-1">${p.detail}</div>
                </div>
              </div>
            `).join('')}
            ${(f.weak_phrases||[]).length ? `
              <div class="rounded-8 border p-2.5 text-[12px]" style="border-color:rgba(250,204,21,.4); background:rgba(250,204,21,.08);">
                <div class="font-mono text-[10px] uppercase tracking-wider mb-1" style="color:var(--warn)">WEAK PHRASE</div>
                ${f.weak_phrases.map(w=>`<div class="text-t1">"<b>${w.phrase}</b>" — ${w.reason}</div>`).join('')}
              </div>
            `:''}
          </div>
        `;
      }
      if (key === 'jdmatch'){
        const m = f.job_match_summary;
        if (!m) return `<div class="text-t3 text-[12px] py-6 text-center font-mono">未补 JD</div>`;
        return `
          <div class="text-[13px] mb-3">岗位匹配评分 <b>${m.score}</b> · ${m.level==='recommended'?'建议推进':'待确认'}</div>
          <table class="w-full text-[12.5px]">
            <thead><tr class="text-t3"><th class="text-left py-1 font-mono text-[10px] uppercase">维度</th><th class="text-left font-mono text-[10px] uppercase">来源</th><th class="text-right font-mono text-[10px] uppercase">匹配</th></tr></thead>
            <tbody>${m.evidences.map(e=>`
              <tr class="border-t border-line1"><td class="py-1.5">${e.dim}</td><td class="font-mono text-[11px] text-t3">${e.from}</td><td class="text-right">${e.match}</td></tr>
            `).join('')}</tbody>
          </table>
        `;
      }
      if (key === 'iq'){
        return `
          <ol class="space-y-2 text-[13px]">
            ${(f.interview_focus||[]).map((q,i)=>`
              <li class="flex gap-2.5">
                <span class="font-mono text-[10px] text-t3 mt-1">Q${(i+1).toString().padStart(2,'0')}</span>
                <span>${q}</span>
              </li>
            `).join('')}
          </ol>
        `;
      }
    }
  },

  /* ---------- 合同 ---------- */
  contract: {
    headline(st){
      const f = st.fields||{};
      return `
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style="background:var(--grad-soft); border:1px solid var(--line-2);">
            <i data-lucide="file-signature" class="w-5 h-5" style="color:var(--ba)"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <h3 class="text-[18px] font-medium tracking-tight truncate">${f.contract_type||'—'}</h3>
              ${decisionBadge(st.decision)}
            </div>
            <p class="text-t2 text-[13.5px] leading-relaxed">${st.summary||''}</p>
            <div class="flex items-center gap-3 mt-3 text-[11px] font-mono text-t3 flex-wrap">
              <span>${f.party_a?.name||''} ↔ ${f.party_b?.name||''}</span>
              <span>·</span>
              <span><span class="text-t1">${f.total_amount?.amount?.toLocaleString()||'—'} ${f.total_amount?.currency||''}</span> / ${f.total_amount?.period||''}</span>
              <span>·</span>
              <span>${f.start_date||'—'} → ${f.end_date||'—'}</span>
            </div>
          </div>
        </div>
      `;
    },
    fields(st){
      const f = st.fields||{};
      const items = [
        ['contract_type','合同类型', f.contract_type],
        ['party_a','甲方', f.party_a?.name],
        ['party_b','乙方', f.party_b?.name],
        ['subject','合同标的', f.subject],
        ['total_amount','总金额', f.total_amount ? `${f.total_amount.amount?.toLocaleString()} ${f.total_amount.currency} · ${f.total_amount.period}`:''],
        ['date','期限', f.start_date && f.end_date ? `${f.start_date} → ${f.end_date}`:''],
      ];
      return items.map(([k,label,v])=>{
        const a = findAlert(st, k);
        return `<div class="field-row">
          <div class="k">${label}</div>
          <div class="v">${v||'—'} ${a?alertChip(a.level,a.reason):''}</div>
        </div>`;
      }).join('');
    },
    keyJudgment(st){
      const f = st.fields||{};
      const top = (f.risk_points||[]).slice(0,4);
      return `
        <ul class="space-y-1.5">
          ${top.map(it=>{
            const c = it.level==='red' ? 'var(--danger)' : (it.level==='warn' ? 'var(--warn)' : 'var(--ok)');
            const icon = it.level==='red' ? 'octagon-x' : (it.level==='warn' ? 'alert-triangle' : 'check');
            return `
              <li class="flex items-start gap-2 p-2 rounded-8" style="background:${c}10; border:1px solid ${c}30;">
                <i data-lucide="${icon}" class="w-3.5 h-3.5 mt-0.5 shrink-0" style="color:${c}"></i>
                <span class="text-[12.5px]"><span class="font-mono text-t3">${it.no}</span> ${it.txt}</span>
              </li>`;
          }).join('')}
        </ul>
      `;
    },
    summaryDecision(st){
      return `
        <p class="text-[13.5px] leading-relaxed mb-3">${st.summary||''}</p>
        <div class="flex flex-wrap gap-1.5">
          ${decisionBadge(st.decision)}
          ${st.degraded ? '<span class="chip chip-warn"><span class="dot"></span>参考性判断</span>' : ''}
        </div>
        <div class="hr-grad my-3"></div>
        <div class="section-title mb-2">NEGOTIATION · 待谈判</div>
        <ol class="text-[12px] text-t2 leading-relaxed space-y-1 pl-4 list-decimal">
          ${(st.fields?.negotiation_list||[]).slice(0,4).map(t=>`<li>${t}</li>`).join('')}
        </ol>
      `;
    },
    view(st, key){
      const f = st.fields||{};
      if (key === 'kv') return SCENE_RENDERERS.contract.fields(st);
      if (key === 'risks'){
        return `<ul class="space-y-1.5">
          ${(f.risk_points||[]).map(it=>{
            const c = it.level==='red' ? 'var(--danger)' : (it.level==='warn' ? 'var(--warn)' : 'var(--ok)');
            return `<li class="flex items-start gap-2 p-2 rounded-8" style="background:${c}10; border:1px solid ${c}30;">
              <span class="font-mono text-[10px] mt-0.5" style="color:${c}">${it.level==='red'?'RED':'WARN'}</span>
              <span class="text-[12.5px]"><span class="font-mono text-t3">${it.no}</span> ${it.txt}</span>
            </li>`;
          }).join('')}
        </ul>`;
      }
      if (key === 'diffs'){
        if (!f.clause_diffs) return `<div class="text-t3 text-[12px] py-6 text-center font-mono">未补对方合同</div>`;
        return `<table class="w-full text-[12px]">
          <thead><tr class="text-t3 font-mono text-[10px] uppercase">
            <th class="text-left py-1.5">维度</th><th class="text-left">我方</th><th class="text-left">对方</th>
          </tr></thead>
          <tbody>${f.clause_diffs.map(d=>`
            <tr class="border-t border-line1">
              <td class="py-2">${d.dim}</td>
              <td class="text-t2">${d.ours}</td>
              <td class="text-t1">${d.theirs}</td>
            </tr>
          `).join('')}</tbody>
        </table>`;
      }
      if (key === 'todo'){
        return `<ol class="space-y-1.5 text-[12.5px] list-decimal pl-4">
          ${(f.negotiation_list||[]).map(t=>`<li>${t}</li>`).join('')}
        </ol>`;
      }
    }
  },

  /* ---------- 对账单 ---------- */
  statement: {
    headline(st){
      const m = st.fields?.calc_metrics || {};
      return `
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style="background:var(--grad-soft); border:1px solid var(--line-2);">
            <i data-lucide="banknote" class="w-5 h-5" style="color:var(--ba)"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <h3 class="text-[18px] font-medium tracking-tight">手写单据 ${st.supp_file?'+ 银行流水':''}</h3>
              ${decisionBadge(st.decision)}
            </div>
            <p class="text-t2 text-[13.5px] leading-relaxed">${st.summary||''}</p>
            <div class="grid grid-cols-3 gap-3 mt-4">
              <div><div class="numtile" style="font-size:24px;">¥${(m.income_total||0).toLocaleString()}</div><div class="text-t3 text-[10px] font-mono uppercase mt-1">收入合计</div></div>
              <div><div class="numtile" style="font-size:24px;">¥${(m.expense_total||0).toLocaleString()}</div><div class="text-t3 text-[10px] font-mono uppercase mt-1">支出合计</div></div>
              <div><div class="numtile" style="font-size:24px;">${m.recovery_rate?Math.round(m.recovery_rate*100)+'%':'—'}</div><div class="text-t3 text-[10px] font-mono uppercase mt-1">回款率</div></div>
            </div>
          </div>
        </div>
      `;
    },
    fields(st){
      const f = st.fields||{};
      return `
        <div class="field-row">
          <div class="k">单据条目</div>
          <div class="v">${f.receipt_entries?.length||0} 笔（手写）</div>
        </div>
        <div class="field-row">
          <div class="k">流水条目</div>
          <div class="v">${f.statement_entries?.length||0} 笔 ${st.supp_file?'':'· 未补流水'}</div>
        </div>
        <div class="field-row">
          <div class="k">已匹配</div>
          <div class="v">${f.matched_pairs?.length||0} 笔</div>
        </div>
        <div class="field-row">
          <div class="k">未匹配 / 异常</div>
          <div class="v">${f.mismatch_items?.length||0} 笔 ${(f.mismatch_items?.length||0)?alertChip('red','存在异常'):''}</div>
        </div>
      `;
    },
    keyJudgment(st){
      const m = st.fields?.calc_metrics || {};
      return `
        <div class="space-y-2 text-[12.5px]">
          <div class="flex items-center justify-between"><span class="text-t2">收入合计</span><span class="font-mono">¥${(m.income_total||0).toLocaleString()}</span></div>
          <div class="flex items-center justify-between"><span class="text-t2">支出合计</span><span class="font-mono">¥${(m.expense_total||0).toLocaleString()}</span></div>
          <div class="flex items-center justify-between"><span class="text-t2">净额</span><span class="font-mono text-t1">¥${(m.net||0).toLocaleString()}</span></div>
          ${m.recovery_rate!=null ? `<div class="flex items-center justify-between"><span class="text-t2">回款率</span><span class="font-mono">${Math.round(m.recovery_rate*100)}%</span></div>`:''}
          <div class="flex items-center justify-between pt-2 border-t border-line1">
            <span class="text-t2">校验</span>
            ${m.verified ? '<span class="chip chip-ok"><span class="dot"></span>已核对</span>' : '<span class="chip chip-warn"><span class="dot"></span>仅基于单据</span>'}
          </div>
        </div>
      `;
    },
    summaryDecision(st){
      return `
        <p class="text-[13.5px] leading-relaxed mb-3">${st.fields?.analysis_summary||''}</p>
        <div class="flex flex-wrap gap-1.5">
          ${decisionBadge(st.decision)}
          ${st.degraded ? '<span class="chip chip-warn"><span class="dot"></span>参考性判断</span>' : ''}
        </div>
        ${(st.fields?.mismatch_items||[]).length ? `
          <div class="hr-grad my-3"></div>
          <div class="section-title mb-2">MISMATCH · 待核</div>
          <ul class="text-[12px] text-t2 leading-relaxed space-y-1">
            ${st.fields.mismatch_items.map(m=>`<li>${m.reason}</li>`).join('')}
          </ul>
        `:''}
      `;
    },
    view(st, key){
      const f = st.fields||{};
      if (key === 'receipt'){
        return `<table class="w-full text-[12px]">
          <thead><tr class="text-t3 font-mono text-[10px] uppercase"><th class="text-left py-1">日期</th><th class="text-left">对方</th><th class="text-left">用途</th><th class="text-right">金额</th></tr></thead>
          <tbody>${(f.receipt_entries||[]).map(e=>`
            <tr class="border-t border-line1">
              <td class="py-1.5 font-mono">${e.date}</td>
              <td>${e.party}</td>
              <td class="text-t2">${e.purpose}</td>
              <td class="text-right font-mono ${e.dir==='in'?'text-ok':'text-warn'}">${e.dir==='in'?'+':'-'}¥${e.amount.toLocaleString()}</td>
            </tr>`).join('')}</tbody>
        </table>`;
      }
      if (key === 'reconcile'){
        if (!st.supp_file) return `<div class="text-t3 text-[12px] py-6 text-center font-mono">未补银行对账单</div>`;
        return `
          <div class="grid grid-cols-3 gap-2 text-[11px] font-mono uppercase tracking-wider text-t3 mb-2">
            <div>单据</div><div>流水</div><div>结果</div>
          </div>
          ${(f.matched_pairs||[]).map(p=>{
            const r = f.receipt_entries[p.receipt];
            const s = f.statement_entries[p.statement];
            const c = p.status==='ok'?'var(--ok)':'var(--warn)';
            return `
              <div class="grid grid-cols-3 gap-2 text-[11.5px] py-1.5 border-t border-line1">
                <div class="font-mono">${r.date} · ¥${r.amount}</div>
                <div class="font-mono">${s.date} · ¥${s.amount}</div>
                <div class="font-mono" style="color:${c}">${p.status==='ok'?'✓ 一致':'差 '+p.diff}</div>
              </div>`;
          }).join('')}
        `;
      }
      if (key === 'diff'){
        if (!st.supp_file) return `<div class="text-t3 text-[12px] py-6 text-center font-mono">未补银行对账单</div>`;
        return `<ul class="space-y-1.5">
          ${(f.mismatch_items||[]).map(it=>`
            <li class="flex items-start gap-2 p-2 rounded-8" style="background:rgba(220,38,38,.10); border:1px solid rgba(220,38,38,.3);">
              <i data-lucide="x" class="w-3.5 h-3.5 mt-0.5 shrink-0" style="color:var(--danger)"></i>
              <span class="text-[12.5px]">${it.reason}</span>
            </li>`).join('')}
        </ul>`;
      }
      if (key === 'metrics'){
        return SCENE_RENDERERS.statement.keyJudgment(st);
      }
    }
  },

  /* ---------- 论文 ---------- */
  paper: {
    headline(st){
      const p = st.fields?.target_paper_profile || {};
      return `
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style="background:var(--grad-soft); border:1px solid var(--line-2);">
            <i data-lucide="book-open-text" class="w-5 h-5" style="color:var(--ba)"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <h3 class="text-[17px] font-medium tracking-tight leading-snug">${p.title||'—'}</h3>
              ${decisionBadge(st.decision)}
            </div>
            <p class="text-t2 text-[13px] leading-relaxed">${st.fields?.paper_summary||st.summary||''}</p>
            <div class="flex items-center gap-3 mt-3 text-[11px] font-mono text-t3 flex-wrap">
              <span>${p.authors||''}</span>
              <span>·</span>
              <span class="text-t1">${p.venue||''}</span>
              <span>·</span>
              <span>${(p.keywords||[]).join(' · ')}</span>
            </div>
          </div>
        </div>
      `;
    },
    fields(st){
      const p = st.fields?.target_paper_profile || {};
      return `
        <div class="field-row"><div class="k">研究问题</div><div class="v">${p.rq||'—'}</div></div>
        <div class="field-row"><div class="k">使用方法</div><div class="v">${(p.method||[]).slice(0,2).join('；')}${(p.method||[]).length>2?'…':''}</div></div>
        <div class="field-row"><div class="k">核心结果</div><div class="v">${(p.results||[]).map(r=>`${r.metric}: <b>${r.value}</b>`).slice(0,2).join('；')}</div></div>
        <div class="field-row"><div class="k">适用边界</div><div class="v">${p.scope||'—'}</div></div>
      `;
    },
    keyJudgment(st){
      const r = st.fields?.relevance_judgement;
      if (!r){
        return `
          <p class="text-t2 text-[13px] leading-relaxed">未补研究上下文 · 仅输出参考性判断：</p>
          <ul class="text-t2 text-[12.5px] leading-relaxed list-disc pl-4 mt-2 space-y-1">
            <li>方法相对成熟，可作为综述材料</li>
            <li>是否值得精读，需补研究方向</li>
          </ul>`;
      }
      return `
        <div class="flex items-baseline gap-2 mb-2">
          <span class="numtile" style="font-size:32px;">${Math.round(r.score*100)}</span>
          <span class="text-t3 text-[11px] font-mono uppercase tracking-wider">relevance</span>
        </div>
        <div class="text-[12px] text-t2 mb-2">相关性 <b class="text-t1">${r.level}</b></div>
        <ul class="text-[12px] text-t2 leading-relaxed list-disc pl-4 space-y-0.5">
          ${(r.points||[]).map(p=>`<li>${p}</li>`).join('')}
        </ul>
      `;
    },
    summaryDecision(st){
      return `
        <p class="text-[13.5px] leading-relaxed mb-3">${st.summary||''}</p>
        <div class="flex flex-wrap gap-1.5">
          ${decisionBadge(st.decision)}
          ${st.degraded ? '<span class="chip chip-warn"><span class="dot"></span>参考性判断</span>' : ''}
        </div>
        ${(st.fields?.reference_value||[]).length ? `
          <div class="hr-grad my-3"></div>
          <div class="section-title mb-2">REFERENCE · 可借鉴</div>
          <ul class="text-[12px] text-t2 leading-relaxed list-disc pl-4 space-y-1">
            ${st.fields.reference_value.map(r=>`<li><b class="text-t1">${r.dim}</b>：${r.val}</li>`).join('')}
          </ul>
        `:''}
      `;
    },
    view(st, key){
      const f = st.fields||{};
      const p = f.target_paper_profile || {};
      if (key === 'profile'){
        return `
          <div class="space-y-2 text-[12.5px]">
            <div><span class="text-t3 font-mono text-[10px] uppercase block mb-0.5">RQ</span>${p.rq||'—'}</div>
            <div><span class="text-t3 font-mono text-[10px] uppercase block mb-0.5">METHOD</span>
              <ul class="list-disc pl-4 space-y-0.5">${(p.method||[]).map(m=>`<li>${m}</li>`).join('')}</ul>
            </div>
            <div><span class="text-t3 font-mono text-[10px] uppercase block mb-0.5">RESULTS</span>
              <table class="w-full"><tbody>${(p.results||[]).map(r=>`<tr class="border-t border-line1"><td class="py-1 text-t2">${r.metric}</td><td class="text-right font-mono">${r.value}</td></tr>`).join('')}</tbody></table>
            </div>
          </div>
        `;
      }
      if (key === 'context'){
        if (!f.user_research_context) return `<div class="text-t3 text-[12px] py-6 text-center font-mono">未补研究上下文</div>`;
        const u = f.user_research_context;
        return `
          <div class="space-y-1.5 text-[12.5px]">
            <div><span class="text-t3 font-mono text-[10px] uppercase">方向</span><div>${u.direction}</div></div>
            <div><span class="text-t3 font-mono text-[10px] uppercase">关注</span><div>${u.focus}</div></div>
            <div><span class="text-t3 font-mono text-[10px] uppercase">方法偏好</span><div>${u.method_pref}</div></div>
            <div><span class="text-t3 font-mono text-[10px] uppercase">写作目的</span><div>${u.purpose}</div></div>
          </div>
        `;
      }
      if (key === 'inspire'){
        if (!f.reference_value) return `<div class="text-t3 text-[12px] py-6 text-center font-mono">未补研究上下文</div>`;
        return `<ul class="space-y-1.5 text-[12.5px]">
          ${f.reference_value.map(r=>`<li><b class="text-t1">${r.dim}</b>：<span class="text-t2">${r.val}</span></li>`).join('')}
        </ul>`;
      }
      if (key === 'enhance'){
        return `
          <div class="text-t3 text-[11px] font-mono uppercase tracking-wider mb-2">EXP · 可解释性增强</div>
          <div class="grid grid-cols-2 gap-2">
            <div class="rounded-8 border border-line2 p-3 text-[12px]"><i data-lucide="function-square" class="w-3.5 h-3.5 inline-block mr-1" style="color:var(--ba)"></i>公式翻转卡</div>
            <div class="rounded-8 border border-line2 p-3 text-[12px]"><i data-lucide="layers" class="w-3.5 h-3.5 inline-block mr-1" style="color:var(--bb)"></i>PDF 分层视图</div>
            <div class="rounded-8 border border-line2 p-3 text-[12px]"><i data-lucide="map" class="w-3.5 h-3.5 inline-block mr-1" style="color:var(--ba)"></i>heatmap</div>
            <div class="rounded-8 border border-line2 p-3 text-[12px]"><i data-lucide="message-square" class="w-3.5 h-3.5 inline-block mr-1" style="color:var(--bb)"></i>point-to-ask</div>
          </div>
        `;
      }
    }
  },
};

/* =============== SCENE EVENT — load / parse / supplement =============== */

function uploadSupplement(f){
  const k = currentScn;
  const st = SE.state[k];
  st.supp_file = {...f};
  if (st.state === 'result_ready') st.state = 'supplement_added';
  toast(`已收到补充材料：${f.name} · 重新解析以追加结果`);
  renderScene();
}

function clearSupplement(){
  const k = currentScn;
  const st = SE.state[k];
  st.supp_file = null;
  // re-parse with main only if already had result
  if (st.state === 'result_ready' || st.state === 'followup_active'){
    startParse();
  } else {
    renderScene();
  }
}

function startParse(){
  const k = currentScn;
  const st = SE.state[k];
  if (!st.main_file){ toast('请先在首页上传主文件'); return; }

  st.state = 'parsing';
  st.parsing_phase = 'preparing';
  renderScene();

  const phases = ['preparing','extracting','summarizing'];
  let i = 0;
  const tick = () => {
    if (i >= phases.length){
      // PRD 2.3.2: 同批次刷新
      const gen = MOCK[k];
      if (!gen){ st.state = 'error'; st.error = {code:'E_NO_MOCK', message:'未配置 mock'}; renderScene(); return; }
      const out = gen({hasSupp: !!st.supp_file});
      st.fields = out.fields;
      st.field_alerts = out.field_alerts || [];
      st.confidence_level = out.confidence;
      st.summary = out.summary;
      st.decision = out.decision;
      st.degraded = !!out.degraded;
      st.state = 'result_ready';
      st.parsing_phase = null;
      if (!st.view_active){
        st.view_active = (SE.scenarios[k].views.find(v=>v.always)?.key) || null;
      }
      // history record
      SE.history.unshift({
        task_id: st.task_id,
        scenario: k,
        file: st.main_file.name,
        supp: st.supp_file?.name || null,
        state: 'result_ready',
        confidence: out.confidence,
        decision: out.decision,
        created: Date.now(),
      });
      if (SE.history.length > 30) SE.history.pop();
      renderScene();
      return;
    }
    st.parsing_phase = phases[i++];
    renderScene();
    setTimeout(tick, 700);
  };
  setTimeout(tick, 500);
}

function retry(){
  const st = SE.state[currentScn];
  if (!st.main_file){ toast('没有可重试的文件'); return; }
  st.state = 'scene_entered';
  st.error = null;
  renderScene();
}

function setDemoMode(on){
  SE.demoMode = !!on;
  document.getElementById('demo-dot').className = 'w-1.5 h-1.5 rounded-full ' + (on ? 'bg-warn animate-pulse' : 'bg-t3');
  document.getElementById('demo-label').textContent = on ? 'DEMO ON' : 'DEMO OFF';
  if (location.hash.startsWith('#/scene/')) renderScene();
  if (location.hash === '#/' || location.hash === '') renderHome();
  toast(on ? '演示兼容模式：已开启' : '演示兼容模式：已关闭');
}

/* =============== EXPORT — per scenario =============== */

function bindExportMenu(){
  const btn = document.getElementById('export-btn');
  const menu = document.getElementById('export-menu');
  if (!btn || !menu) return;
  const s = SE.scenarios[currentScn];
  menu.innerHTML = (s.outputs||[]).map((o,i)=>`
    <div class="item" data-eidx="${i}">
      <i data-lucide="${o.fmt==='PNG'?'image':(o.fmt==='CSV'?'table':'file-text')}" class="w-3.5 h-3.5"></i>
      <span class="flex-1">${o.label}</span>
      <span class="fmt">${o.fmt}</span>
    </div>
  `).join('');
  btn.onclick = e => { e.stopPropagation(); menu.classList.toggle('show'); };
  document.addEventListener('click', closeExp, {once:true});
  function closeExp(){ menu.classList.remove('show'); }
  menu.querySelectorAll('.item').forEach(it=>{
    it.addEventListener('click', e=>{
      e.stopPropagation();
      const idx = parseInt(it.getAttribute('data-eidx'),10);
      doExport(s.outputs[idx]);
      menu.classList.remove('show');
    });
  });
  if (window.lucide) lucide.createIcons();
}

function doExport(o){
  const k = currentScn;
  const st = SE.state[k];
  const s = SE.scenarios[k];
  let content = '', mime = 'text/plain';
  if (o.fmt === 'JSON'){
    mime = 'application/json';
    content = JSON.stringify({task_id:st.task_id, scenario:k, main_file:st.main_file?.name, supp_file:st.supp_file?.name, fields:st.fields, summary:st.summary, decision:st.decision}, null, 2);
  } else if (o.fmt === 'MD'){
    mime = 'text/markdown';
    content = buildMarkdown(s, st, o);
  } else if (o.fmt === 'CSV'){
    mime = 'text/csv';
    content = buildCSV(s, st);
  } else if (o.fmt === 'PNG'){
    toast('PNG 导出占位 · 需要 html2canvas（演示态可后续接入）');
    return;
  }
  const blob = new Blob([content], {type: mime});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = o.filename; a.click();
  URL.revokeObjectURL(url);
  toast(`已导出 ${o.label}（${o.fmt}）`);
}

function buildMarkdown(s, st, o){
  const f = st.fields||{};
  const head = `# ${s.name} 场景 — ${o.label}\n\n- **task_id**: \`${st.task_id||''}\`\n- **主文件**: ${st.main_file?.name||'—'}\n- **补充材料**: ${st.supp_file?.name||'未补'}\n- **生成时间**: ${new Date().toLocaleString()}\n- **置信度**: ${st.confidence_level||'—'}\n${st.degraded?'- **结论降级**: 参考性判断\n':''}\n## 摘要\n${st.summary||'—'}\n\n## 决策\n${st.decision||'—'}\n\n`;
  if (currentScn === 'resume'){
    return head + `## 候选人卡\n- 姓名：${f.name}\n- 现职：${f.current_title} @ ${f.current_company}\n- 学历：${f.education_top?.degree} ${f.education_top?.major}\n- 经验：${f.work_years} 年\n- 技能：${(f.skills||[]).join(' · ')}\n\n## 经历\n${(f.projects||[]).map(p=>`- **${p.role}** @ ${p.co}（${p.dur}）：${p.detail}`).join('\n')}\n\n## 面试问题\n${(f.interview_focus||[]).map((q,i)=>`${i+1}. ${q}`).join('\n')}\n`;
  }
  if (currentScn === 'contract'){
    return head + `## 关键信息\n- 类型：${f.contract_type}\n- 甲乙方：${f.party_a?.name} ↔ ${f.party_b?.name}\n- 标的：${f.subject}\n- 金额：${f.total_amount?.amount} ${f.total_amount?.currency} / ${f.total_amount?.period}\n- 期限：${f.start_date} → ${f.end_date}\n\n## 风险点\n${(f.risk_points||[]).map(r=>`- [${r.level.toUpperCase()}] ${r.no}：${r.txt}`).join('\n')}\n\n## 待谈判事项\n${(f.negotiation_list||[]).map((t,i)=>`${i+1}. ${t}`).join('\n')}\n`;
  }
  if (currentScn === 'statement'){
    const m = f.calc_metrics||{};
    return head + `## 验算指标\n- 收入：¥${m.income_total?.toLocaleString()}\n- 支出：¥${m.expense_total?.toLocaleString()}\n- 净额：¥${m.net?.toLocaleString()}\n- 回款率：${m.recovery_rate?Math.round(m.recovery_rate*100)+'%':'—'}\n- 校验：${m.verified?'已核对':'仅基于单据'}\n\n## 单据条目\n${(f.receipt_entries||[]).map(e=>`- ${e.date}｜${e.dir==='in'?'+':'-'}¥${e.amount}｜${e.party}｜${e.purpose}`).join('\n')}\n\n## 异常\n${(f.mismatch_items||[]).map(it=>`- ${it.reason}`).join('\n')||'无'}\n`;
  }
  if (currentScn === 'paper'){
    const p = f.target_paper_profile||{};
    return head + `## 目标论文\n- 标题：${p.title}\n- 作者：${p.authors}\n- 会议：${p.venue}\n- RQ：${p.rq}\n\n## 方法\n${(p.method||[]).map(m=>`- ${m}`).join('\n')}\n\n## 结果\n${(p.results||[]).map(r=>`- ${r.metric}: ${r.value}`).join('\n')}\n\n## 可借鉴\n${(f.reference_value||[]).map(r=>`- ${r.dim}：${r.val}`).join('\n')||'未补研究上下文'}\n`;
  }
  return head + JSON.stringify(f, null, 2);
}

function buildCSV(s, st){
  const f = st.fields||{};
  if (currentScn === 'statement'){
    const rows = [['date','direction','amount','party','purpose','source']];
    (f.receipt_entries||[]).forEach(e => rows.push([e.date, e.dir, e.amount, e.party, e.purpose, 'receipt']));
    (f.statement_entries||[]).forEach(e => rows.push([e.date, e.dir, e.amount, '—', e.desc, 'statement']));
    return rows.map(r=>r.join(',')).join('\n');
  }
  return 'no_csv_template_for_this_scenario';
}

/* =============== HISTORY =============== */
const histFilter = { scn: new Set(), status: new Set(), q: '' };

function renderHistory(){
  const scnOpts = ['resume','contract','statement','paper'];
  const stOpts = ['result_ready','followup_active','error'];
  const f1 = document.getElementById('hist-scn-filter');
  f1.innerHTML = scnOpts.map(k=>`<button class="tab-pill ${histFilter.scn.has(k)?'on':''}" data-scn="${k}">${SE.scenarios[k].name}</button>`).join('');
  const f2 = document.getElementById('hist-status-filter');
  f2.innerHTML = stOpts.map(s=>`<button class="tab-pill ${histFilter.status.has(s)?'on':''}" data-st="${s}">${s.replace('_',' ')}</button>`).join('');

  f1.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ const k=b.dataset.scn; histFilter.scn.has(k)?histFilter.scn.delete(k):histFilter.scn.add(k); renderHistory(); }));
  f2.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ const k=b.dataset.st; histFilter.status.has(k)?histFilter.status.delete(k):histFilter.status.add(k); renderHistory(); }));

  let rows = SE.history.slice();
  if (histFilter.scn.size) rows = rows.filter(r=>histFilter.scn.has(r.scenario));
  if (histFilter.status.size) rows = rows.filter(r=>histFilter.status.has(r.state || r.status));
  if (histFilter.q) rows = rows.filter(r=>(r.task_id+' '+r.file+' '+(r.supp||'')).toLowerCase().includes(histFilter.q.toLowerCase()));

  document.getElementById('hist-tbody').innerHTML = rows.map(r => {
    const stKey = r.state || r.status;
    return `
    <tr class="border-t border-line1 hover:bg-bg2 transition-colors">
      <td class="px-4 py-3 font-mono text-[12.5px] text-t1">${r.task_id}</td>
      <td class="px-4 py-3"><span class="chip"><span class="dot"></span>${SE.scenarios[r.scenario].name}</span></td>
      <td class="px-4 py-3">
        <div class="text-[13px] truncate max-w-[260px]">${r.file}</div>
        ${r.supp ? `<div class="text-t3 text-[11px] font-mono">+ ${r.supp}</div>` : ''}
      </td>
      <td class="px-4 py-3">${statusChip(stKey)}</td>
      <td class="px-4 py-3">
        <div class="flex items-center gap-2">
          <div class="w-20 h-1.5 rounded-full bg-bg3 overflow-hidden">
            <div class="h-full" style="width:${r.confidence==='high'?90:(r.confidence==='medium'?60:25)}%; background:${r.confidence==='low'?'var(--danger)':'var(--grad)'}"></div>
          </div>
          <span class="text-t2 text-[11px] font-mono uppercase">${r.confidence}</span>
        </div>
      </td>
      <td class="px-4 py-3 text-t3 font-mono text-[11.5px]">${timeAgo(r.created)}</td>
      <td class="px-4 py-3 text-right">
        <a href="#/scene/${r.scenario}" class="btn btn-ghost text-[12px]">重开 <i data-lucide="external-link" class="w-3 h-3"></i></a>
      </td>
    </tr>
  `;}).join('') || `<tr><td colspan="7" class="text-center py-12 text-t3 text-[13px]">没有匹配的任务</td></tr>`;

  if (window.lucide) lucide.createIcons();
}

/* =============== SETTINGS =============== */
let activeSettingsTab = 'lang';

function renderSettings(){
  document.querySelectorAll('.set-nav').forEach(a=>{
    a.classList.toggle('active', a.dataset.set===activeSettingsTab);
    a.onclick = ()=>{ activeSettingsTab = a.dataset.set; renderSettings(); };
  });
  const c = document.getElementById('set-content');
  if (activeSettingsTab==='lang'){
    c.innerHTML = `
      <h2 class="text-[18px] font-medium mb-4">输出语言</h2>
      <div class="row"><div><div>结果输出语言</div><div class="text-t3 text-[12px]">影响所有场景的判断与建议输出。</div></div>
        <div class="flex gap-1.5">
          ${['zh-CN','en-US'].map(l=>`<button class="tab-pill ${SE.settings.lang===l?'on':''}" data-lang="${l}">${l}</button>`).join('')}
        </div>
      </div>
      <div class="row"><div><div>面试问题语言</div><div class="text-t3 text-[12px]">仅简历场景生效。</div></div>
        <div class="flex gap-1.5">
          ${['跟随主语言','双语'].map(l=>`<button class="tab-pill ${l==='跟随主语言'?'on':''}" data-il>${l}</button>`).join('')}
        </div>
      </div>
    `;
    c.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{ SE.settings.lang=b.dataset.lang; renderSettings(); });
  } else if (activeSettingsTab==='display'){
    c.innerHTML = `
      <h2 class="text-[18px] font-medium mb-4">展示偏好</h2>
      <div class="row"><div><div>密度</div><div class="text-t3 text-[12px]">comfortable / compact</div></div>
        <div class="flex gap-1.5">
          ${['comfortable','compact'].map(l=>`<button class="tab-pill ${SE.settings.density===l?'on':''}" data-d="${l}">${l}</button>`).join('')}
        </div>
      </div>
      <div class="row"><div><div>背景噪点</div><div class="text-t3 text-[12px]">关闭后获得更纯净的深色底。</div></div>
        <div class="toggle ${SE.settings.keepNoise?'on':''}" data-tog="keepNoise"></div>
      </div>
      <div class="row"><div><div>显示置信度条</div><div class="text-t3 text-[12px]">在历史任务和结果区显示。</div></div>
        <div class="toggle on"></div>
      </div>
    `;
    c.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{ SE.settings.density=b.dataset.d; renderSettings(); });
  } else if (activeSettingsTab==='exp'){
    c.innerHTML = `
      <h2 class="text-[18px] font-medium mb-4">实验开关</h2>
      <div class="row"><div><div>启用 baseline 对照视图</div><div class="text-t3 text-[12px]">在演示模式下显示 baseline 入口。</div></div>
        <div class="toggle ${SE.settings.showBaseline?'on':''}" data-tog="showBaseline"></div>
      </div>
      <div class="row"><div><div>演示兼容模式</div><div class="text-t3 text-[12px]">顶部出现 DEMO chip，注入预置样例。</div></div>
        <div class="toggle ${SE.demoMode?'on':''}" id="exp-demo-tog"></div>
      </div>
      <div class="row"><div><div>追问能力（实验）</div><div class="text-t3 text-[12px]">允许在结果完成后基于上下文继续提问。</div></div>
        <div class="toggle ${SE.settings.enableExpDemo?'on':''}" data-tog="enableExpDemo"></div>
      </div>
    `;
    c.querySelectorAll('[data-tog]').forEach(t=>{
      t.onclick=()=>{
        const k = t.dataset.tog;
        SE.settings[k] = !SE.settings[k];
        renderSettings();
      };
    });
    document.getElementById('exp-demo-tog').onclick = ()=>{ setDemoMode(!SE.demoMode); renderSettings(); };
  } else if (activeSettingsTab==='about'){
    c.innerHTML = `
      <h2 class="text-[18px] font-medium mb-4">关于</h2>
      <div class="space-y-3 text-[13.5px] text-t2 leading-relaxed">
        <p><b class="text-t1">SnapExtract</b> v3.0.0 — 面向 AI PC 的高敏文档智能处理工作台。</p>
        <p>本前端遵循 <span class="font-mono">SnapExtract_Frontend_Spec_V2.0.0.md</span>，采用「场景首页 + 统一内核」的产品形态。</p>
        <p>四个独立场景：简历 · 合同 · 对账单 · 论文。所有数据本地处理，零上传。</p>
      </div>
      <div class="hr-grad my-4"></div>
      <div class="grid grid-cols-3 gap-4 text-[12px] font-mono text-t3">
        <div><div class="text-t3 mb-1">VERSION</div><div class="text-t1">3.0.0</div></div>
        <div><div class="text-t3 mb-1">SPEC</div><div class="text-t1">V2.0.0</div></div>
        <div><div class="text-t3 mb-1">RUNTIME</div><div class="text-t1">browser · single-file</div></div>
      </div>
    `;
  }
}

/* =============== UTILS =============== */
function formatSize(b){
  if (!b) return '—';
  if (b<1024) return b+' B';
  if (b<1024*1024) return (b/1024).toFixed(1)+' KB';
  return (b/1024/1024).toFixed(2)+' MB';
}

function escapeHtml(str){
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toast(msg){
  const t = document.getElementById('toast');
  document.getElementById('toast-body').textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>t.classList.add('hidden'), 2500);
}

/* =============== EVENT WIRING =============== */
window.addEventListener('DOMContentLoaded', ()=>{
  // top nav scenario chips
  document.querySelectorAll('.scn-chip').forEach(a=>a.addEventListener('click', e=>{
    e.preventDefault();
    location.hash = '#/scene/'+a.getAttribute('data-scn');
  }));

  // demo toggle (top right)
  document.getElementById('demo-toggle').addEventListener('click', ()=>setDemoMode(!SE.demoMode));

  // followup (re-parse with same files)
  document.body.addEventListener('click', e=>{
    const t = e.target.closest('#res-followup');
    if (!t) return;
    const st = SE.state[currentScn];
    st.state = 'followup_active';
    toast('追问态：模拟一次轻量再解析');
    renderScene();
    setTimeout(()=>{ st.state = 'result_ready'; renderScene(); }, 700);
  });

  // demo "load all" button (in scene right rail)
  document.body.addEventListener('click', e=>{
    const t = e.target.closest('#demo-load-all');
    if (!t) return;
    const k = currentScn, st = SE.state[k];
    const main = sampleRef(k, 'main');
    const supp = sampleRef(k, 'supp');
    if (!st.main_file && main) uploadMainFile(k, main);
    if (supp) setTimeout(()=>uploadSupplement(supp), 250);
    setTimeout(()=>startParse(), 500);
  });

  // action bar actions
  document.querySelectorAll('#actionbar [data-act]').forEach(b=>{
    b.addEventListener('click', ()=>{
      const a = b.getAttribute('data-act');
      const st = SE.state[currentScn];
      if (a==='copy'){
        navigator.clipboard.writeText(JSON.stringify(st.fields||{},null,2));
        toast('已复制字段 JSON 到剪贴板');
      }
      if (a==='export'){
        // open the inline export menu in layer3 if available
        const eb = document.getElementById('export-btn'); if (eb) { eb.click(); document.querySelector('[data-component="ResultMain"]')?.scrollIntoView({behavior:'smooth', block:'center'}); }
        else toast('结果未就绪，无法导出');
      }
      if (a==='retry'){ retry(); }
      if (a==='switch'){
        SE.state[currentScn] = makeState()[currentScn];
        location.hash = '#/';
        toast('已清空当前任务，请回首页重新上传主文件');
      }
    });
  });

  // history
  document.getElementById('hist-search')?.addEventListener('input', e=>{ histFilter.q = e.target.value; renderHistory(); });
  document.getElementById('hist-reset')?.addEventListener('click', ()=>{
    histFilter.scn.clear(); histFilter.status.clear(); histFilter.q=''; renderHistory();
  });

  // cmdk demo
  document.getElementById('cmdk-btn').addEventListener('click', ()=>toast('搜索 ⌘K 占位 · 后续接入'));

  // scenario picker modal
  const openBtn = document.getElementById('open-picker');
  if (openBtn) openBtn.addEventListener('click', openPicker);
  document.querySelectorAll('#picker [data-close]').forEach(el=>el.addEventListener('click', closePicker));
  document.querySelectorAll('#picker [data-close-and-go]').forEach(el=>el.addEventListener('click', closePicker));
  document.addEventListener('keydown', e=>{
    if (!document.getElementById('picker').classList.contains('show')) return;
    if (e.key === 'Escape') { closePicker(); return; }
    const items = Array.from(document.querySelectorAll('#picker-grid .pcard'));
    if (!items.length) return;
    let idx = items.findIndex(el=>el.classList.contains('is-active'));
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight'){ e.preventDefault(); idx = (idx+1+items.length)%items.length; setActive(items, idx); }
    if (e.key === 'ArrowUp'   || e.key === 'ArrowLeft' ){ e.preventDefault(); idx = (idx-1+items.length)%items.length; setActive(items, idx); }
    if (e.key === 'Enter' && idx>=0){ e.preventDefault(); items[idx].click(); }
    if (/^[1-4]$/.test(e.key)){ const i = parseInt(e.key,10)-1; if (items[i]) items[i].click(); }
  });

  // privacy radar
  const prad = document.getElementById('pradar');
  document.getElementById('pradar-toggle').addEventListener('click', e=>{
    e.stopPropagation();
    prad.classList.toggle('show');
  });
  document.addEventListener('click', e=>{
    if (!prad.contains(e.target)) prad.classList.remove('show');
  });

  // initial render
  navigate();
  startLiveDemo();
  if (window.lucide) lucide.createIcons();
});
