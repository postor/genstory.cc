import type { VNProject } from "./types";

/**
 * 小红帽 — 视觉小说模板种子。
 * 内容改编自经典格林童话，演示章节 / 场景 / 分支 / 资产 的结构。
 */
export function seedRedRidingHood(): VNProject {
  return {
    title: "小红帽",
    assets: [
      { id: "bg_home", type: "Background", name: "小红帽的家", file: "backgrounds/bg_home.png" },
      { id: "bg_forest", type: "Background", name: "森林", file: "backgrounds/bg_forest.png" },
      { id: "bg_grandma", type: "Background", name: "外婆家", file: "backgrounds/bg_grandma.png" },
      { id: "fig_red_normal", type: "Character", name: "小红帽·常态", file: "characters/red_normal.png" },
      { id: "fig_red_curious", type: "Character", name: "小红帽·疑惑", file: "characters/red_curious.png" },
      { id: "fig_red_sad", type: "Character", name: "小红帽·担忧", file: "characters/red_sad.png" },
      { id: "fig_wolf_sly", type: "Character", name: "大灰狼·狡猾", file: "characters/wolf_sly.png" },
      { id: "fig_wolf_proud", type: "Character", name: "大灰狼·得意", file: "characters/wolf_proud.png" },
      { id: "fig_wolf_fierce", type: "Character", name: "大灰狼·凶狠", file: "characters/wolf_fierce.png" },
      { id: "fig_grandma_weak", type: "Character", name: "外婆·虚弱", file: "characters/grandma_weak.png" },
      { id: "fig_woodcutter_brave", type: "Character", name: "猎人·英勇", file: "characters/woodcutter_brave.png" },
    ],
    chapters: [
      {
        id: "chapter-001",
        title: "第一章 · 森林与狼",
        scenes: [
          {
            id: "scene-001",
            title: "森林奇遇",
            background: "bg_forest",
            characters: [
              { id: "fig_red_normal", position: "left", expression: "开心" },
              { id: "fig_wolf_sly", position: "right", expression: "狡猾" },
            ],
            script: `# 旁白
: 从前，有个可爱的小女孩，因为总戴着一顶红帽子，大家都叫她小红帽。
: 一天，妈妈让她带上点心，穿过森林去看望生病的外婆。

# 小红帽
小红帽: 终于可以出门啦，我要穿过森林去看外婆！

# 大灰狼
大灰狼: 小姑娘，你要去哪儿呀？
小红帽: 我要去外婆家。

# 大灰狼
大灰狼: 你看，那边开满了鲜花。不如先去采些花，外婆会更开心哦。

>> 听狼的话去采花:scene-002 | 直接去外婆家:scene-003`,
          },
          {
            id: "scene-002",
            title: "狼的诡计",
            background: "bg_grandma",
            characters: [
              { id: "fig_wolf_proud", position: "left", expression: "得意" },
              { id: "fig_grandma_weak", position: "right", expression: "虚弱" },
            ],
            script: `# 旁白
: 小红帽听了狼的话，去林中采花。
: 大灰狼却抢先一步，跑向外婆家。

# 大灰狼
大灰狼: 外婆，我给您送好吃的来啦！

# 旁白
: 狼一口吞下了外婆，穿上她的衣服，躺在床上等小红帽。

changeScene:scene-003.txt;`,
          },
          {
            id: "scene-003",
            title: "猎人来解救",
            background: "bg_grandma",
            characters: [
              { id: "fig_red_curious", position: "left", expression: "疑惑" },
              { id: "fig_wolf_fierce", position: "center", expression: "凶狠" },
              { id: "fig_woodcutter_brave", position: "right", expression: "英勇" },
            ],
            script: `# 旁白
: 小红帽来到外婆床前。

# 小红帽
小红帽: 外婆，您的耳朵怎么这么大？
大灰狼: 为了更好地听你说话呀。
小红帽: 您的牙齿怎么这么大？
大灰狼: 为了一口吃掉你！

# 旁白
: 就在危急时刻，猎人冲了进来！

# 猎人
猎人: 坏蛋，放开她！

# 旁白
: 猎人打跑了大灰狼，救出了外婆和小红帽。从此，他们过上了平安的日子。

end;`,
          },
        ],
      },
    ],
  };
}
