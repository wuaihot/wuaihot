<template>
  <article class="official-match" :class="{ 'is-active': highlighted, 'is-muted': tracked && !highlighted }">
    <header><span :title="match.description">{{ officialMatchLabel(match, chinese) }}</span><span :class="{ 'is-live': match.state === 'inProgress' || match.state === 'in_progress' }">{{ match.format }} · {{ stateLabel }}</span></header>
    <time v-if="matchTime" :datetime="matchTime.dateTime" :title="matchTime.title">{{ matchTime.label }} <span>{{ chinese ? '北京时间' : 'UTC+8' }}</span></time>
    <template v-for="(team, index) in match.teams" :key="index">
      <div v-if="team.code === 'TBD'" class="match-team is-pending" :class="{ 'is-tracked': highlightedSlots.includes(index + 1), 'is-dimmed': highlighted && tracked && !highlightedSlots.includes(index + 1) }"><span class="team-placeholder">?</span><span class="team-name">{{ pendingLabels[index] || (chinese ? '待定' : 'TBD') }}</span><strong>–</strong></div>
      <button v-else type="button" class="match-team" :class="{ 'is-winner': outcome(team)?.won, 'is-loser': outcome(team) && !outcome(team).won, 'is-tracked': tracked === team.code, 'is-dimmed': highlighted && tracked && tracked !== team.code }" :aria-pressed="pinned === team.code" :title="team.name" @mouseenter="$emit('hover', team.code)" @mouseleave="$emit('hover', '')" @focus="$emit('focus', team.code)" @blur="$emit('focus', '')" @click="$emit('pin', team.code)">
        <img v-if="team.image" :src="team.image" alt="" loading="lazy"/><span v-else class="team-placeholder"></span><span class="team-name">{{ team.code }}</span><span v-if="outcome(team)" class="team-result" :class="'is-'+outcome(team).kind">{{ outcome(team).label }}</span><strong>{{ team.score ?? '–' }}</strong>
      </button>
    </template>
  </article>
</template>
<script setup>
import { computed } from 'vue';
import { officialMatchLabel,officialMatchTime,officialTeamOutcome } from '@/utils/lolPhaseLayout.js';
const props=defineProps({match:{type:Object,required:true},chinese:Boolean,tracked:String,pinned:String,highlighted:Boolean,highlightedSlots:{type:Array,default:()=>[]},pendingLabels:{type:Array,default:()=>[]},qualification:Boolean,knockout:Boolean});
defineEmits(['hover','focus','pin']);
const matchTime=computed(()=>officialMatchTime(props.match,props.chinese?'zh-CN':'en'));
const outcome=team=>officialTeamOutcome(props.match,team,{qualification:props.qualification,knockout:props.knockout,chinese:props.chinese});
const stateLabel=computed(()=>props.match.state==='completed'?(props.chinese?'已结束':'Completed'):['inProgress','in_progress'].includes(props.match.state)?(props.chinese?'进行中':'Live'):(props.chinese?'待开赛':'Upcoming'));
</script>
<style scoped>
.official-match{box-sizing:border-box;min-width:0;padding:8px 10px;border:1px solid var(--event-border);border-radius:7px;background:var(--records-surface);transition:opacity .12s,border-color .12s}
header{display:flex;align-items:center;justify-content:space-between;gap:6px;line-height:18px;font-size:10px;color:var(--records-muted);margin-bottom:3px;white-space:nowrap}header>span:first-child{overflow:hidden;text-overflow:ellipsis}time{display:flex;align-items:center;gap:5px;margin-bottom:4px;font-size:11px;line-height:18px;color:var(--records-muted);font-variant-numeric:tabular-nums}time span{font-size:9px}
.match-team{display:flex;align-items:center;gap:6px;box-sizing:border-box;width:100%;min-width:0;min-height:30px;padding:2px 3px;border:0;border-radius:3px;background:none;color:inherit;font:inherit;font-size:13px;text-align:left;cursor:pointer}.team-name{flex:1;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.match-team>strong{flex:0 0 1.3em;text-align:right;font-variant-numeric:tabular-nums;font-size:14px}.match-team img,.team-placeholder{flex:0 0 24px;width:24px;height:24px;object-fit:contain}.team-placeholder{display:grid;place-items:center;color:var(--records-muted)}.is-pending{font-size:11px;color:var(--records-muted);cursor:default}.is-winner{font-weight:650}.is-winner strong{color:var(--records-win)}.is-loser strong{color:var(--records-loss)}.team-result{flex:none;padding:1px 4px;font-size:10px;line-height:16px;font-weight:600;border-radius:3px;color:var(--records-muted);background:color-mix(in srgb,var(--records-muted) 8%,transparent)}.team-result.is-win,.team-result.is-advance{color:var(--records-win);background:color-mix(in srgb,var(--records-win) 11%,transparent)}.team-result.is-loss,.team-result.is-eliminated{color:var(--records-loss);background:color-mix(in srgb,var(--records-loss) 10%,transparent)}.team-result.is-champion{color:var(--records-gold);background:color-mix(in srgb,var(--records-gold) 13%,transparent)}.is-active{border-color:var(--records-accent)}.is-muted{opacity:.52}.match-team.is-tracked{color:var(--records-accent);background:color-mix(in srgb,var(--records-accent) 10%,transparent);box-shadow:inset 2px 0 var(--records-accent)}.match-team.is-dimmed{opacity:.45}.is-live{color:var(--records-win)}button:focus-visible{outline:2px solid var(--records-accent);outline-offset:2px;border-radius:3px}@media(pointer:coarse){button.match-team{min-height:40px}}
</style>
