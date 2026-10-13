<template>
  <section class="worlds-bracket" :aria-label="copy.title" @keydown.esc.stop="clearTeamTrace">
     <div class="wb-stages" role="group" :aria-label="copy.phase">
      <button v-for="stage in stageOptions" :key="stage.key" type="button" :aria-pressed="selected===stage.key"
        @click="selected=stage.key">{{ stage.label }}<small>{{ data[stage.key]?.items.length ?? '—' }}</small></button>
    </div>
    <p class="wb-explainer">{{ stageIntro }}</p>

    <div v-if="selected === 'swiss'" class="wb-swiss-rule" :aria-label="visualCopy.swissRules">
      <span><b>3</b> {{ visualCopy.advance }}</span><span aria-hidden="true">·</span><span><b>3</b> {{ visualCopy.eliminate }}</span><small>{{ visualCopy.fiveRounds }}</small>
    </div>
    <div v-if="loading && !activeData" class="wb-loading" role="status">{{ copy.loading }}</div>
    <div v-else-if="error && !activeData" class="wb-warning" role="status">{{ copy.unavailable }} <button type="button" @click="loadStage(selected,true)">{{ copy.retry }}</button></div>
    <template v-else-if="activeData">
      <div class="wb-status"><span>{{ activeData.items.length }} {{ copy.matches }} · {{ copy.dataStatus }} · {{ timeZoneLabel }}</span>
        <div v-if="hasOfficialPlayInTree" class="wb-official-trace" :class="{ 'is-active': Boolean(pinnedTeam) }">
          <span>{{ pinnedTeam }}</span>
          <button type="button" :disabled="!pinnedTeam" :tabindex="pinnedTeam ? 0 : -1" :aria-label="visualCopy.clearTrace" @click="clearTeamTrace">×</button>
        </div>
        <button type="button" class="wb-open-list" @click="emit('open-schedule')">{{ copy.fullSchedule }} ↗</button>
        <span v-if="loading">{{ copy.refreshing }}</span></div>
      <div v-if="rounds.length" class="wb-scroll" tabindex="0" :aria-label="copy.scroll">
        <div class="wb-bracket" :class="selected === 'play-in' && !hasOfficialPlayInTree ? 'is-play-in-list' : 'is-'+selected" :style="{ '--round-count': String(rounds.length), '--tree-height': knockoutHeight + 'px' }">
          <div v-if="hasOfficialPlayInTree" class="wb-official-playin-heads" role="group" :aria-label="visualCopy.routeLegend">
            <h3 class="wb-official-playin-head is-upper-semis">{{ visualCopy.upperSemis }}</h3>
            <h3 class="wb-official-playin-head is-upper-final">{{ visualCopy.upperFinal }}</h3>
            <h3 class="wb-official-playin-head is-lower-semis">{{ visualCopy.lowerSemi }}</h3>
            <h3 class="wb-official-playin-head is-lower-final">{{ visualCopy.eliminationFinal }}</h3>
            <h3 class="wb-official-playin-head is-final">{{ visualCopy.final }}</h3>
          </div>
          <section v-for="(round, index) in rounds" :key="round.key" class="wb-round">
            <header><span class="wb-round-number">{{ String(index+1).padStart(2,'0') }}</span><strong>{{ round.label }}</strong><small>{{ round.matches.length }} {{ copy.matches }}</small></header>
            <div v-if="selected==='swiss'" class="wb-round-route" :aria-label="visualCopy.records">
              <span v-for="record in swissRecordText(round.key).split(' / ')" :key="record" class="wb-record-chip"><b class="wb-win-count">{{ record.split('–')[0] }}</b><span>–</span><b class="wb-loss-count">{{ record.split('–')[1] }}</b></span>
            </div>
            <svg v-if="selected === 'knockout' && index < rounds.length-1" class="wb-edges" :viewBox="'0 0 24 '+knockoutHeight" aria-hidden="true">
              <path v-for="pair in round.matches.length/2" :key="pair" :d="knockoutPairPath(index,pair-1)"
                :class="{ 'is-confirmed': knockoutPairConfirmed(index,pair-1), 'is-muted': activeTeam && !knockoutPairTrackedPath(index,pair-1) }" />
              <path v-for="pair in round.matches.length/2" v-show="Boolean(knockoutPairTrackedPath(index,pair-1))" :key="'trace-'+pair" class="is-tracked" :d="knockoutPairTrackedPath(index,pair-1)" />
            </svg>
            <div class="wb-round-matches">
              <article v-for="(match,slot) in round.matches" :key="match.id" class="wb-match" :style="selected === 'knockout' ? knockoutNodeStyle(index,slot) : hasOfficialPlayInTree ? playinNodeStyle(index,slot) : undefined"
                :class="{'is-completed':isCompleted(match),'is-live':match.isLive,'is-structural':match.structural,'is-associated':Boolean(activeTeam && matchContainsTeam(match,activeTeam)),'is-dimmed':Boolean(activeTeam && !matchContainsTeam(match,activeTeam))}">
                <div v-if="hasOfficialPlayInTree && index===1 && !match.structural" class="wb-match-role wb-visually-hidden">{{ playinMatchLabel(index,slot) }}</div>
                <div v-if="!match.structural" class="wb-match-top"><time :datetime="match.startAt">{{ matchTime(match.startAt) }}</time><span>{{ format(match) }}</span><b v-if="match.isLive">{{ copy.live }}</b></div>
                <button v-for="(side,index) in [match.home,match.away]" :key="index" type="button" class="wb-team"
                  :disabled="!teamKey(side)" :aria-pressed="Boolean(teamKey(side) && pinnedTeam===teamKey(side))"
                  :title="teamKey(side) ? (visualCopy.traceTeam + ' · ' + side.name) : undefined"
                  @mouseenter="hoveredTeam=teamKey(side)" @mouseleave="hoveredTeam=''"
                  @focus="focusedTeam=teamKey(side)" @blur="focusedTeam=''"
                  @click="pinTeam(side)"
                  :class="{'is-winner':isVerifiedWinner(match,side),'is-loser':isVerifiedLoser(match,side),'is-tracked':Boolean(activeTeam && teamKey(side)===activeTeam),'is-tbd':!teamKey(side)}">
                  <img v-if="teamLogo(side)" :src="teamLogo(side)" :alt="side?.name || 'TBD'" width="24" height="24" loading="lazy" @error="hideLogo" />
                  <span v-else class="wb-logo">{{ side?.name==='TBD'?'?':String(side?.name||'?').slice(0,2) }}</span>
                  <strong>{{ side?.name && side.name!=='TBD' ? side.name : copy.tbd }}</strong>
                  <b v-if="isCompleted(match) && side?.result!=null">{{ side.result }}</b>
                </button>
                <div v-if="!match.structural && (match.isLive || isCompleted(match) || matchUrl(match))" class="wb-match-foot">
                  <span>{{ isCompleted(match)?copy.completed:match.isLive?copy.live:copy.upcoming }}</span>
                  <a v-if="matchUrl(match)" :href="matchUrl(match)" target="_blank" rel="nofollow noopener noreferrer">{{ isCompleted(match)?copy.replay:copy.watch }} ↗</a>
                </div>
              </article>
            </div>
          </section>
          <svg v-if="hasOfficialPlayInTree" class="wb-playin-route-map"
            :viewBox="'0 0 '+PLAY_IN_GRAPH_GEOMETRY.width+' '+PLAY_IN_GRAPH_GEOMETRY.height" aria-hidden="true">
            <path v-for="edge in visiblePlayInEdges" :key="edge.key"
              :data-edge="edge.key" :data-route="edge.route" :data-state="playInRouteOutcome(edge,rounds)?'verified':'pending'"
              :class="{ 'is-verified':Boolean(playInRouteOutcome(edge,rounds)),'is-tracked':isTrackedPlayInEdge(edge),'is-muted':Boolean(activeTeam && !isTrackedPlayInEdge(edge)) }"
              :d="playInGraphEdgePath(edge)" />
          </svg>
        </div>
      </div>
      <p v-else class="wb-empty">{{ copy.noMatches }}</p>
    </template>
  </section>
</template>
<script setup>
import { computed, ref, watch, onBeforeUnmount } from 'vue';
import { getEventScheduleRange } from '@/api';
import { playInProjection, playInMatchPosition, playInGraphEdgePath, playInRouteOutcome, verifiedMatchOutcome, PLAY_IN_GRAPH_EDGES, PLAY_IN_OFFICIAL_EDGES, PLAY_IN_GRAPH_GEOMETRY, provisionalSwissMatches, SWISS_RECORD_ROUTE, swissRoundByChicagoDate } from '@/utils/worlds2026Bracket.js';

const emit=defineEmits(['open-schedule']);
const props=defineProps({ locale:{type:String,default:'zh-CN'}, teams:{type:Array,default:()=>[]},
 scheduleItems:{type:Array,default:()=>[]},scheduleComplete:Boolean,refreshKey:[String,Number] });
const messages={
 'zh-CN':{title:'可视化对阵与晋级路线',phase:'赛事阶段',play:'入围赛',swiss:'瑞士轮',knockout:'淘汰赛',official:'官方对阵',loading:'正在读取官方比赛与对阵…',unavailable:'官方比赛数据暂不可读',retry:'重试',matches:'场比赛',dataStatus:'数据来自 LoL Esports',refreshing:'刷新中',scroll:'可左右滚动查看赛事阶段',live:'直播中',completed:'已结束',upcoming:'待开赛',replay:'查看回放',watch:'观看比赛',schedule:'官方赛程',tbd:'待定',noMatches:'这一阶段的官方对阵尚未确认',playIntro:'四支队伍进行 BO5 双败淘汰，胜者组与败者组最终会师决胜战，产生唯一瑞士轮席位。',fourTeams:'入围队伍',doubleElim:'双败淘汰',swissTicket:'瑞士轮名额',fullSchedule:'全部赛程',swissIntro:'16 支队伍进行五轮瑞士赛，取得 3 胜晋级八强，累计 3 负淘汰。',knockoutIntro:'八强、半决赛与总决赛均为 BO5 单败淘汰。'},
 'zh-TW':{title:'視覺化對陣與晉級路線',phase:'賽事階段',play:'入圍賽',swiss:'瑞士輪',knockout:'淘汰賽',official:'官方對陣',loading:'正在讀取官方賽程…',unavailable:'官方賽事資料暫不可讀',retry:'重試',matches:'場比賽',dataStatus:'LoL Esports 官方資料',refreshing:'更新中',scroll:'左右捲動查看賽事階段',live:'直播中',completed:'已結束',upcoming:'未開賽',replay:'賽事回放',watch:'觀看賽事',schedule:'官方賽程',tbd:'待定',noMatches:'本階段官方對陣尚未確認',playIntro:'四隊 BO5 雙敗，首次失利進入敗者組，第二次失利淘汰，最終一隊晉級瑞士輪。',fourTeams:'入圍隊伍',doubleElim:'雙敗淘汰',swissTicket:'瑞士輪名額',fullSchedule:'完整賽程',swissIntro:'16 隊進行五輪瑞士賽，3 勝晉級八強，3 敗淘汰。',knockoutIntro:'八強、四強、決賽隨官方更新。'},
 en:{title:'Visual bracket & progression',phase:'Tournament stages',play:'Play-In',swiss:'Swiss',knockout:'Knockouts',official:'Official bracket',loading:'Loading official match data…',unavailable:'Official schedule unavailable',retry:'Retry',matches:'matches',dataStatus:'LoL Esports source',refreshing:'Refreshing',scroll:'Scroll horizontally to view all rounds',live:'LIVE',completed:'Completed',upcoming:'Upcoming',replay:'Replay',watch:'Watch',schedule:'Schedule',tbd:'TBD',noMatches:'Official pairings not yet announced',playIntro:'Four teams play double-elimination Bo5 matches. A second defeat eliminates a team; the survivor earns one Swiss Stage berth.',fourTeams:'Teams',doubleElim:'Double-elim',swissTicket:'Swiss berth',fullSchedule:'Full schedule',swissIntro:'Sixteen teams play five Swiss rounds; three wins advance and three losses eliminate.',knockoutIntro:'Quarterfinals, semifinals and the final are best-of-five elimination matches.'},
 ja:{title:'対戦表・勝ち上がり',phase:'大会ステージ',play:'プレイイン',swiss:'スイス',knockout:'ノックアウト',official:'公式対戦表',loading:'公式データを読み込み中…',unavailable:'公式日程を取得できません',retry:'再試行',matches:'試合',dataStatus:'LoL Esports 公式',refreshing:'更新中',scroll:'左右にスクロール',live:'配信中',completed:'終了',upcoming:'予定',replay:'録画',watch:'視聴',schedule:'日程',tbd:'未定',noMatches:'対戦未確定',playIntro:'4チームのBO5ダブルエリミネーション。2敗で敗退、優勝した1チームがスイスへ進出。',fourTeams:'出場チーム',doubleElim:'ダブルエリミ',swissTicket:'進出枠',fullSchedule:'試合一覧',swissIntro:'16チームが全5ラウンドで対戦し、3勝で進出、3敗で敗退します。',knockoutIntro:'準々決勝から決勝まで。'},
 ko:{title:'대진표 및 진출 현황',phase:'대회 단계',play:'플레이인',swiss:'스위스',knockout:'토너먼트',official:'공식 대진',loading:'공식 경기 정보를 불러오는 중…',unavailable:'공식 경기 정보 없음',retry:'재시도',matches:'경기',dataStatus:'LoL Esports 공식',refreshing:'갱신 중',scroll:'좌우로 스크롤',live:'생중계',completed:'종료',upcoming:'예정',replay:'다시보기',watch:'시청',schedule:'일정',tbd:'미정',noMatches:'아직 대진이 확정되지 않았습니다',playIntro:'4팀 BO5 더블 엘리미네이션, 두 번째 패배 시 탈락, 마지막 1팀 스위스 진출.',fourTeams:'참가 팀',doubleElim:'더블 엘리미',swissTicket:'진출 1장',fullSchedule:'전체 일정',swissIntro:'16팀이 5라운드를 치르며 3승 시 진출, 3패 시 탈락합니다.',knockoutIntro:'8강부터 결승까지'}
};
const copy=computed(()=>messages[props.locale]||messages.en);
const visualMessages={
  'zh-CN':{round:n=>'第'+n+'轮',upperSemis:'胜者组 · 半决赛',upperLower:'胜者组 / 败者组',lowerFinal:'败者组 · 决赛',playinFinal:'入围赛 · 决胜战',upperSemi:'胜者组半决赛',upperFinal:'胜者组决赛',lowerSemi:'败者组半决赛',eliminationFinal:'败者组决赛',final:'最终决胜战',swissRules:'瑞士轮晋级规则',advance:'胜晋级',eliminate:'负淘汰',fiveRounds:'五轮赛制',records:'进入本轮的可能战绩',fixtures:'对阵',traceTeam:'追踪战队',clearTrace:'清除追踪',routeLegend:'双败赛晋级路线',winRoute:'胜者去向 · 实线',lossRoute:'转入败者组 · 虚线'},
  'zh-TW':{round:n=>'第'+n+'輪',upperSemis:'勝者組 · 準決賽',upperLower:'勝者組 / 敗者組',lowerFinal:'敗者組 · 決賽',playinFinal:'入圍賽 · 決勝戰',upperSemi:'勝者組準決賽',upperFinal:'勝者組決賽',lowerSemi:'敗者組準決賽',eliminationFinal:'敗者組決賽',final:'最終決勝戰',swissRules:'瑞士輪晉級規則',advance:'勝晉級',eliminate:'負淘汰',fiveRounds:'五輪賽制',records:'進入本輪的可能戰績',fixtures:'對陣',traceTeam:'追蹤戰隊',clearTrace:'清除追蹤',routeLegend:'雙敗賽晉級路線',winRoute:'勝者去向 · 實線',lossRoute:'轉入敗者組 · 虛線'},
  en:{round:n=>'Round '+n,upperSemis:'Upper · Semifinals',upperLower:'Upper / Lower',lowerFinal:'Lower · Final',playinFinal:'Play-In · Final',upperSemi:'Upper semifinal',upperFinal:'Upper final',lowerSemi:'Lower semifinal',eliminationFinal:'Lower final',final:'Grand final',swissRules:'Swiss stage progression',advance:'wins advance',eliminate:'losses eliminate',fiveRounds:'Five rounds',records:'Possible records entering this round',fixtures:'Fixtures',traceTeam:'Track team',clearTrace:'Clear tracking',routeLegend:'Double-elimination routes',winRoute:'Winners · solid',lossRoute:'Lower bracket · dashed'},
  ja:{round:n=>'第'+n+'ラウンド',upperSemis:'勝者側 · 準決勝',upperLower:'勝者側 / 敗者側',lowerFinal:'敗者側 · 決勝',playinFinal:'プレイイン決勝',upperSemi:'勝者側準決勝',upperFinal:'勝者側決勝',lowerSemi:'敗者側準決勝',eliminationFinal:'敗者側決勝',final:'最終決勝',swissRules:'スイス方式',advance:'勝で進出',eliminate:'敗で敗退',fiveRounds:'全5ラウンド',records:'このラウンド前の戦績区分',fixtures:'対戦',traceTeam:'チームを追跡',clearTrace:'追跡を解除',routeLegend:'ダブルエリミネーション',winRoute:'勝者の経路 · 実線',lossRoute:'敗者側へ · 破線'},
  ko:{round:n=>'라운드 '+n,upperSemis:'승자조 · 준결승',upperLower:'승자조 / 패자조',lowerFinal:'패자조 · 결승',playinFinal:'플레이인 · 결승',upperSemi:'승자조 준결승',upperFinal:'승자조 결승',lowerSemi:'패자조 준결승',eliminationFinal:'패자조 결승',final:'최종 결승',swissRules:'스위스 라운드',advance:'승 진출',eliminate:'패 탈락',fiveRounds:'5라운드',records:'해당 라운드 진입 전적 구간',fixtures:'대진',traceTeam:'팀 추적',clearTrace:'추적 해제',routeLegend:'더블 엘리미네이션',winRoute:'승자 경로 · 실선',lossRoute:'패자조 이동 · 점선'},
};
const visualCopy=computed(()=>visualMessages[props.locale]||visualMessages.en);
const playinMatchLabel=(round,slot)=>[
  [visualCopy.value.upperSemi,visualCopy.value.upperSemi],
  [visualCopy.value.upperFinal,visualCopy.value.lowerSemi],
  [visualCopy.value.eliminationFinal],
  [visualCopy.value.final],
][round]?.[slot]||'';
const swissRecordText=key=>SWISS_RECORD_ROUTE[key]||'';
const stageOptions=computed(()=>[{key:'play-in',label:copy.value.play,from:'2026-10-15',to:'2026-10-18'},{key:'swiss',label:copy.value.swiss,from:'2026-10-19',to:'2026-10-31'},{key:'knockout',label:copy.value.knockout,from:'2026-11-01',to:'2026-11-14'}]);
const selected=ref('play-in');
const hoveredTeam=ref(''),focusedTeam=ref(''),pinnedTeam=ref('');
const activeTeam=computed(()=>hoveredTeam.value||focusedTeam.value||pinnedTeam.value);
const teamKey=side=>{const name=String(side?.name||'').trim();return name && name.toUpperCase()!=='TBD'?name.toUpperCase():'';};
const matchContainsTeam=(match,key)=>Boolean(key && [match?.home,match?.away].some(side=>teamKey(side)===key));
const isVerifiedWinner=(match,side)=>Boolean(teamKey(side) && verifiedMatchOutcome(match)?.winner===teamKey(side));
const isVerifiedLoser=(match,side)=>Boolean(teamKey(side) && verifiedMatchOutcome(match)?.loser===teamKey(side));
const clearTeamTrace=()=>{hoveredTeam.value='';focusedTeam.value='';pinnedTeam.value='';};
const pinTeam=side=>{const key=teamKey(side);if(!key)return;hoveredTeam.value='';focusedTeam.value='';pinnedTeam.value=pinnedTeam.value===key?'':key;};
const data=ref({});
const loading=ref(false),error=ref(false);
let requestId=0;
const loadStage=async (key,force=false)=>{
 if(data.value[key]&&!force)return;
 const stage=stageOptions.value.find(s=>s.key===key);if(!stage)return;
 const id=++requestId;
 if(props.scheduleComplete && props.scheduleItems.length){
  const matches=props.scheduleItems.filter(item=>item?.phase===key || (key==='knockout'&&/quarter|semi|final|knockout/i.test(item?.phaseName||'')));
  data.value={...data.value,[key]:{items:matches,timezone:'America/Chicago'}};
  loading.value=false;error.value=false;return;
 }
 loading.value=true;error.value=false;
 try{
  const response=await getEventScheduleRange('worlds-2026',{from:stage.from,to:stage.to,limitPerDay:0,locale:props.locale,concurrency:4,force});
  if(id!==requestId)return;
  const matches=(response.items||[]).filter(item=>item?.phase===key|| (key==='knockout'&&/quarter|semi|final|knockout/i.test(item?.phaseName||'')));
  data.value={...data.value,[key]:{items:matches,timezone:response.timezone}};
 }catch(e){if(id===requestId){error.value=true;console.warn('Worlds official bracket data unavailable',e?.message||e);}}
 finally{if(id===requestId)loading.value=false;}
};
watch(selected,key=>{clearTeamTrace();void loadStage(key);},{immediate:true});
watch(()=>props.refreshKey,()=>{if(props.refreshKey)void loadStage(selected.value,true);});
watch(()=>props.scheduleComplete,complete=>{if(complete)void loadStage(selected.value,true);},{flush:'post'});
onBeforeUnmount(()=>{requestId++;});
const activeData=computed(()=>data.value[selected.value]||null);
const hasOfficialPlayInTree=computed(()=>selected.value==='play-in' && Boolean(playInProjection(activeData.value?.items||[])));
const visiblePlayInEdges=computed(()=>PLAY_IN_GRAPH_EDGES.filter(edge=>
  PLAY_IN_OFFICIAL_EDGES.includes(edge.key) || isTrackedPlayInEdge(edge)
));
const stageIntro=computed(()=>copy.value[selected.value==='play-in'?'playIntro':selected.value==='swiss'?'swissIntro':'knockoutIntro']);
const eventTimeZone=computed(()=>({
  'zh-CN':'Asia/Shanghai','zh-TW':'Asia/Taipei','ko':'Asia/Seoul','ja':'Asia/Tokyo',
})[props.locale] || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
const timeZoneLabel=computed(()=>({
  'zh-CN':'北京时间','zh-TW':'臺灣時間',ko:'한국시간',ja:'日本時間'
})[props.locale] || eventTimeZone.value.replaceAll('_',' '));
const localDateKey=value=>{const parts=new Intl.DateTimeFormat('en-US',{timeZone:eventTimeZone.value,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value));const field=type=>parts.find(part=>part.type===type)?.value||'00';return `${field('year')}-${field('month')}-${field('day')}`;};
const chicagoDate=value=>{const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value));const field=type=>parts.find(part=>part.type===type)?.value||'00';return `${field('year')}-${field('month')}-${field('day')}`;};
const roundKey=item=>{
 if(selected.value==='knockout'){
  const phase=String(item.phaseName||'');
  if(/quarter/i.test(phase))return '1';
  if(/semi/i.test(phase))return '2';
  if(/final/i.test(phase))return '3';
  const date=chicagoDate(item.startAt);
  return date<'2026-11-07'?'1':date<'2026-11-14'?'2':'3';
 }
 if(selected.value==='swiss'){
  const phase=String(item.phaseName||'');
  const round=/\b(?:round|r)\s*([1-5])\b/i.exec(phase)?.[1];
  return round||swissRoundByChicagoDate(chicagoDate(item.startAt));
 }
 return localDateKey(item.startAt);
};
const roundLabel=key=>{
 if(selected.value==='knockout')return key==='1'?(props.locale.startsWith('zh')?'八强 · 1/4 决赛':'Quarterfinals'):key==='2'?(props.locale.startsWith('zh')?'四强 · 半决赛':'Semifinals'):(props.locale.startsWith('zh')?'总决赛':'Final');
 if(/^2026-/.test(key))return new Intl.DateTimeFormat(props.locale,{timeZone:'UTC',month:'short',day:'numeric'}).format(new Date(key+'T12:00:00Z'));
 return selected.value==='swiss'?visualCopy.value.round(key):'Round '+key;
};
const rounds=computed(()=>{
 const map=new Map();
 for(const item of activeData.value?.items||[]){
  if(!item?.id||!item?.startAt)continue;
  const key=roundKey(item);
  if(!map.has(key))map.set(key,[]);
  map.get(key).push(item);
 }
 if(selected.value==='play-in'){
  const projection=playInProjection(activeData.value?.items||[]);
  if(projection)return projection.map((round,index)=>({
    ...round,label:[
      visualCopy.value.upperSemis,
      visualCopy.value.upperLower,
      visualCopy.value.lowerFinal,
      visualCopy.value.playinFinal,
    ][index],
  }));
 }
 if(selected.value==='swiss'){
  return provisionalSwissMatches(activeData.value?.items||[],chicagoDate).map(group=>({
    ...group,label:visualCopy.value.round(group.key),
  }));
 }
 if(selected.value==='knockout'){
  // Tournament format has 4 QFs / 2 SFs / 1 final, but only official
  // published match records may receive dates, IDs, teams or scores.
  return [['1',4],['2',2],['3',1]].map(([key,slots])=>{
   const published=[...(map.get(key)||[])].sort((a,b)=>a.startAt.localeCompare(b.startAt));
   const matches=Array.from({length:slots},(_,slot)=>published[slot]||{
    id:'format-slot-'+key+'-'+slot,structural:true,status:'STRUCTURAL',
    home:{name:'TBD'},away:{name:'TBD'},unitName:'',startAt:'',
   });
   return {key,label:roundLabel(key),matches};
  });
 }
 return [...map].sort((a,b)=>a[0].localeCompare(b[0])).map(([key,matches])=>({key,label:roundLabel(key),matches:matches.sort((a,b)=>a.startAt.localeCompare(b.startAt))}));
});
const knockoutHeight=computed(()=>Math.max(1,rounds.value[0]?.matches?.length||0)*130+10);
const playinNodeStyle=(stage,slot)=>({top:playInMatchPosition(stage,slot)+'px'});
const nodeCenter=(stage,slot)=>((Math.pow(2,stage)-1)/2 + slot*Math.pow(2,stage))*130+50;
const knockoutNodeStyle=(stage,slot)=>({top:(nodeCenter(stage,slot)-50)+'px'});
const knockoutPairPath=(stage,pair)=>{
 const first=nodeCenter(stage,pair*2);
 const second=nodeCenter(stage,pair*2+1);
 const destination=nodeCenter(stage+1,pair);
 return `M 0 ${first} H 12 M 0 ${second} H 12 M 12 ${first} V ${second} M 12 ${destination} H 24`;
};
const knockoutPairTrackedPath=(stage,pair)=>{
 if(!activeTeam.value)return '';
 const source=rounds.value[stage]?.matches.slice(pair*2,pair*2+2)||[];
 const target=rounds.value[stage+1]?.matches[pair];
 if(!target || !matchContainsTeam(target,activeTeam.value))return '';
 const slot=source.findIndex(match=>verifiedMatchOutcome(match)?.winner===activeTeam.value);
 if(slot<0)return '';
 const y=nodeCenter(stage,pair*2+slot),next=nodeCenter(stage+1,pair);
 return `M 0 ${y} H 12 V ${next} H 24`;
};
const isTrackedPlayInEdge=edge=>{
 if(!activeTeam.value)return false;
 const participant=playInRouteOutcome(edge,rounds.value);
 const target=rounds.value[edge.to[0]]?.matches?.[edge.to[1]];
 return participant===activeTeam.value && matchContainsTeam(target,activeTeam.value);
};
const knockoutPairConfirmed=(stage,pair)=>{
 const inputs=rounds.value[stage]?.matches.slice(pair*2,pair*2+2)||[];
 const target=rounds.value[stage+1]?.matches[pair];
 return Boolean(target && inputs.length===2 && inputs.every(match=>{
  if(!isCompleted(match))return false;
  const winner=match.home?.winner?match.home?.name:match.away?.winner?match.away?.name:'';
  return winner && [target.home?.name,target.away?.name].includes(winner);
 }));
};
const matchTime=value=>{
 if(!value)return '';
 return new Intl.DateTimeFormat(props.locale,{timeZone:eventTimeZone.value,month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(value));
};
const format=item=>/BO[1-7]/i.exec(item.unitName||'')?.[0] || (selected.value==='knockout'||selected.value==='play-in'?'BO5':'');
const isCompleted=item=>item.status==='OFFICIAL'||item.status==='UNOFFICIAL';
const teamLogo=side=>props.teams.find(t=>[t.code,t.name,t.id].some(v=>String(v||'').toUpperCase()===String(side?.name||'').toUpperCase()))?.image || '';
const hideLogo=e=>{e.target.style.visibility='hidden';};
const matchUrl=item=>{
 const url=String(isCompleted(item)?(item.vodUrl||item.replayUrl||''):(item.liveUrl||item.streamUrl||''));
 if(!url)return '';
 try{const u=new URL(url);return u.protocol==='https:'&&/^(?:www\.)?(?:lolesports\.com|youtube\.com|youtu\.be|twitch\.tv|bilibili\.com|live\.bilibili\.com)$/i.test(u.hostname)?url:'';}catch{return '';}
};
</script>
<style scoped>
.worlds-bracket{--wb-line:var(--event-border);--wb-result-win:var(--lol-result-win,#277256);--wb-result-loss:var(--lol-result-loss,#a84752);--wb-trace:var(--lol-trace-accent,#29329e);min-width:0;color:var(--n-text-color)}
.wb-head{display:flex;align-items:start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px}
.wb-head h2{font-size:18px;margin:4px 0 0;line-height:1.3}
.wb-head a{color:var(--n-primary-color);font-size:11px;text-decoration:none}
.wb-eyebrow{font-size:10px;letter-spacing:.08em;color:var(--event-muted)}
.wb-stages{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-bottom:12px;padding:0;background:transparent;border:0;border-bottom:1px solid var(--event-border);border-radius:0}
.wb-stages button{font:inherit;font-size:12px;font-weight:550;cursor:pointer;border:0;border-bottom:2px solid transparent;border-radius:0;color:var(--event-muted);background:transparent;padding:9px 5px 10px;margin-bottom:-1px;min-width:0;display:flex;justify-content:center;gap:6px;align-items:center;transition:color .16s ease,border-color .16s ease}
.wb-stages button:hover:not([aria-pressed=true]){background:transparent;color:var(--n-text-color)}
.wb-stages button[aria-pressed=true]{position:relative;font-weight:680;border-bottom-color:transparent;background:transparent;color:var(--n-text-color)}
.wb-stages button[aria-pressed=true]::after{content:"";position:absolute;bottom:-1px;left:50%;width:min(52px,42%);height:2px;transform:translateX(-50%);border-radius:2px;background:var(--n-primary-color)}
.wb-stages button:focus-visible,.wb-scroll:focus-visible,.wb-match a:focus-visible{outline:2px solid var(--n-primary-color);outline-offset:2px}
.wb-stages small{font-size:10px;color:var(--event-muted)}
.wb-explainer,.wb-note,.wb-status,.wb-loading,.wb-warning,.wb-empty{font-size:11px;line-height:1.6;color:var(--event-muted)}
.wb-explainer{margin:0 0 12px}.wb-note{margin:12px 0 0}
.wb-playin-rule{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:8px 0 14px;padding:10px;border:1px solid var(--event-border);border-radius:9px}
.wb-playin-rule div{display:grid;gap:4px;min-width:65px;flex:1;text-align:center}.wb-playin-rule strong{font-size:16px;font-variant-numeric:tabular-nums}.wb-playin-rule small{font-size:11px;color:var(--event-muted)}.wb-playin-rule>span{color:var(--event-muted);font-weight:700}
.wb-open-list{border:0;background:transparent;color:var(--n-primary-color);font:inherit;font-size:11px;cursor:pointer}
.wb-open-list:focus-visible{outline:2px solid var(--n-primary-color);outline-offset:2px}
.wb-status{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px 12px;margin-bottom:12px}
.wb-scroll{min-width:0;overflow-x:auto;overscroll-behavior-x:contain;scrollbar-width:thin}
.wb-bracket{display:grid;grid-template-columns:repeat(var(--round-count),minmax(215px,1fr));gap:24px;min-width:max-content;padding:2px 8px 12px 2px}
.wb-round{min-width:215px;max-width:310px;position:relative}
.wb-round:not(:last-child)::after{content:'';position:absolute;right:-17px;top:82px;width:14px;border-top:1px dashed var(--event-border)}
.wb-bracket.is-knockout .wb-round::after{display:none}
.wb-round header{min-height:40px;display:flex;gap:7px;align-items:center;margin-bottom:12px;border-bottom:1px solid var(--event-border)}
.wb-round header strong{font-size:12px}.wb-round header small{font-size:10px;color:var(--event-muted);margin-left:auto}
.wb-round-number{font-size:11px;color:var(--n-primary-color);font-weight:750}
.wb-round-matches{display:grid;gap:14px;align-content:start}
.wb-bracket.is-knockout .wb-round-matches{display:block;position:relative;height:var(--tree-height)}
.wb-bracket.is-knockout .wb-match{position:absolute;left:0;right:0;height:136px;min-height:136px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;padding:9px 11px;border-radius:8px;box-shadow:0 1px 2px color-mix(in srgb,var(--n-text-color) 4%,transparent)}
.wb-edges{position:absolute;right:-24px;top:52px;height:var(--tree-height);width:24px;overflow:visible;pointer-events:none}
.wb-edges path{fill:none;stroke:color-mix(in srgb,var(--event-muted) 52%,var(--event-border));stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}
.wb-edges path.is-confirmed{stroke:var(--wb-result-win);stroke-width:2;stroke-dasharray:none}
.wb-edges path.is-muted{opacity:.28}
.wb-edges path.is-tracked{stroke:var(--wb-trace);stroke-width:2.8;stroke-dasharray:none;opacity:1}
.wb-match{min-width:0;padding:9px 10px;border:1px solid var(--event-border);border-radius:9px;background:var(--event-surface)}
.wb-match.is-live{border-color:var(--n-primary-color)}
.wb-match.is-structural{border-style:dashed;color:var(--event-muted)}
.wb-structural-note{font-size:10px;font-weight:700;color:var(--event-muted);margin-bottom:7px}
.wb-match-top,.wb-match-foot{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:5px;font-size:10px;color:var(--event-muted)}
.wb-match-top{margin-bottom:6px;font-variant-numeric:tabular-nums}.wb-match-top b{color:var(--n-primary-color)}
.wb-team{display:flex;align-items:center;gap:7px;min-height:37px;width:100%;padding:0;border:0;border-top:1px solid color-mix(in srgb,var(--event-border) 50%,transparent);border-radius:3px;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}
.wb-team:disabled{cursor:default;opacity:1}
.wb-team:focus-visible{outline:2px solid var(--wb-trace);outline-offset:1px}
.wb-team.is-tracked{color:var(--wb-trace);background:color-mix(in srgb,var(--wb-trace) 9%,transparent);box-shadow:inset 2px 0 var(--wb-trace)}
.wb-team img,.wb-logo{flex:none;width:24px;height:24px;object-fit:contain}.wb-logo{display:grid;place-items:center;color:var(--event-muted);font-size:10px}
.wb-team strong{flex:1;min-width:0;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wb-team b{font-size:14px;font-variant-numeric:tabular-nums}.wb-team.is-winner b{color:var(--wb-result-win)}.wb-team.is-loser b{color:var(--wb-result-loss)}.wb-team.is-tbd{color:var(--event-muted)}
.wb-match-foot{margin-top:7px;padding-top:8px;border-top:1px solid var(--event-border)}
.wb-match-foot a{color:var(--n-primary-color);text-decoration:none}
.wb-warning button{border:0;background:transparent;color:var(--n-primary-color);cursor:pointer;font:inherit}
/* Riot-inspired format-aware projection: actual fixtures remain the sole match data. */
.wb-swiss-rule{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:4px 0 12px;padding:9px 12px;background:color-mix(in srgb,var(--event-surface) 88%,var(--n-color));border:1px solid var(--event-border);border-radius:8px;color:var(--event-muted);font-size:11px}
.wb-swiss-rule b{font-size:14px;color:var(--n-text-color);font-variant-numeric:tabular-nums}
.wb-swiss-rule small{margin-left:auto;color:var(--event-muted);font-size:10px}
.wb-round-route{display:flex;align-items:center;flex-wrap:wrap;gap:3px;min-height:22px;margin:-4px 0 10px;color:var(--event-muted)}
.wb-record-chip{display:inline-flex;align-items:center;gap:1px;padding:3px 5px;border:1px solid var(--event-border);border-radius:4px;background:var(--event-surface);font-size:10px;line-height:1.1;font-variant-numeric:tabular-nums}
.wb-record-chip b{font-weight:750}.wb-win-count{color:var(--n-success-color,#0a9972)}.wb-loss-count{color:var(--n-error-color,#cc5858)}
.wb-bracket.is-swiss{gap:14px;grid-template-columns:repeat(5,minmax(193px,1fr))}
.wb-bracket.is-swiss .wb-round{min-width:193px}
.wb-bracket.is-swiss .wb-round::after{top:91px;right:-11px;width:9px}
.wb-bracket.is-swiss .wb-round-matches{gap:7px}
.wb-bracket.is-swiss .wb-match{padding:6px 8px;border-radius:7px}
.wb-bracket.is-swiss .wb-team{min-height:30px}
.wb-bracket.is-swiss .wb-team img,.wb-bracket.is-swiss .wb-logo{width:20px;height:20px}
.wb-bracket.is-swiss .wb-match-foot{margin-top:3px;padding-top:4px}
.wb-bracket.is-knockout{gap:24px;grid-template-columns:repeat(3,236px)}
.wb-bracket.is-knockout .wb-round{min-width:236px;max-width:236px}
.wb-bracket.is-knockout .wb-round::after{display:none}
.wb-bracket.is-knockout .wb-match.is-structural{border-style:solid;border-color:color-mix(in srgb,var(--event-border) 80%,transparent);background:color-mix(in srgb,var(--event-surface) 70%,transparent)}
.wb-bracket.is-knockout .wb-match.is-structural .wb-team{opacity:.72}
.wb-bracket.is-knockout .wb-match.is-structural .wb-logo{border:1px solid var(--event-border);border-radius:5px;font-weight:650}
.wb-bracket.is-knockout .wb-round header{margin-bottom:14px}
.wb-bracket.is-knockout .wb-match:hover{border-color:color-mix(in srgb,var(--event-muted) 65%,var(--event-border))}
.wb-match.is-completed{border-color:var(--event-border)}
.wb-match.is-associated{border-color:color-mix(in srgb,var(--wb-trace) 65%,var(--event-border));box-shadow:inset 2px 0 var(--wb-trace)}
.wb-match.is-dimmed{opacity:.62}
.wb-team.is-winner strong{color:var(--n-text-color);font-weight:800}
@media(pointer:coarse){.wb-team:not(:disabled){min-height:40px}}
@media(prefers-reduced-motion:reduce){.wb-match,.wb-team{transition:none}}
@media(max-width:700px){.wb-bracket.is-swiss{gap:12px}}
@media(max-width:700px){.wb-bracket{gap:15px}.wb-round{min-width:220px}.wb-stages button{font-size:11px}}
/* LoL Esports bracket hierarchy: upper and lower brackets occupy separate
   visual lanes. Only advancement feeders appear by default; the full verified
   win/loss topology remains available for user-initiated team tracing. */
.wb-bracket.is-play-in{grid-template-columns:repeat(4,196px);gap:28px;width:max-content;position:relative}
.wb-bracket.is-play-in .wb-round{min-width:196px;max-width:196px;z-index:1}
.wb-bracket.is-play-in .wb-round::after{display:none}
.wb-bracket.is-play-in .wb-round header{display:none}
.wb-bracket.is-play-in .wb-round-matches{margin-top:52px;height:455px;display:block;position:relative}
.wb-bracket.is-play-in .wb-match{position:absolute;left:0;right:0;box-sizing:border-box;height:98px;min-height:98px;padding:6px 9px;border-radius:6px;box-shadow:none}
.wb-bracket.is-play-in .wb-match-top{margin-bottom:2px;line-height:1.3;font-size:9px}
.wb-bracket.is-play-in .wb-team{min-height:30px}
.wb-bracket.is-play-in .wb-team img,.wb-bracket.is-play-in .wb-logo{width:22px;height:22px}
.wb-bracket.is-play-in .wb-match-foot{display:none}
.wb-visually-hidden{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important}
.wb-official-playin-heads{position:absolute;inset:0;pointer-events:none;z-index:3}
.wb-official-playin-head{position:absolute;display:flex;align-items:center;width:196px;min-height:27px;box-sizing:border-box;padding:5px 8px;margin:0;border-radius:4px;background:color-mix(in srgb,var(--event-muted) 12%,var(--event-surface));border:1px solid var(--event-border);color:var(--n-text-color);font-size:10px;font-weight:750;letter-spacing:.015em;line-height:1.35}
.wb-official-playin-head.is-upper-semis{left:0;top:0}
.wb-official-playin-head.is-upper-final{left:224px;top:0}
.wb-official-playin-head.is-lower-semis{left:224px;top:364px}
.wb-official-playin-head.is-lower-final{left:448px;top:364px}
.wb-official-playin-head.is-final{left:672px;top:0}
.wb-playin-route-map{position:absolute;top:54px;left:2px;width:868px;height:455px;overflow:visible;pointer-events:none;z-index:0}
.wb-playin-route-map path{fill:none;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke}
.wb-playin-route-map path[data-route="win"]{stroke:color-mix(in srgb,var(--event-muted) 55%,var(--event-border));stroke-width:1.5;opacity:.84;stroke-linecap:square}
.wb-playin-route-map path[data-route="win"].is-verified{stroke:var(--wb-result-win);stroke-width:2;opacity:1}
.wb-playin-route-map path[data-route="loss"]{stroke:var(--event-muted);stroke-width:1.5;stroke-dasharray:3 4;opacity:.55}
.wb-playin-route-map path[data-route="loss"].is-verified{stroke:var(--wb-result-loss);opacity:.72}
.wb-playin-route-map path.is-muted{opacity:.22!important}
.wb-playin-route-map path.is-tracked{stroke:var(--wb-trace)!important;stroke-width:2.8!important;stroke-dasharray:none!important;opacity:1!important}
.wb-official-trace{display:flex;align-items:center;justify-content:flex-end;gap:7px;min-width:54px;visibility:hidden;color:var(--wb-trace);font-weight:700;font-size:11px;margin:0}.wb-official-trace.is-active{visibility:visible}
.wb-official-trace button{border:0;background:transparent;color:inherit;cursor:pointer;font:inherit}
.wb-bracket.is-knockout{grid-template-columns:repeat(3,210px);gap:28px;width:max-content;margin-inline:auto}
.wb-bracket.is-knockout .wb-round{min-width:210px;max-width:210px}
.wb-bracket.is-knockout .wb-round header{min-height:32px;margin-bottom:12px;border:0}
.wb-bracket.is-knockout .wb-round header strong{font-size:11px;font-weight:750;border:1px solid var(--event-border);border-radius:4px;background:color-mix(in srgb,var(--event-muted) 12%,var(--event-surface));padding:7px 9px;flex:1}
.wb-bracket.is-knockout .wb-round-number,.wb-bracket.is-knockout .wb-round header small{display:none}
.wb-bracket.is-knockout .wb-match{height:100px;min-height:100px;padding:7px 10px;border-radius:6px;box-shadow:none}
.wb-bracket.is-knockout .wb-match-top{margin-bottom:3px;font-size:9px}
.wb-bracket.is-knockout .wb-team{min-height:33px}
.wb-bracket.is-knockout .wb-match-foot{display:none}
.wb-bracket.is-knockout .wb-round-matches{height:var(--tree-height)}
.wb-bracket.is-knockout .wb-edges{top:44px;right:-28px;width:28px}
.wb-bracket.is-swiss .wb-round::after{display:none}
.wb-bracket.is-swiss .wb-round header{min-height:31px;margin-bottom:9px;padding:0 8px;border:1px solid var(--event-border);border-radius:4px;background:color-mix(in srgb,var(--event-muted) 10%,var(--event-surface))}
.wb-bracket.is-swiss .wb-round-number{color:var(--event-muted);font-size:10px}
.wb-bracket.is-knockout .wb-match.is-structural .wb-team:first-of-type,.wb-bracket.is-play-in .wb-match.is-structural .wb-team:first-of-type{border-top:0}
.wb-bracket.is-knockout .wb-match.is-structural .wb-logo{border:0;font-weight:600;opacity:.7}
.wb-bracket.is-knockout .wb-match.is-structural .wb-team{opacity:.78}
@media(max-width:700px){.wb-bracket.is-knockout{margin-inline:0}}
</style>
