import type { PublicLang, PublicPageSlug } from "@/lib/seo";

export type AiPromptExample = {
  useCase: Record<PublicLang, string>;
  outcome: Record<PublicLang, string>;
  prompt: Record<PublicLang, string>;
};

export const aiPromptChrome = {
  zh: {
    title: "AI prompt 示例",
    intro:
      "这些示例展示 AI 助手适合参与的环节：先读取项目上下文和 AGENTS.md 约束，再给出可确认、可修改的草稿、结构或资产提示词。AI 辅助是可选能力，项目文件仍默认保存在本地浏览器中。",
    useCase: "需求",
    outcome: "适合产出",
  },
  en: {
    title: "AI prompt examples",
    intro:
      "These examples show where the optional AI assistant fits: read the project context and AGENTS.md constraints first, then propose drafts, structure, or asset prompts that you can review and edit. Project files still stay local in this browser by default.",
    useCase: "Need",
    outcome: "Good for",
  },
} satisfies Record<
  PublicLang,
  { title: string; intro: string; useCase: string; outcome: string }
>;

export const publicPagePromptExamples: Record<
  PublicPageSlug,
  AiPromptExample[]
> = {
  book: [
    {
      useCase: {
        zh: "从一句设定扩展成长篇大纲",
        en: "Turn a one-line premise into a long-form outline",
      },
      outcome: {
        zh: "章节结构、主线冲突、角色弧光和伏笔清单",
        en: "Chapter structure, central conflict, character arcs, and foreshadowing notes",
      },
      prompt: {
        zh: "请读取当前图书项目的 meta.md、章节和页面内容，在不改写已确立事实的前提下，把“一名失眠的档案管理员发现城市记忆被定期重写”扩展成 12 章小说大纲。每章给出目标、冲突、关键场景和需要回收的伏笔。",
        en: "Read the current book project's meta.md, chapters, and pages. Without changing established facts, expand this premise into a 12-chapter novel outline: an insomniac archivist discovers the city's memories are rewritten on a schedule. For each chapter, include the goal, conflict, key scene, and foreshadowing to pay off later.",
      },
    },
    {
      useCase: {
        zh: "续写章节但保持风格一致",
        en: "Continue a chapter while keeping the voice consistent",
      },
      outcome: {
        zh: "可编辑续写草稿、语气说明和需要人工确认的设定点",
        en: "Editable continuation draft, voice notes, and facts that need human review",
      },
      prompt: {
        zh: "请参考当前章节前 3 页的语气、叙述视角和节奏，续写下一页。不要新增世界观硬设定；如果必须引入新事实，请先列为“待确认设定”。输出正文后，再列出你延续了哪些风格特征。",
        en: "Use the tone, point of view, and pacing from the first three pages of this chapter to draft the next page. Do not add hard worldbuilding facts; if a new fact is necessary, list it under 'facts to confirm' first. After the draft, summarize the style cues you preserved.",
      },
    },
    {
      useCase: {
        zh: "给文章或章节生成插图 prompt",
        en: "Create illustration prompts for an article or chapter",
      },
      outcome: {
        zh: "插图构图、画面情绪、资产逻辑 ID 和可复制提示词",
        en: "Illustration composition, mood, asset logical IDs, and copy-ready prompts",
      },
      prompt: {
        zh: "请读取当前文章或章节内容，挑选 3 个最适合配插图的段落。每个段落输出一条插图生成 prompt：说明画面主体、构图、光线、情绪、时代/地点细节、画风、镜头距离、不要出现的文字和商标，并给出建议登记到 assets/index.yml 的逻辑 ID。不要替我改正文。",
        en: "Read the current article or chapter and choose the three passages that would benefit most from illustrations. For each passage, write an illustration prompt with subject, composition, lighting, mood, period or location details, art style, camera distance, text and logo exclusions, plus the logical asset ID to register in assets/index.yml. Do not edit the prose.",
      },
    },
    {
      useCase: {
        zh: "整理角色设定一致性",
        en: "Check character continuity",
      },
      outcome: {
        zh: "角色档案、矛盾点、待确认事实和最小修订建议",
        en: "Character notes, contradictions, facts to confirm, and minimal revision suggestions",
      },
      prompt: {
        zh: "请读取当前图书项目中所有出现主角的章节和页面，整理一份角色状态表：目标、恐惧、已知秘密、关系变化和口头禅。请标出前后不一致的地方，并给出最小修订建议，不要直接覆盖正文。",
        en: "Read every chapter and page where the protagonist appears. Build a character-state table covering goals, fears, known secrets, relationship changes, and repeated phrases. Mark inconsistencies and suggest the smallest revisions instead of overwriting the prose.",
      },
    },
  ],
  comic: [
    {
      useCase: {
        zh: "把剧情段落拆成漫画分镜",
        en: "Break a story beat into comic panels",
      },
      outcome: {
        zh: "页面节奏、分镜描述、角色位置和视觉资产提示词",
        en: "Page pacing, panel descriptions, character placement, and visual asset prompts",
      },
      prompt: {
        zh: "请根据当前漫画项目的角色和设定，把这段剧情拆成 2 页、每页 4 格的分镜。每格写清镜头距离、角色位置、表情、对白摘要和需要登记到 assets/index.yml 的视觉资产逻辑 ID。不要生成成品图。",
        en: "Using the current comic project's characters and canon, break this beat into two pages with four panels each. For every panel, specify camera distance, character placement, expression, dialogue summary, and the visual asset logical IDs that should be registered in assets/index.yml. Do not generate finished artwork.",
      },
    },
    {
      useCase: {
        zh: "生成角色和场景图像 prompt",
        en: "Draft character and scene image prompts",
      },
      outcome: {
        zh: "统一画风的图片提示词、负面约束和资产命名建议",
        en: "Consistent image prompts, negative constraints, and asset naming suggestions",
      },
      prompt: {
        zh: "请读取漫画项目的角色和页面计划，为主角立绘、街角背景和关键道具各写 1 条图像生成 prompt。保持同一画风，避免文字、商标和多余角色，并给出建议的资产逻辑 ID。",
        en: "Read the comic project's characters and page plan. Write one image-generation prompt each for the protagonist portrait, street-corner background, and key prop. Keep a consistent visual style, avoid text, logos, and extra characters, and suggest logical asset IDs.",
      },
    },
    {
      useCase: {
        zh: "规划角色设定图 prompt",
        en: "Plan a character reference sheet prompt",
      },
      outcome: {
        zh: "1024x768 角色设定图需求、多角度、表情和服装细节",
        en: "1024x768 character sheet brief with views, expressions, and costume details",
      },
      prompt: {
        zh: "请为 GPT Image 2 写一条角色形象设计图 prompt：16 岁女性，外向但容易逞强，近未来校园冒险主角。画布 1024x768，角色设定图布局，包含正面、侧面、背面和 3/4 视角，全身比例一致；再包含 6 个头像表情（开心、犹豫、愤怒、害怕、坚定、装作没事）。写清发型、眼睛、校服改造、鞋子、背包、徽章和配色；要求无背景或浅色网格背景，不出现水印、品牌 logo 和多余人物。最后给出资产逻辑 ID 建议。",
        en: "Write a GPT Image 2 prompt for a character reference sheet: a 16-year-old female, outgoing but prone to pretending she is fine, the protagonist of a near-future school adventure. Use a 1024x768 canvas with a character sheet layout, including front, side, back, and 3/4 full-body views with consistent proportions; add six headshot expressions: happy, hesitant, angry, afraid, determined, and pretending to be okay. Specify hairstyle, eyes, modified school uniform, shoes, backpack, badge, and color palette. Use no background or a pale grid background, with no watermark, brand logos, or extra people. Suggest logical asset IDs at the end.",
      },
    },
    {
      useCase: {
        zh: "检查页面节奏和阅读顺序",
        en: "Review page pacing and reading order",
      },
      outcome: {
        zh: "分镜节奏问题、对白拥挤点和页面调整建议",
        en: "Panel pacing issues, crowded dialogue spots, and page adjustment suggestions",
      },
      prompt: {
        zh: "请检查当前漫画页面计划是否容易阅读。重点看每页信息量、分镜顺序、对白长度和情绪转折。请先列出问题，再给出不改变角色设定和核心剧情的调整建议。",
        en: "Review whether the current comic page plan reads clearly. Focus on information density, panel order, dialogue length, and emotional turns. List issues first, then suggest adjustments that keep character canon and the core plot intact.",
      },
    },
  ],
  "visual-novel": [
    {
      useCase: {
        zh: "生成带选择项的视觉小说场景",
        en: "Draft a visual novel scene with choices",
      },
      outcome: {
        zh: "对白草稿、分支选择、舞台状态增量和资产逻辑 ID",
        en: "Dialogue draft, branch choices, stage-state updates, and asset logical IDs",
      },
      prompt: {
        zh: "请读取当前视觉小说的 AGENTS.md、script.md 和 stage.yml，续写一个 5 分钟场景：主角在雨夜车站遇到失踪同伴。输出 Markdown 对白、2 个选择项、每个选择的后续影响，并列出 stage.yml 需要增量更新的 background、characters、expression、music 和 SFX 逻辑 ID。",
        en: "Read the current visual novel's AGENTS.md, script.md, and stage.yml. Draft a five-minute scene where the protagonist meets a missing companion at a rainy station. Output Markdown dialogue, two choices, the consequence of each choice, and the incremental stage.yml updates for background, characters, expression, music, and SFX logical IDs.",
      },
    },
    {
      useCase: {
        zh: "检查剧情分支和角色状态",
        en: "Review branches and character state",
      },
      outcome: {
        zh: "矛盾点、缺失舞台状态、可补充对白和修订建议",
        en: "Continuity issues, missing stage state, dialogue gaps, and revision suggestions",
      },
      prompt: {
        zh: "请检查本场景的分支、角色表情和舞台状态是否一致。不要直接重写全文；先列出可能矛盾、缺失资产逻辑 ID、选择项后果不清楚的位置，再给出最小修改建议。",
        en: "Check whether this scene's branches, character expressions, and stage state are consistent. Do not rewrite the whole scene. First list possible contradictions, missing asset logical IDs, and unclear choice consequences, then propose the smallest useful edits.",
      },
    },
    {
      useCase: {
        zh: "规划视觉小说资产 prompt",
        en: "Plan visual novel asset prompts",
      },
      outcome: {
        zh: "背景、立绘、表情、BGM 和 SFX 的逻辑 ID 与提示词",
        en: "Logical IDs and prompts for backgrounds, sprites, expressions, BGM, and SFX",
      },
      prompt: {
        zh: "请根据当前视觉小说场景，列出需要新增到 assets/index.yml 的资产计划。至少包含雨夜车站背景、同伴立绘、紧张表情、环境雨声和低频悬疑 BGM。每项给出逻辑 ID、用途、生成 prompt 和接入的场景位置。",
        en: "Based on the current visual novel scene, list the asset plan to add to assets/index.yml. Include at least a rainy station background, companion sprite, tense expression, ambient rain SFX, and low suspense BGM. For each item, provide a logical ID, purpose, generation prompt, and where it appears in the scene.",
      },
    },
    {
      useCase: {
        zh: "制作角色立绘设定图 prompt",
        en: "Create a character sprite reference prompt",
      },
      outcome: {
        zh: "适合立绘制作的角色设定图、表情表和服装细节",
        en: "Sprite-ready character sheet, expression chart, and costume details",
      },
      prompt: {
        zh: "请根据当前视觉小说的角色档案，为 GPT Image 2 写一条角色设定图 prompt：22 岁男性，沉默、谨慎、擅长修理旧机器，是主角的临时同伴。画布 1024x768，包含正面、侧面、背面、半身立绘和 6 个表情头像；服装要写清外套层次、工具包、手套磨损、发型和主色/辅色。要求角色设计可拆成 tachie、expression 和 prop 资产，输出后再列出要登记到 assets/index.yml 的逻辑 ID，不写具体文件路径。",
        en: "Using the current visual novel character files, write a GPT Image 2 prompt for a new character reference sheet: a 22-year-old male, quiet, cautious, good at repairing old machines, and a temporary companion to the protagonist. Use a 1024x768 canvas with front, side, back, half-body sprite, and six expression headshots. Specify jacket layers, tool pouch, worn gloves, hairstyle, and primary and accent colors. Make the design separable into tachie, expression, and prop assets, then list logical IDs to register in assets/index.yml without writing file paths.",
      },
    },
  ],
  "interactive-video": [
    {
      useCase: {
        zh: "设计互动视频选择点",
        en: "Design choice points for an interactive video",
      },
      outcome: {
        zh: "片段目标、选择文案、后续片段和拍摄/配音需求",
        en: "Segment goals, choice labels, next segments, and filming or voice needs",
      },
      prompt: {
        zh: "请根据当前互动视频项目的片段和时间线，设计 3 个选择点。每个选择点写清出现时间、观众看到的选项文案、跳转到的后续片段、需要补拍的镜头和需要录制的配音。不要假设已经有完整剪辑功能。",
        en: "Using the current interactive video project's segments and timeline, design three choice points. For each one, specify when it appears, the option labels viewers see, the next segment to open, shots that need filming, and voice lines that need recording. Do not assume a full video editor is available.",
      },
    },
    {
      useCase: {
        zh: "把短片构想整理成拍摄清单",
        en: "Turn a short-film idea into a production list",
      },
      outcome: {
        zh: "镜头表、音频资产、分支关系和待确认风险",
        en: "Shot list, audio assets, branch map, and risks to confirm",
      },
      prompt: {
        zh: "请把“观众通过选择不同手机消息改变结局”的互动短片构想整理成项目计划。输出片段列表、镜头清单、音频/配音资产逻辑 ID、选择点关系，以及拍摄前必须确认的问题。",
        en: "Turn this idea into an interactive video project plan: viewers change the ending by choosing different phone messages. Output the segment list, shot list, audio and voice asset logical IDs, choice-point relationships, and questions that must be answered before filming.",
      },
    },
    {
      useCase: {
        zh: "为拍摄前视觉参考生成 prompt",
        en: "Create pre-production visual reference prompts",
      },
      outcome: {
        zh: "角色造型、关键道具、场景气氛和镜头参考图 prompt",
        en: "Prompts for styling, props, mood frames, and shot references",
      },
      prompt: {
        zh: "请读取互动视频项目的片段、角色和时间线，为拍摄前参考图写 4 条图像 prompt：主角造型、关键手机道具、夜间走廊气氛和结局分歧的镜头参考。每条说明画面用途、构图、光线、服装/道具细节、禁止出现的文字或 logo，并给出 assets/index.yml 逻辑 ID。不要把这些参考图当作已经拍摄好的视频素材。",
        en: "Read the interactive video project's segments, characters, and timeline. Write four image prompts for pre-production references: protagonist styling, key phone prop, night hallway mood, and a branching-ending shot reference. For each one, state its use, composition, lighting, costume or prop details, text and logo exclusions, and assets/index.yml logical ID. Do not treat these references as filmed video assets.",
      },
    },
    {
      useCase: {
        zh: "检查分支风险和制作缺口",
        en: "Review branch risks and production gaps",
      },
      outcome: {
        zh: "未闭合分支、缺失镜头、音频缺口和拍摄前确认清单",
        en: "Open branches, missing shots, audio gaps, and a pre-production checklist",
      },
      prompt: {
        zh: "请检查当前互动视频的片段、时间线和选择点是否闭合。列出没有后续片段的选择、缺失的视频/音频资产、配音前需要确认的台词，以及拍摄前最应该先解决的 5 个风险。",
        en: "Check whether the current interactive video's segments, timeline, and choices are complete. List choices without follow-up segments, missing video or audio assets, lines to confirm before voice recording, and the five production risks to resolve first.",
      },
    },
  ],
  "phaser-game": [
    {
      useCase: {
        zh: "生成 Phaser 玩法循环草稿",
        en: "Draft a Phaser gameplay loop",
      },
      outcome: {
        zh: "场景职责、输入规则、胜负条件和可编辑代码片段",
        en: "Scene responsibilities, input rules, win and fail states, and editable code snippets",
      },
      prompt: {
        zh: "请读取当前 Phaser 项目的 src/main.js、菜单场景和测试场景，设计一个 60 秒可试玩玩法循环：玩家躲避巡逻光束并收集 5 个记忆碎片。输出场景职责、键盘输入、胜利/失败条件，以及应该新增或修改的 JavaScript 片段。不要假设外部图片和音频已经存在。",
        en: "Read the current Phaser project's src/main.js, menu scene, and test scene. Design a 60-second playable loop where the player dodges patrol beams and collects five memory shards. Output scene responsibilities, keyboard input, win and fail conditions, and the JavaScript snippets to add or edit. Do not assume external images or audio already exist.",
      },
    },
    {
      useCase: {
        zh: "规划游戏资产 prompt",
        en: "Plan game asset prompts",
      },
      outcome: {
        zh: "图片、音乐、音效提示词和 assets/index.yml 逻辑 ID",
        en: "Image, music, sound-effect prompts, and assets/index.yml logical IDs",
      },
      prompt: {
        zh: "请为这个 Phaser 游戏生成资产计划：菜单背景、玩家精灵、收集物、失败音效和背景音乐各 1 条 prompt。每条都给出逻辑 ID、用途、风格约束和接入哪个场景。先更新 assets/index.yml 计划，不要直接写入不存在的媒体文件路径。",
        en: "Create an asset plan for this Phaser game: one prompt each for the menu background, player sprite, collectible, fail sound, and background music. For each item, provide a logical ID, purpose, style constraints, and the scene where it will be used. Update the assets/index.yml plan first; do not write paths for media files that do not exist yet.",
      },
    },
    {
      useCase: {
        zh: "设计可用于游戏精灵的角色设定图",
        en: "Design a sprite-ready character sheet",
      },
      outcome: {
        zh: "角色外观、动作参考、表情和游戏资产拆分建议",
        en: "Character design, action references, expressions, and game asset breakdown",
      },
      prompt: {
        zh: "请把这个游戏角色需求整理成 GPT Image 2 的 1024x768 角色设定图 prompt：12 岁中性少年，敏捷、好奇、怕黑但会保护同伴，2D 平台跳跃游戏主角。画面包含正面、侧面、背面、奔跑姿势、跳跃姿势和 4 个表情头像；写清发型、护目镜、短斗篷、鞋底、随身灯具和颜色方案。要求风格适合转成 Phaser sprite sheet，背景简洁，不出现文字、水印、logo 或多余角色。最后列出 player_idle、player_run、player_jump、player_expressions 等资产逻辑 ID。",
        en: "Turn this game character brief into a GPT Image 2 prompt for a 1024x768 character reference sheet: a 12-year-old androgynous kid, agile, curious, afraid of the dark but protective of friends, and the protagonist of a 2D platformer. Include front, side, back, running pose, jumping pose, and four expression headshots. Specify hairstyle, goggles, short cape, shoe soles, handheld lamp, and color palette. Keep the style suitable for conversion into a Phaser sprite sheet, with a simple background and no text, watermark, logos, or extra characters. End with asset logical IDs such as player_idle, player_run, player_jump, and player_expressions.",
      },
    },
    {
      useCase: {
        zh: "调整关卡难度和反馈",
        en: "Tune level difficulty and feedback",
      },
      outcome: {
        zh: "参数建议、玩家反馈点、测试清单和小步代码修改",
        en: "Parameter suggestions, player feedback points, test checklist, and small code edits",
      },
      prompt: {
        zh: "请查看当前 Phaser 测试场景，给出让新手 60 秒内理解玩法的调参建议。请覆盖移动速度、敌人刷新、收集物数量、失败反馈和胜利提示，并给出小步 JavaScript 修改建议，避免一次性重写整个场景。",
        en: "Review the current Phaser test scene and suggest tuning so a new player can understand the loop within 60 seconds. Cover movement speed, enemy spawning, collectible count, fail feedback, and win messaging, then propose small JavaScript edits instead of rewriting the whole scene.",
      },
    },
  ],
};
