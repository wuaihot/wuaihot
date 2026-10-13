<template>
  <section class="worlds-archive" :class="{ 'is-dark': store.siteTheme === 'dark' }" :style="themeStyle">
    <LolEventHero active-id="worlds-2025" :locale="locale" :title="copy.title" eyebrow="LEAGUE OF LEGENDS WORLD CHAMPIONSHIP 2025" status="completed" :status-label="copy.archive" logo="/assets/lol-series/worlds-official.png" edition="S15" :meta="heroMeta" :description="heroCopy.description" :links="heroLinks" :services-label="copy.official">
      <template #focus>
        <div class="archive-champion">
          <svg class="champion-trophy" viewBox="0 0 32 36" aria-hidden="true"><path d="M9 3h14v8c0 7-3 10-7 10s-7-3-7-10V3Zm0 3H3v4c0 5 3 8 7 8m13-12h6v4c0 5-3 8-7 8M16 21v8m-6 4h12m-10-4h8v4H12Z"/></svg>
          <img :src="WORLDS_2025_CHAMPION_LOGO" :alt="champion.name" width="56" height="56" @error="hideBrokenLogo" />
          <div class="champion-identity"><span>{{ extra.champion }}</span><strong>{{ champion.name }}</strong></div>
          <div class="champion-result"><strong>{{ championshipScore }}</strong><span>{{ extra.won }} <img :src="teamLogo(opponent.id)" alt="" width="24" height="24" @error="hideBrokenLogo" />{{ opponent.name }}</span></div>
        </div>

      </template>
      <template #watch><div class="archive-hero-replays"><a :href="data.officialUrl" target="_blank" rel="noopener noreferrer" :title="copy.official"><img class="lpl-replay-logo" src="/assets/lol-series/lpl-official.png" alt="" width="18" height="18" />{{ extra.tencent }} · {{ extra.collection }} ↗</a><a :href="WORLDS_2025_BILIBILI" target="_blank" rel="noopener noreferrer"><img src="/logo/bilibili.png" alt="" width="16" height="16" />{{ extra.bilibili }} · {{ extra.collection }} ↗</a></div></template>
    </LolEventHero>
    <div class="archive-sections" role="group" :aria-label="copy.result">
      <button v-for="section in sections" :key="section.key" type="button" :aria-pressed="activeSection === section.key" @click="selectSection(section.key)">{{ section.label }}</button>
    </div>
    <template v-if="activeSection === 'results'">
    <div class="archive-toolbar">
      <div class="archive-stages" role="group" :aria-label="copy.result">
        <button v-for="item in stages" :key="item.key" type="button" :aria-pressed="stageKey === item.key" @click="selectStage(item.key)">{{ item.label }}<span>{{ item.count }}</span></button>
      </div>
      <span class="archive-timezone">{{ copy.time }}</span>
    </div>
    <div v-if="stageKey === 'swiss'" class="archive-rounds" role="group" :aria-label="copy.swiss">
      <button type="button" :aria-pressed="!roundNumber" @click="selectRound(0)">{{ copy.all }}</button>
      <button v-for="round in currentStage.rounds" :key="round.round" type="button" :aria-pressed="roundNumber === round.round" @click="selectRound(round.round)">{{ roundLabel(round.round) }}</button>
    </div>
    <div v-if="!matchCount" class="archive-empty"><p>{{ copy.empty }}</p><button type="button" @click="clearSearch">{{ copy.reset }}</button></div>
    <LolArchiveSchedule v-else :rounds="visibleRounds" :all-rounds="currentStage.rounds" :stage="stageKey" :bracket="stageKey === 'knockout' && !query" :round-title="roundTitle" :team-name="id => data.teams[id]?.name || id" :locale="locale">
      <template #match="{ match, activeTeam, pinnedTeam, traceLabel, hover, leave, focus, blur, toggle, outcome }">
          <article class="archive-match" :class="{ 'is-traced': activeTeam && match.teams.includes(activeTeam), 'is-dimmed': activeTeam && !match.teams.includes(activeTeam), 'is-play-in': stageKey === 'play-in' }" :data-match-id="match.id">
            <div class="archive-match__meta"><time :datetime="match.start">{{ matchTime(match.start) }}</time><span>{{ match.bo }}</span></div>
            <button v-for="(id,index) in match.teams" :key="id" type="button" class="archive-team" :data-team="id" :aria-pressed="pinnedTeam === id" :aria-label="traceLabel + ' ' + teamLabel(match,index)" :class="{ 'is-winner': match.winner === index + 1, 'is-loser': Boolean(match.winner && match.winner !== index + 1), 'is-active': activeTeam === id }" @pointerenter="hover(id)" @pointerleave="leave" @focus="focus(id)" @blur="blur" @click="toggle(id)">
              <img :src="teamLogo(id)" :alt="teamLabel(match,index)" width="28" height="28" loading="lazy" decoding="async" @error="hideBrokenLogo" />
              <strong>{{ teamLabel(match,index) }}<small v-if="outcome(index)" class="archive-team__outcome">{{ outcome(index) }}</small></strong><span>{{ match.score[index] }}</span>
            </button>
            <div class="archive-match__replays"><span>{{ extra.replay }}：</span>
              <a v-if="match.vod" class="archive-match__video" :href="videoUrl(match)" target="_blank" rel="noopener noreferrer"><img class="lpl-replay-logo" src="/assets/lol-series/lpl-official.png" alt="" width="16" height="16" />{{ extra.tencent }} ↗</a>
              <a v-if="bilibiliUrl(match)" class="archive-match__video" :href="bilibiliUrl(match)" target="_blank" rel="noopener noreferrer"><img src="/logo/bilibili.png" alt="" width="16" height="16" />{{ extra.bilibili }} ↗</a>
            </div>
          </article>
      </template>
    </LolArchiveSchedule>
    </template>
    <section v-else-if="activeSection === 'teams'" class="archive-profiles">
      <div class="archive-section-heading"><h2>{{ extra.teamIntro }} <span>17</span></h2><a :href="WORLDS_2025_PRIMER" target="_blank" rel="noopener noreferrer">{{ extra.profileSource }} ↗</a></div>
      <p class="archive-section-note">{{ extra.profileNote }}</p>
      <div v-if="visibleTeams.length" class="archive-profile-grid">
        <article v-for="team in visibleTeams" :key="team.id" class="archive-profile">
          <div class="archive-profile__identity"><img :src="team.name === champion.name ? WORLDS_2025_CHAMPION_LOGO : team.logo" :alt="team.name" width="42" height="42" loading="lazy" @error="hideBrokenLogo" /><div><h3>{{ team.name }}</h3><p>{{ team.fullName }}</p></div><span>{{ team.region }}</span></div>
          <p>{{ extra.region }} · {{ team.region }}</p>
          <div class="archive-profile__performance"><strong>{{ team.progress }}</strong><span>{{ extra.record }} {{ team.wins }}{{ extra.wins }} · {{ team.losses }}{{ extra.losses }}</span></div>
          <button type="button" @click="viewTeamMatches(team)">{{ extra.matches }} ›</button>
        </article>
      </div>
      <p v-else class="archive-empty">{{ extra.empty }}</p>
    </section>
    <section v-else class="archive-news">
      <div class="archive-section-heading"><h2>{{ extra.newsIntro }}</h2><span>{{ extra.newsNote }}</span></div>
      <div v-if="visibleNews.length" class="archive-news-list">
        <article v-for="item in visibleNews" :key="item.url" class="archive-news-item">
          <time :datetime="item.date">{{ item.date }}</time><div><span>{{ extra.topics[item.kind] }} · {{ item.source }}</span><h3><a :href="item.url" target="_blank" rel="noopener noreferrer">{{ newsTitle(item) }} ↗</a></h3><p v-if="newsTitle(item) !== item.title">{{ item.title }}</p></div>
        </article>
      </div>
      <p v-else class="archive-empty">{{ extra.empty }}</p>
    </section>
    <footer class="archive-source"><p>{{ copy.source }}</p><a :href="data.officialUrl" target="_blank" rel="noopener noreferrer">{{ copy.viewSource }} ↗</a></footer>
  </section>
</template>
<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useThemeVars } from "naive-ui";
import { mainStore } from "@/store";
import LolEventHero from "@/components/LolEventHero.vue";
import LolArchiveSchedule from "@/components/LolArchiveSchedule.vue";
import replayEvidence from "@/data/events/worlds-2025-bilibili.json";
import { WORLDS_2025_LOGOS, WORLDS_2025_DARK_LOGOS, WORLDS_2025_PRIMER, WORLDS_2025_PROFILES, WORLDS_2025_NEWS, WORLDS_2025_BILIBILI, WORLDS_2025_CHAMPION_LOGO, WORLDS_ARCHIVE_COPY, WORLDS_2025_HERO_COPY } from "@/data/events/worlds-2025-content.mjs";
import data from "@/data/events/worlds-2025.json";
const route = useRoute();
const router = useRouter();
const { locale } = useI18n();
const store = mainStore();
const theme = useThemeVars();
const themeStyle = computed(() => ({ "--archive-text":theme.value.textColor1, "--archive-muted":theme.value.textColor3, "--archive-border":theme.value.borderColor, "--archive-surface":theme.value.cardColor, "--archive-hover":theme.value.hoverColor }));
const messages = {"zh-CN":{"title":"2025 英雄联盟全球总决赛","archive":"历史赛事 · 已结束","current":"查看本届赛事","official":"腾讯官方专区","play":"入围赛","swiss":"瑞士轮","knockout":"淘汰赛","round":"第 {n} 轮","quarter":"四分之一决赛","semi":"半决赛","final":"总决赛","champion":"冠军","teams":"支战队","matches":"场比赛","all":"全部轮次","video":"官方视频","empty":"没有符合搜索条件的比赛","reset":"清除搜索","time":"北京时间","source":"赛程与赛果：腾讯英雄联盟官方2025世界赛数据。队徽采用LPL官方公开队伍标识。","viewSource":"查看数据来源","back":"英雄联盟","result":"赛果"},"en":{"title":"League of Legends Worlds 2025","archive":"Archive · Completed","current":"Current season","official":"Official Tencent hub","play":"Play-in","swiss":"Swiss","knockout":"Knockout","round":"Round {n}","quarter":"Quarterfinals","semi":"Semifinals","final":"Final","champion":"Champion","teams":"teams","matches":"matches","all":"All rounds","video":"Official video","empty":"No matches for this search","reset":"Clear search","time":"China time (UTC+8)","source":"Schedule and results: Tencent’s official Worlds 2025 data. Team logos use official LPL team identities.","viewSource":"Data source","back":"League of Legends","result":"Results"},"zh-TW":{"title":"2025 英雄聯盟全球總決賽","archive":"歷史賽事 · 已結束","current":"查看本屆賽事","official":"騰訊官方專區","play":"入圍賽","swiss":"瑞士輪","knockout":"淘汰賽","round":"第 {n} 輪","quarter":"四分之一決賽","semi":"準決賽","final":"總決賽","champion":"冠軍","teams":"支戰隊","matches":"場比賽","all":"全部輪次","video":"官方影片","empty":"沒有符合搜尋條件的比賽","reset":"清除搜尋","time":"北京時間","source":"賽程與賽果：騰訊英雄聯盟官方2025世界賽資料。隊徽採用LPL官方公開隊伍標識。","viewSource":"檢視資料來源","back":"英雄聯盟","result":"賽果"},"ja":{"title":"League of Legends Worlds 2025","archive":"過去の大会 · 終了","current":"今季の大会","official":"Tencent公式ページ","play":"プレイイン","swiss":"スイス","knockout":"ノックアウト","round":"ラウンド {n}","quarter":"準々決勝","semi":"準決勝","final":"決勝","champion":"優勝","teams":"チーム","matches":"試合","all":"全ラウンド","video":"公式動画","empty":"検索に一致する試合はありません","reset":"検索をクリア","time":"中国標準時（UTC+8）","source":"日程と結果：Tencent公式Worlds2025データ。ロゴはLPLの公式チーム資料です。","viewSource":"データ出典","back":"League of Legends","result":"結果"},"ko":{"title":"League of Legends Worlds 2025","archive":"지난 대회 · 종료","current":"이번 시즌","official":"Tencent 공식 페이지","play":"플레이인","swiss":"스위스","knockout":"녹아웃","round":"라운드 {n}","quarter":"8강","semi":"4강","final":"결승","champion":"우승","teams":"팀","matches":"경기","all":"전체 라운드","video":"공식 영상","empty":"검색과 일치하는 경기가 없습니다","reset":"검색 지우기","time":"중국 표준시 (UTC+8)","source":"일정 및 결과: Tencent 공식 Worlds2025 데이터. 로고는 LPL 공식 팀 자료입니다.","viewSource":"데이터 출처","back":"League of Legends","result":"결과"}};
const copy = computed(() => messages[locale.value] || messages["zh-CN"]);
const extra = computed(()=>WORLDS_ARCHIVE_COPY[locale.value] || WORLDS_ARCHIVE_COPY["zh-CN"]);
const heroCopy = computed(()=>WORLDS_2025_HERO_COPY[locale.value] || WORLDS_2025_HERO_COPY["zh-CN"]);
const heroMeta = computed(()=>["2025.10.14 — 2025.11.09",heroCopy.value.host,"17 "+copy.value.teams,heroCopy.value.stages,"41 "+copy.value.matches]);
const heroLinks = computed(()=>[{label:heroCopy.value.guide,url:WORLDS_2025_PRIMER},{label:extra.value.topics.format,url:"https://lolesports.com/en-US/news/worlds-2025-format-explainer"}]);
const replayById = new Map(replayEvidence.records.map(item=>[item.matchId,item.url]));
const bilibiliUrl = match=>replayById.get(match.id) || "";

const sections = computed(()=>["results","teams","news"].map(key=>({key,label:extra.value[key]})));
const activeSection = computed(()=>sections.value.some(x=>x.key===route.query.section) ? route.query.section : "results");
const selectSection = section=>router.replace({query:{...route.query,section}});

const stages = computed(() => data.stages.map(item => ({ ...item, label:copy.value[item.key === "play-in" ? "play" : item.key], count:item.rounds.reduce((sum,round)=>sum+round.matches.length,0) })));
const stageKey = computed(() => stages.value.some(item=>item.key === route.query.stage) ? route.query.stage : "knockout");
const currentStage = computed(() => stages.value.find(item=>item.key === stageKey.value));
const roundNumber = computed(() => stageKey.value === "swiss" && currentStage.value.rounds.some(item=>item.round === Number(route.query.round)) ? Number(route.query.round) : 0);
const query = computed(() => String(route.query.q || "").trim().toLocaleLowerCase().slice(0,120));
const roundLabel = n => copy.value.round.replace("{n}",n);
const roundTitle = n => stageKey.value === "knockout" ? [copy.value.quarter,copy.value.semi,copy.value.final][n-1] : stageKey.value === "swiss" ? roundLabel(n) : copy.value.play;
const visibleRounds = computed(() => currentStage.value.rounds.filter(round=>!roundNumber.value || round.round===roundNumber.value).map(round=>({...round,matches:round.matches.filter(match=>!query.value || [match.names,match.bo,match.start.replace("T"," "),roundTitle(round.round)].join(" ").toLocaleLowerCase().includes(query.value))})).filter(round=>round.matches.length));
const matchCount = computed(() => visibleRounds.value.reduce((sum,round)=>sum+round.matches.length,0));
const finalMatch = data.stages.find(item=>item.key === "knockout").rounds.find(item=>item.round === 3).matches[0];
const champion = data.teams[finalMatch.teams[finalMatch.winner - 1]];
const opponent = data.teams[finalMatch.teams[2 - finalMatch.winner]];
const championshipScore = [finalMatch.score[finalMatch.winner - 1],finalMatch.score[2 - finalMatch.winner]].join(" : ");
const teamLogo = id=>{
 const name=data.teams[id].name;
 return (store.siteTheme==="dark" && WORLDS_2025_DARK_LOGOS[name]) || WORLDS_2025_LOGOS[name] || data.teams[id].logo;
};
const allMatches = data.stages.flatMap(stage=>stage.rounds.flatMap(round=>round.matches.map(match=>({...match,stageKey:stage.key,round:round.round}))));
const visibleTeams = computed(()=>WORLDS_2025_PROFILES.map(profile=>{
 const team = Object.values(data.teams).find(x=>x.name === profile.name);
 const played = allMatches.filter(match=>match.teams.includes(team.id));
 const last = played[played.length-1];
 const wins = played.filter(match=>match.teams[match.winner-1] === team.id).length;
 const progress = team.id===champion.id ? copy.value.champion : team.id===opponent.id ? extra.value.runner : last.stageKey==="knockout" ? [copy.value.quarter,copy.value.semi,copy.value.final][last.round-1] : last.stageKey==="swiss" ? copy.value.swiss : copy.value.play;
 return {...team,...profile,logo:teamLogo(team.id),wins,losses:played.length-wins,progress,lastStage:last.stageKey};
}).filter(team=>!query.value || [team.name,team.fullName,team.region,team.progress].join(" ").toLocaleLowerCase().includes(query.value)));
const newsTitle = item=>locale.value==="zh-TW" ? item.twTitle : locale.value==="zh-CN" ? item.zhTitle : item.title;
const visibleNews = computed(()=>WORLDS_2025_NEWS.filter(item=>!query.value || [item.title,item.zhTitle,item.twTitle,item.date,item.source,extra.value.topics[item.kind]].join(" ").toLocaleLowerCase().includes(query.value)));
const viewTeamMatches = team=>{const {round,...rest}=route.query;router.replace({query:{...rest,section:"results",stage:team.lastStage,q:team.name}});};
const teamLabel = (match,index) => match.names.split(/\s+vs\s+/i)[index] || data.teams[match.teams[index]].name;
const matchTime = value => new Intl.DateTimeFormat(locale.value,{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23",timeZone:data.timeZone}).format(new Date(value));
const videoUrl = match => "https://lpl.qq.com/es/video_detail.shtml?nid="+encodeURIComponent(match.vod)+"&bMatchId="+encodeURIComponent(match.id);
const selectStage = stage => { const { round,...rest }=route.query; router.replace({query:{...rest,stage}}); };
const selectRound = round => { const next={...route.query}; if(round)next.round=String(round);else delete next.round;router.replace({query:next}); };
const clearSearch = () => { const { q,...rest }=route.query;router.replace({query:rest}); };
const hideBrokenLogo = event => { event.target.style.visibility="hidden"; };
</script>
<style scoped>
.worlds-archive { width:100%; max-width:1440px; margin:0 auto; color:var(--archive-text); --archive-accent:#075b78; --archive-win:#277256; --archive-loss:#a84752; --archive-trace:#29329e; --archive-active:#e8f5f6; --archive-on:#064c61; }
.worlds-archive.is-dark { --archive-accent:#82dbe0; --archive-win:#8ac6af; --archive-loss:#e6a1a8; --archive-trace:#b7c1ff; --archive-active:#17383f; --archive-on:#a9f4f4; }

.archive-toolbar { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:22px 0 14px; }
.archive-stages,.archive-rounds { display:flex; flex-wrap:wrap; gap:6px; }
.archive-stages button,.archive-rounds button,.archive-empty button { padding:8px 12px; border:1px solid var(--archive-border); background:var(--archive-surface); color:var(--archive-text); border-radius:6px; font:inherit; font-size:13px; cursor:pointer; }
.archive-stages button span { font-size:11px; margin-left:7px; opacity:.7; font-variant-numeric:tabular-nums; }
.archive-stages button[aria-pressed=true],.archive-rounds button[aria-pressed=true] { background:var(--archive-active); border-color:var(--archive-accent); color:var(--archive-on); }
.archive-timezone { font-size:12px; color:var(--archive-muted); white-space:nowrap; }
.archive-rounds { margin:0 0 18px; }
.archive-match { padding:12px 14px; border:1px solid var(--archive-border); border-radius:8px; background:var(--archive-surface); min-width:0; }
.archive-match__meta { display:flex; align-items:center; justify-content:space-between; color:var(--archive-muted); font-size:12px; margin-bottom:12px; font-variant-numeric:tabular-nums; }
.archive-match__meta>span { font-size:11px; color:var(--archive-text); }
.archive-team { min-height:44px; width:100%; border:0; background:transparent; font:inherit; text-align:left; cursor:pointer; border-radius:4px; display:grid; grid-template-columns:28px minmax(0,1fr) 28px; align-items:center; gap:10px; padding:6px 0; color:var(--archive-muted); }
.archive-team.is-active { background:var(--archive-active); outline:2px solid var(--archive-trace); outline-offset:1px; }
.archive-team__outcome { display:block; color:var(--archive-muted); font-size:11px; font-weight:500; margin-top:3px; }
.archive-team.is-winner .archive-team__outcome{color:var(--archive-win)}
.archive-team.is-loser .archive-team__outcome{color:var(--archive-loss)}
.archive-match.is-traced { border-color:var(--archive-trace); }
.archive-match.is-dimmed { opacity:.55; }
.archive-match.is-play-in { padding:20px; }
.archive-match.is-play-in .archive-team { grid-template-columns:48px minmax(0,1fr) 40px; padding:12px 0; }
.archive-match.is-play-in .archive-team img { width:48px; height:48px; }
.archive-match.is-play-in .archive-team strong { font-size:22px; }
.archive-match.is-play-in .archive-team>span { font-size:28px; }
.archive-team img { display:block; object-fit:contain; }
.archive-team strong { font-size:14px; font-weight:500; overflow:hidden; text-overflow:ellipsis; }
.archive-team>span { text-align:right; font-size:19px; font-variant-numeric:tabular-nums; }
.archive-team.is-winner { color:var(--archive-text); }
.archive-team.is-winner strong { font-weight:750; }
.archive-team.is-winner>span { font-weight:750; color:var(--archive-win); }
.archive-team.is-loser>span{color:var(--archive-loss)}
.archive-match__video { display:inline-block; margin-top:10px; color:var(--archive-accent); font-size:12px; text-decoration:none; }
.archive-source { display:flex; align-items:baseline; justify-content:space-between; gap:16px; border-top:1px solid var(--archive-border); padding-top:14px; margin-top:24px; color:var(--archive-muted); font-size:12px; line-height:1.6; }
.archive-source p { margin:0; }
.archive-source a { color:var(--archive-accent); white-space:nowrap; }
.archive-empty { border:1px dashed var(--archive-border); text-align:center; padding:48px 16px; border-radius:8px; color:var(--archive-muted); }
.worlds-archive a:hover { text-decoration:underline; text-underline-offset:3px; }
.worlds-archive button:hover { filter:brightness(.96); }
.worlds-archive :is(a,button):focus-visible { outline:2px solid var(--archive-accent); outline-offset:3px; }
.worlds-archive .archive-team:focus-visible{outline-color:var(--archive-trace)}

@media(max-width:820px) { .archive-toolbar{align-items:flex-start;flex-wrap:wrap;}.archive-source{display:block;}.archive-source a{display:inline-block;margin-top:8px;} }

.archive-sections { display:flex; align-items:center; flex-wrap:wrap; gap:6px; margin-top:20px; border-bottom:1px solid var(--archive-border); padding-bottom:12px; }
.archive-sections>button { padding:9px 16px; border:0; border-radius:6px; background:transparent; color:var(--archive-muted); font:inherit; font-size:14px; cursor:pointer; }
.archive-sections>button[aria-pressed=true] { color:var(--archive-on); background:var(--archive-active); font-weight:650; }

.archive-match__replays { margin-top:10px; color:var(--archive-muted); font-size:12px; }
.archive-match__replays .archive-match__video { margin-top:0; }
.archive-section-heading { display:flex; align-items:baseline; flex-wrap:wrap; justify-content:space-between; gap:12px; padding-top:20px; }
.archive-section-heading h2 { font-size:17px; margin:0; }
.archive-section-heading h2 span { color:var(--archive-muted); font-size:13px; margin-left:6px; }
.archive-section-heading a { color:var(--archive-accent); font-size:12px; }
.archive-section-heading>span,.archive-section-note { font-size:12px; color:var(--archive-muted); line-height:1.6; }
.archive-section-note { margin:10px 0 18px; }
.archive-profile-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(min(290px,100%),1fr)); gap:12px; }
.archive-profile { border:1px solid var(--archive-border); border-radius:8px; padding:16px; background:var(--archive-surface); min-width:0; }
.archive-profile__identity { display:flex; align-items:center; gap:12px; }
.archive-profile__identity>img { display:block; object-fit:contain; flex:none; }
.archive-profile__identity>div { flex:1; min-width:0; }
.archive-profile h3 { font-size:18px; margin:0; }
.archive-profile p { font-size:12px; line-height:1.5; color:var(--archive-muted); margin:5px 0; overflow-wrap:anywhere; }
.archive-profile__identity>span { align-self:flex-start; font-size:11px; color:var(--archive-muted); }
.archive-profile__performance { display:flex; flex-wrap:wrap; justify-content:space-between; gap:8px; font-size:12px; margin-top:14px; }
.archive-profile__performance>strong { color:var(--archive-accent); }
.archive-profile__performance>span { color:var(--archive-muted); }
.archive-profile button { font:inherit; font-size:12px; padding:8px 0 0; border:0; background:transparent; color:var(--archive-accent); cursor:pointer; }
.archive-news-list { margin-top:16px; }
.archive-news-item { display:grid; grid-template-columns:100px minmax(0,1fr); gap:18px; padding:18px 0; border-bottom:1px solid var(--archive-border); }
.archive-news-item time,.archive-news-item span,.archive-news-item p { font-size:12px; color:var(--archive-muted); }
.archive-news-item h3 { font-size:16px; line-height:1.5; margin:6px 0; }
.archive-news-item h3 a { color:var(--archive-text); text-decoration:none; }
.archive-news-item p { margin:0; }
@media(max-width:600px) {

 .archive-sections>button { min-height:44px; padding:8px 12px; }

 .archive-news-item { grid-template-columns:1fr; gap:8px; }
}

.archive-champion { display:flex; align-items:center; gap:12px; color:#f2ffff; }
.champion-trophy { width:28px; height:36px; fill:none; stroke:#ecd092; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; flex:none; }
.archive-champion>img { display:block; object-fit:contain; flex:none; }
.champion-identity { min-width:0; display:grid; gap:5px; }
.champion-identity>span { color:#dfcd9e; font-size:12px; }
.champion-identity>strong { font-size:32px; line-height:1.1; color:#fff4d4; }
.champion-result { display:grid; gap:5px; margin-left:auto; }
.champion-result>strong { font-size:28px; font-variant-numeric:tabular-nums; white-space:nowrap; }
.champion-result>span { display:flex; align-items:center; gap:5px; font-size:12px; color:#d1e4e7; white-space:nowrap; }
.champion-result img { object-fit:contain; }
.archive-hero-replays,.archive-match__replays { display:flex; align-items:center; flex-wrap:wrap; gap:6px 12px; font-size:12px; }
.archive-hero-replays>span { color:#c5d8e0; }
.archive-hero-replays a { display:inline-flex; align-items:center; gap:5px; min-height:32px; color:#f2ffff; text-decoration:none; border-radius:4px; }
.archive-hero-replays a:focus-visible { outline:2px solid #0ac8b9; outline-offset:3px; }
.archive-match__replays a { display:inline-flex; align-items:center; gap:5px; min-height:30px; }
.archive-match__replays img { display:block; object-fit:contain; }
.archive-hero-replays img { display:block; object-fit:contain; }
@media(max-width:600px) {
 .archive-champion { gap:10px; max-width:360px; }.archive-champion>img { width:44px; height:44px; }
 .champion-identity>strong { font-size:28px; }.champion-result>strong { font-size:26px; }
 .archive-hero-replays a { min-height:44px; }
}
.worlds-archive:not(.is-dark) .archive-match__replays .lpl-replay-logo { filter:brightness(0); }
</style>
