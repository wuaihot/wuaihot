<template>
<section class="worlds-guide">
 <div class="wg-intro">
  <div class="wg-equation" :aria-label="c.equation">
   <span><strong>19</strong><small>{{ c.qualified }}</small></span><b>→</b>
   <span><strong>4 → 1</strong><small>{{ c.play }}</small></span><b>→</b>
   <span><strong>16 → 8</strong><small>{{ c.swiss }}</small></span><b>→</b>
   <span><strong>8 → 1</strong><small>{{ c.knockout }}</small></span>
  </div>
 </div>
 <div class="wg-guide-cards">
  <article><strong>{{ c.play }}</strong><p>{{ c.playText }}</p></article>
  <article><strong>{{ c.swiss }}</strong><p>{{ c.swissText }}</p></article>
  <article><strong>{{ c.knockout }}</strong><p>{{ c.knockoutText }}</p></article>
 </div>
 <div class="wg-head"><h3>{{ c.teams }}</h3><span>{{ teams.length }} {{ c.teamsUnit }}</span></div>

 <div class="wg-regions">
  <section v-for="group in groups" :key="group.key" class="wg-region">
   <header><strong>{{ group.key }}</strong><span>{{ group.entries.length }}</span></header>
   <div class="wg-members">
    <article v-for="team in group.entries" :key="team.id||team.code" class="wg-team">
     <img v-if="team.image" :src="team.image" :alt="team.code" width="26" height="26" loading="lazy"/>
     <strong>{{ team.code||team.name }}</strong>
     <span>{{ seed(team) }}</span>
     <small :class="{ 'is-playin': playInTeams.has(team.code) }">{{ playInTeams.has(team.code)?c.playinStatus:c.swissStatus }}</small>
    </article>
   </div>
  </section>
 </div>
 <div class="wg-head"><h3>{{ c.ruleTitle }}</h3></div>
 <Worlds2026Primer :locale="locale"/>
 <div class="wg-head"><h3>{{ c.stagesTitle }}</h3></div>
 <div class="wg-stages">
  <div v-for="(stage,index) in stages" :key="stage.key">
   <b>{{ String(index+1).padStart(2,'0') }} · {{ localStage(stage.key) }}</b>
   <time>{{ localizedStageDate(stage) }}</time>
   <small>{{ localizedStageVenue(stage) }}</small>
  </div>
 </div>
</section>
</template>
<script setup>
import {computed} from 'vue';
import Worlds2026Primer from './Worlds2026Primer.vue';
const props=defineProps({locale:{type:String,default:'zh-CN'},teams:{type:Array,default:()=>[]},stages:{type:Array,default:()=>[]},stageDateLabels:{type:Object,default:()=>({})},stageVenueLabels:{type:Object,default:()=>({})}});
const i18n={
 'zh-CN':{title:'2026 世界赛观赛指南',intro:'先看比赛怎么晋级，再看参赛阵容、场馆和官方规则。',equation:'19 支获得参赛资格，4 支参加入围赛争夺 1 个瑞士轮席位，16 支打瑞士轮产生八强，最终单败决出冠军。',qualified:'参赛队伍',play:'入围赛',swiss:'瑞士轮',knockout:'淘汰赛',playText:'四队进行 BO5 双败淘汰：首败转入败者组，第二败出局；最终一队晋级瑞士轮。',swissText:'共 16 队，最多五轮，同战绩交手；先取得 3 胜进八强，累计 3 负出局。',knockoutText:'八强 → 四强 → 决赛；BO5 单败淘汰，最终决出世界冠军。',teams:'参赛队伍与赛区种子',teamsUnit:'支',playinStatus:'待争夺瑞士轮席位',swissStatus:'已获瑞士轮席位',seedUnknown:'种子顺位待公布',ruleTitle:'详细赛制与抽签规则',stagesTitle:'阶段、时间与场馆',lplOriginal:'LPL 中文赛事官网',globalOriginal:'LoL Esports 全球赛事',rulesOriginal:'官方赛事规则'},
 'zh-TW':{title:'2026 世界賽觀賽指南',intro:'了解賽制、隊伍、場館與官方規則。',equation:'19隊參賽，4隊入圍賽爭奪1席，瑞士輪16隊產生8強，最終決出冠軍。',qualified:'參賽隊伍',play:'入圍賽',swiss:'瑞士輪',knockout:'淘汰賽',playText:'四隊BO5雙敗，輸兩場淘汰，僅一隊進入瑞士輪。',swissText:'16隊最多5輪，3勝晉級，3敗淘汰。',knockoutText:'八強、四強、決賽單敗淘汰。',teams:'參賽隊伍與種子',teamsUnit:'隊',playinStatus:'爭奪瑞士輪資格',swissStatus:'瑞士輪資格已定',seedUnknown:'種子順位待公布',ruleTitle:'賽制及抽籤規則',stagesTitle:'賽事階段與場館',lplOriginal:'LPL 中文官網',globalOriginal:'LoL Esports 全球官網',rulesOriginal:'官方賽事規則'},
 en:{title:'Worlds 2026 viewing guide',intro:'Competition format, teams, venues and verified official sources.',equation:'19 qualified, four play in for one Swiss spot, 16 Swiss entrants, eight knockout teams and one champion.',qualified:'qualified teams',play:'Play-In',swiss:'Swiss',knockout:'Knockout',playText:'Four teams play double-elimination Bo5s. A second loss eliminates a team; one earns the final Swiss spot.',swissText:'Sixteen teams, at most five rounds: three wins advance, three losses eliminate.',knockoutText:'Eight teams play single-elimination Bo5s through the final.',teams:'Teams and regional seeds',teamsUnit:'teams',playinStatus:'Competing for Swiss berth',swissStatus:'Swiss berth confirmed',seedUnknown:'Seed pending',ruleTitle:'Format and draw rules',stagesTitle:'Schedule and venues',lplOriginal:'LPL official news',globalOriginal:'LoL Esports global',rulesOriginal:'Official rules library'},
 ja:{title:'Worlds 2026 観戦ガイド',intro:'大会方式・チーム・会場を一目で確認。',equation:'19チーム参加、4チームが1枠を争う、スイス16、決勝トーナメント8。',qualified:'出場チーム',play:'プレイイン',swiss:'スイス',knockout:'ノックアウト',playText:'4チームによるBO5ダブルエリミネーション。敗北2回で敗退、勝者1チームがスイスへ。',swissText:'16チームで最大5ラウンド。3勝で進出、3敗で敗退。',knockoutText:'8チームのBO5シングルエリミネーション。',teams:'チーム・シード',teamsUnit:'チーム',playinStatus:'スイス進出を争う',swissStatus:'スイス進出確定',seedUnknown:'シード未確認',ruleTitle:'方式と抽選規則',stagesTitle:'日程・会場',lplOriginal:'LPL 公式',globalOriginal:'LoL Esports',rulesOriginal:'公式大会規則'},
 ko:{title:'Worlds 2026 관전 가이드',intro:'진행 방식, 참가 팀, 경기장 및 공식 규정.',equation:'19개 팀 참가, 4개 팀 플레이인 1장, 스위스 16팀, 토너먼트 8팀.',qualified:'참가 팀',play:'플레이인',swiss:'스위스',knockout:'토너먼트',playText:'4팀 BO5 더블 엘리미네이션. 두 번째 패배 시 탈락하며 1팀만 스위스 진출.',swissText:'16팀 최대 5라운드, 3승 진출, 3패 탈락.',knockoutText:'8팀 BO5 싱글 엘리미네이션.',teams:'팀 및 시드',teamsUnit:'팀',playinStatus:'스위스 진출 경쟁',swissStatus:'스위스 직행',seedUnknown:'시드 확인 필요',ruleTitle:'대회 방식 및 추첨',stagesTitle:'일정과 경기장',lplOriginal:'LPL 공식',globalOriginal:'LoL Esports',rulesOriginal:'공식 규정'}
};
const c=computed(()=>i18n[props.locale]||i18n.en);
const order=['LPL','LCK','LEC','LCS','LCP','CBLOL'];
const playInTeams=new Set(['KC','C9','FUR','MVK']);
const seeds={LPL:{AL:1,BLG:2,TES:3,IG:4},LCS:{TLAW:1,LYON:2,C9:3},LCK:{GEN:1,HLE:2,T1:3,DK:4},LEC:{G2:1,MKOI:2,KC:3},LCP:{TSW:1,CFO:2,MVK:3},CBLOL:{LOS:1,FUR:2}};
const groups=computed(()=>{
 const all=new Map();
 for(const t of props.teams){const k=t.group||t.groupName||'OTHER';if(!all.has(k))all.set(k,[]);all.get(k).push(t);}
 return [...all].sort((a,b)=>order.indexOf(a[0])-order.indexOf(b[0])).map(([key,entries])=>({key,entries:[...entries].sort((a,b)=>(seeds[key]?.[a.code]||99)-(seeds[key]?.[b.code]||99))}));
});
const seed=t=>{const s=seeds[t.group||t.groupName]?.[t.code];if(!s)return c.value.seedUnknown;if(props.locale==='en')return 'Seed '+s;if(props.locale==='ko')return s+'번 시드';if(props.locale==='ja')return '第'+s+'シード';return s+(props.locale==='zh-TW'?'號種子':'号种子');};
const translatedStages = {
  'zh-CN': {
    dates: {'play-in':'10 月 15–18 日',swiss:'10 月 23–26 日、28–31 日',knockout:'11 月 3–8 日',final:'11 月 14 日'},
    venues: {'play-in':'Riot Games Arena · 美国加利福尼亚州洛杉矶',swiss:'Credit Union of Texas Event Center · 美国得克萨斯州艾伦',knockout:'Credit Union of Texas Event Center · 美国得克萨斯州艾伦',final:'Barclays Center · 美国纽约布鲁克林'},
  },
  'zh-TW': {
    dates: {'play-in':'10 月 15–18 日',swiss:'10 月 23–26 日、28–31 日',knockout:'11 月 3–8 日',final:'11 月 14 日'},
    venues: {'play-in':'Riot Games Arena · 美國加州洛杉磯',swiss:'Credit Union of Texas Event Center · 美國德州艾倫',knockout:'Credit Union of Texas Event Center · 美國德州艾倫',final:'Barclays Center · 美國紐約布魯克林'},
  },
  ja: {
    dates: {'play-in':'10月15日〜18日',swiss:'10月23日〜26日・28日〜31日',knockout:'11月3日〜8日',final:'11月14日'},
    venues: {'play-in':'Riot Games Arena · 米国カリフォルニア州ロサンゼルス',swiss:'Credit Union of Texas Event Center · 米国テキサス州アレン',knockout:'Credit Union of Texas Event Center · 米国テキサス州アレン',final:'Barclays Center · 米国ニューヨーク・ブルックリン'},
  },
  ko: {
    dates: {'play-in':'10월 15~18일',swiss:'10월 23~26일 · 28~31일',knockout:'11월 3~8일',final:'11월 14일'},
    venues: {'play-in':'Riot Games Arena · 미국 캘리포니아주 로스앤젤레스',swiss:'Credit Union of Texas Event Center · 미국 텍사스주 앨런',knockout:'Credit Union of Texas Event Center · 미국 텍사스주 앨런',final:'Barclays Center · 미국 뉴욕 브루클린'},
  },
};
const localizedStageDate=stage=>translatedStages[props.locale]?.dates?.[stage.key] || props.stageDateLabels[stage.key] || stage.dateLabel;
const localizedStageVenue=stage=>translatedStages[props.locale]?.venues?.[stage.key] || props.stageVenueLabels[stage.key] || [stage.venue,stage.location].filter(Boolean).join(' · ');
const localStage=key=>{
 if(key==='play-in')return c.value.play||'Play-In';
 if(key==='final')return ({'zh-CN':'总决赛','zh-TW':'總決賽',en:'Grand Final',ja:'決勝戦',ko:'결승전'})[props.locale]||'Grand Final';
 return c.value[key]||key;
};
</script>
<style scoped>
.worlds-guide{display:grid;gap:16px;min-width:0}
.wg-kicker{font-size:10px;letter-spacing:.08em;color:var(--event-muted)}
.wg-intro h2{font-size:19px;margin:5px 0}.wg-intro p,.wg-note{margin:3px 0;color:var(--event-muted);font-size:12px;line-height:1.65}
.wg-equation{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:12px;padding:12px;border:1px solid var(--event-border);border-radius:9px}
.wg-equation span{display:grid;gap:3px;text-align:center}.wg-equation span strong{font-size:20px;font-variant-numeric:tabular-nums}.wg-equation small{color:var(--event-muted);font-size:10px}.wg-equation>b{font-size:14px;color:var(--event-muted)}
.wg-guide-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.wg-guide-cards article{padding:12px;border:1px solid var(--event-border);border-radius:9px}.wg-guide-cards strong{font-size:13px}.wg-guide-cards p{font-size:11px;line-height:1.7;margin:5px 0 0;color:var(--event-muted)}
.wg-head{display:flex;align-items:center;justify-content:space-between;gap:9px;margin-bottom:-10px}.wg-head h3{font-size:14px;margin:0}.wg-head span{font-size:11px;color:var(--event-muted)}
.wg-regions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.wg-region{min-width:0;border:1px solid var(--event-border);border-radius:10px;padding:12px}.wg-region>header{display:flex;justify-content:space-between;margin-bottom:9px}.wg-region>header strong{font-size:13px}.wg-region>header span{font-size:11px;color:var(--event-muted)}
.wg-members{display:grid;gap:6px}.wg-team{display:flex;align-items:center;gap:8px;min-width:0;flex-wrap:wrap}.wg-team img{object-fit:contain;flex:none}.wg-team strong{font-size:12px}.wg-team span{font-size:10px;color:var(--event-muted)}.wg-team small{margin-left:auto;font-size:10px;color:var(--n-primary-color)}.wg-team small.is-playin{color:var(--event-muted)}
.wg-stages{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.wg-stages>div{display:grid;gap:6px;padding:11px;border:1px solid var(--event-border);border-radius:9px}.wg-stages b{font-size:12px}.wg-stages time,.wg-stages small{font-size:11px;color:var(--event-muted)}
.wg-sources{display:flex;flex-wrap:wrap;gap:9px 17px;padding-top:10px;border-top:1px solid var(--event-border)}.wg-sources a{color:var(--n-primary-color);font-size:11px;text-decoration:none}
@media(max-width:700px){.wg-guide-cards{grid-template-columns:1fr}.wg-regions{grid-template-columns:1fr}.wg-stages{grid-template-columns:1fr}.wg-equation{gap:6px}.wg-equation span strong{font-size:17px}}
</style>