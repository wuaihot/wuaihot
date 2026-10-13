<template>
  <div class="worlds-primer">
     <div class="primer-draws"><section><h3>{{ copy.playIn }}</h3><p>FUR · MVK · C9 · KC</p><small>{{ copy.playInDate }}</small></section><section><h3>{{ copy.swiss }}</h3><p>{{ copy.swissRule }}</p><small>{{ copy.swissDate }}</small></section><section><h3>{{ copy.knockout }}</h3><p>{{ copy.knockoutRule }}</p><small>{{ copy.knockoutDate }}</small></section></div>
    <details><summary>{{ copy.pools }}</summary><div class="primer-pools"><section v-for="(pool,index) in WORLDS_2026_POOLS" :key="index"><strong>{{ copy.tier }} {{ index+1 }}</strong><span v-for="team in pool" :key="team">{{ team==='CBLOL1'?copy.cblol1:team==='Play-In winner'?copy.playInWinner:team }}</span></section></div><p>{{ copy.drawRule }}</p></details>
    <a :href="WORLDS_2026_PRIMER" target="_blank" rel="noopener noreferrer">{{ copy.source }} · 10/05 ↗</a>
  </div>
</template>
<script setup>
import{computed}from 'vue';import{WORLDS_2026_POOLS,WORLDS_2026_PRIMER}from '@/data/events/worlds-2026-primer.mjs';
 const props=defineProps({locale:{type:String,default:'zh-CN'}});
const copy=computed(()=>props.locale.startsWith('zh')?{playIn:'入围赛 · 4 队争 1 席',cblol2:'CBLOL 二号种子',playInDate:'10/10 已完成抽签',swiss:'瑞士轮 · 16 队争 8 席',swissRule:'3 胜晋级、3 负淘汰；五轮不重复对阵',swissDate:'10/18 入围赛结束后进行首轮抽签',knockout:'淘汰赛 · BO5',knockoutRule:'八强、半决赛与决赛；决赛单列如下',knockoutDate:'10/31 瑞士轮结束后抽签八强',pools:'查看首轮抽签分池与限制',tier:'分池',cblol1:'LOS · CBLOL 一号种子',playInWinner:'入围赛胜者',drawRule:'第一池对第四池，第二池对第三池；首轮避开同赛区。第二轮起允许同赛区，同战绩队伍随机配对。八强中两支3–0队伍分别抽取3–2对手，其余随机。',source:'官方观赛指南'}:{playIn:'Play-In · 4 teams, 1 berth',cblol2:'CBLOL No. 2',playInDate:'Draw completed Oct 10',swiss:'Swiss · 16 teams, 8 berths',swissRule:'Three wins advance; three losses eliminate; no rematches',swissDate:'Initial draw after Play-In, Oct 18',knockout:'Knockout · BO5',knockoutRule:'Quarterfinals, semifinals and final; final shown separately',knockoutDate:'Quarterfinal draw after Swiss, Oct 31',pools:'First-round draw tiers and restrictions',tier:'Tier',cblol1:'LOS · CBLOL No. 1',playInWinner:'Play-In winner',drawRule:'Tier 1 faces Tier 4; Tier 2 faces Tier 3. No same-region opponents in Round 1. Later rounds allow same-region teams and pair equal records. Two 3–0 teams draw 3–2 opponents in quarterfinals; remaining teams are randomly paired.',source:'Official Worlds primer'});
</script>
<style scoped>
.worlds-primer{--primer-muted:#6b727b;margin-bottom:18px;font-size:12px;line-height:1.6}
.primer-confirmed{padding:11px 13px;margin-bottom:14px;border:1px solid var(--event-border);border-radius:10px}
.primer-confirmed__heading{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:5px;margin-bottom:8px}
.primer-confirmed__heading strong{font-size:13px}
.primer-confirmed__heading span,.primer-confirmed p{color:var(--primer-muted);font-size:11px}
.primer-matchups{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
.primer-matchup{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:4px;padding:7px 9px;border:1px solid var(--event-border);border-radius:7px}
.primer-matchup strong{font-size:12px}
.primer-matchup strong span{font-weight:500;color:var(--primer-muted)}
.primer-matchup time{font-size:11px;color:var(--primer-muted)}
.primer-confirmed p{margin:8px 0 0}
.primer-confirmed a{color:var(--n-primary-color);text-decoration:none}
.primer-confirmed a:hover{text-decoration:underline}
@media(max-width:700px){.primer-matchups{grid-template-columns:1fr}}:global(.event-hub.is-dark .worlds-primer){--primer-muted:#a0a5ad}.primer-draws{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-bottom:12px}.primer-draws section{border-left:2px solid color-mix(in srgb,var(--n-primary-color) 40%,transparent);padding-left:10px}.primer-draws h3{font-size:13px;margin:0 0 4px}.primer-draws p{margin:0}.primer-draws small,.worlds-primer>a{color:var(--primer-muted);font-size:11px}.worlds-primer details{border:1px solid var(--event-border);border-radius:6px;padding:9px 12px;margin-bottom:8px}.worlds-primer summary{cursor:pointer;color:var(--n-primary-color)}.worlds-primer summary:focus-visible{outline:2px solid var(--n-primary-color)}.primer-pools{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;padding-top:12px}.primer-pools section{display:flex;flex-direction:column;gap:3px}.primer-pools strong{color:var(--primer-muted);font-size:11px}.worlds-primer details p{color:var(--n-text-color-2);margin-bottom:0}.worlds-primer>a{text-decoration:none}@media(max-width:700px){.primer-draws{grid-template-columns:1fr;gap:9px}.primer-pools{grid-template-columns:repeat(2,minmax(0,1fr))}.worlds-primer summary{min-height:26px}}
</style>
