import type { ComicProject } from "./types";

/**
 * 小红帽 — 漫画模板种子。
 * 内容改编自经典格林童话，演示章节 / 页面 / 分镜 / 资产 的结构。
 * 三页成品图由 Atlas（GPT Image 2，768x1024）生成，存于
 * public/project-templates/comic/assets/pages/。
 */
export function seedComicRedRidingHood(): ComicProject {
  return {
    title: "小红帽",
    style: "现代扁平绘本插画，柔和高饱和暖色，细描边，无文字",
    backgrounds: [
      { id: "bg_home", type: "Background", name: "小红帽的家", file: "bg_home.png" },
      { id: "bg_forest", type: "Background", name: "森林小径", file: "bg_forest.png" },
      { id: "bg_grandma", type: "Background", name: "外婆卧室", file: "bg_grandma.png" },
      { id: "bg_meadow", type: "Background", name: "野花草地", file: "bg_meadow.png" },
    ],
    characters: [
      { id: "fig_red_normal", type: "Character", name: "小红帽·常态", file: "red_normal.png" },
      { id: "fig_red_curious", type: "Character", name: "小红帽·疑惑", file: "red_curious.png" },
      { id: "fig_mother", type: "Character", name: "妈妈", file: "mother.png" },
      { id: "fig_wolf_sly", type: "Character", name: "大灰狼·狡猾", file: "wolf_sly.png" },
      { id: "fig_wolf_fierce", type: "Character", name: "大灰狼·凶狠", file: "wolf_fierce.png" },
      { id: "fig_grandma", type: "Character", name: "外婆", file: "grandma.png" },
      { id: "fig_woodcutter", type: "Character", name: "猎人·英勇", file: "woodcutter.png" },
    ],
    pages: [
      {
        id: "page-001",
        title: "第一页 · 出发",
        assetId: "cg_page_001",
        summary: "妈妈让小红帽带上点心穿过森林去看望生病的外婆，她在林边遇见窥视的大灰狼。",
        panels: [
          {
            id: "panel-1",
            size: "wide",
            asset: "bg_home",
            characters: ["fig_red_normal", "fig_mother"],
            description:
              "暖色调的 cottage 门前，妈妈弯腰把一篮点心递给戴着红帽的小红帽；木门半开，屋内可见壁炉微光。",
            caption: "从前有个小女孩，总戴着一顶红帽子，大家都叫她小红帽。",
            balloons: [
              { speaker: "妈妈", line: "外婆病了，把这篮点心送去，别在林里贪玩。" },
              { speaker: "小红帽", line: "放心吧妈妈，我马上就回来！" },
            ],
          },
          {
            id: "panel-2",
            size: "tall",
            asset: "bg_forest",
            characters: ["fig_red_normal"],
            description:
              "阳光透过树叶洒在森林小径上，小红帽蹦跳着前行，篮子上系着格子布，红帽在绿意中格外醒目。",
            caption: "小红帽蹦蹦跳跳地走进了森林。",
          },
          {
            id: "panel-3",
            size: "small",
            asset: "bg_forest",
            characters: ["fig_wolf_sly"],
            description:
              "树影后探出灰狼的脑袋，半眯着眼打量小红帽，嘴角带着算计的笑，尾巴轻轻摆动。",
            caption: "可一只大灰狼，早就盯上了她。",
          },
        ],
      },
      {
        id: "page-002",
        title: "第二页 · 林中相遇",
        assetId: "cg_page_002",
        summary: "狼假装友善地搭话，怂恿小红帽去采野花，自己却抢先奔向外婆家。",
        panels: [
          {
            id: "panel-1",
            size: "wide",
            asset: "bg_forest",
            characters: ["fig_red_normal", "fig_wolf_sly"],
            description:
              "小径上狼挡住去路，龇牙装出和善模样与小红帽攀谈；小红帽抱着篮子一脸天真。",
            balloons: [
              { speaker: "大灰狼", line: "小姑娘，你要去哪儿呀？" },
              { speaker: "小红帽", line: "我要去外婆家，给她送点心。" },
            ],
          },
          {
            id: "panel-2",
            size: "tall",
            asset: "bg_meadow",
            characters: ["fig_wolf_sly"],
            description:
              "狼伸长爪子指向一侧开满彩色野花的草地，眼神飘向远方，盘算着甩开她。",
            balloons: [
              { speaker: "大灰狼", line: "看，那边野花多美，采一些外婆更高兴哦。" },
            ],
          },
          {
            id: "panel-3",
            size: "small",
            asset: "bg_meadow",
            characters: ["fig_red_normal", "fig_wolf_sly"],
            description:
              "小红帽蹲在花丛中低头采花；远处狼缩着身子溜走，朝外婆的小屋方向飞奔。",
            caption: "小红帽去采花，狼却抢先一步跑向外婆家。",
          },
        ],
      },
      {
        id: "page-003",
        title: "第三页 · 解救",
        assetId: "cg_page_003",
        summary: "狼吞下外婆躺在床上，被小红帽识破，危急时刻猎人冲入，救出两人。",
        panels: [
          {
            id: "panel-1",
            size: "wide",
            asset: "bg_grandma",
            characters: ["fig_red_curious", "fig_wolf_fierce"],
            description:
              "外婆床前，狼戴着睡帽躺在床上，露出夸张的大耳朵与尖牙；小红帽睁大眼睛凑近打量。",
            balloons: [
              { speaker: "小红帽", line: "外婆，您的耳朵怎么这么大？" },
              { speaker: "大灰狼", line: "为了更好地听你说话呀！" },
              { speaker: "小红帽", line: "那……牙齿怎么也这么大？" },
              { speaker: "大灰狼", line: "为了一口吃掉你！" },
            ],
          },
          {
            id: "panel-2",
            size: "tall",
            characters: ["fig_wolf_fierce", "fig_woodcutter"],
            description:
              "狼猛地掀被扑起，獠牙大张；房门被撞开，手持斧头的猎人冲进屋内，气势凛然。",
            caption: "就在危急时刻，猎人冲了进来！",
            balloons: [{ speaker: "猎人", line: "坏蛋，放开她！" }],
          },
          {
            id: "panel-3",
            size: "small",
            asset: "bg_grandma",
            characters: ["fig_woodcutter", "fig_grandma", "fig_red_normal"],
            description:
              "温情收尾：猎人、被救出的外婆与小红帽围坐床边，阳光满屋，三人安然微笑。",
            caption: "猎人打跑了大灰狼，救出了外婆和小红帽，从此平安度日。",
          },
        ],
      },
    ],
  };
}
