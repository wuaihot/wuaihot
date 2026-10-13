<template>
  <component :is="inline ? 'section' : 'details'"
             v-if="group?.kind==='verified-day-reset' && group.posts?.length>1"
             class="ai-social-event-sources" :data-status="statusKind">
    <summary v-if="!inline">
      <span class="ai-social-event-sources__summary">{{ tw ? '事件進展 · ' : zh ? '事件进展 · ' : 'Event progress · ' }}{{ group.sourceCount }} {{ tw ? '則原帖' : zh ? '条原帖' : 'posts' }}</span>
      <span class="ai-social-event-sources__stage" :data-status="statusKind">{{ statusLabel }}</span>
    </summary>
    <header v-else class="ai-social-event-sources__inline-heading">
      <span class="ai-social-event-sources__summary">{{ tw ? '事件進展 · ' : zh ? '事件进展 · ' : 'Event progress · ' }}{{ group.sourceCount }} {{ tw ? '則原帖' : zh ? '条原帖' : 'posts' }}</span>
      <span class="ai-social-event-sources__stage" :data-status="statusKind">{{ statusLabel }}</span>
    </header>
    <div class="ai-social-event-sources__content">
      <ol>
        <li v-for="post in group.posts" :key="post.postId">
          <div class="ai-social-event-sources__row">
            <span class="ai-social-event-sources__kind" :data-stage="post.stage">{{ stageLabel(post.stage) }}</span>
            <a :href="post.url" target="_blank" rel="nofollow noopener noreferrer" :title="post.title">{{ post.title }} ↗</a>
            <time :datetime="post.publishedAt">{{ formatTime(post.publishedAt) }}</time>
            <span v-if="validViews(post.views)" class="ai-social-event-sources__views">
              {{ zh ? '阅读' : 'Views' }} {{ formatCompactMetric(post.views,locale) }}
            </span>
          </div>
          <p v-if="originalVisible && post.originalText" class="ai-social-event-sources__original">{{ post.originalText }}</p>
        </li>
      </ol>
      <div class="ai-social-event-sources__footer">
        <button v-if="!showOriginal" type="button" class="ai-social-event-sources__toggle"
                :aria-pressed="revealedOriginal" @click.prevent="revealedOriginal=!revealedOriginal">
          {{ revealedOriginal ? (zh?'收起原文':'Hide original') : (zh?'显示原文':'Show originals') }}
        </button>
        <span>{{ zh ? '各帖阅读量独立统计，不累加。' : 'Views are per post; not additive.' }}</span>
      </div>
    </div>
  </component>
</template>

<script setup>
import {computed,ref} from 'vue';
import {formatCompactMetric} from '@/utils/compactMetric.js';
const props=defineProps({group:{type:Object,default:null},locale:{type:String,default:'zh-CN'},showOriginal:{type:Boolean,default:false},inline:{type:Boolean,default:false}});
const revealedOriginal=ref(false);
const originalVisible=computed(()=>props.showOriginal||revealedOriginal.value);
const zh=computed(()=>props.locale.startsWith('zh'));
const tw=computed(()=>props.locale.toLowerCase()==='zh-tw');
const statusKind=computed(()=>props.group?.status==='completed'
  ?props.group?.completionKind==='declared-done'?'declared':'success'
  :props.group?.status==='expected'?'expected':'announced');
const statusLabel=computed(()=>({
  success:tw.value?'已確認推送':zh.value?'已确认推送':'Confirmed propagated',
  declared:tw.value?'作者宣告完成':zh.value?'作者宣告完成':'Author declared done',
  expected:tw.value?'預計落地 · 待確認':zh.value?'预计落地 · 待确认':'Expected · not confirmed',
  announced:tw.value?'已宣布':zh.value?'已宣布':'Announced',
})[statusKind.value]);
const stageLabel=stage=>({
  announced:zh.value?'初始公告':'Announcement',
  expected:tw.value?'時間補充':zh.value?'时间补充':'Timing update',
  completed:props.group?.completionKind==='declared-done'
    ?tw.value?'宣告完成':zh.value?'宣告完成':'Declared done'
    :tw.value?'確認推送':zh.value?'确认推送':'Confirmed propagated',
}[stage]||'');
const validViews=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0;
const formatTime=value=>{
  const date=new Date(value);
  return Number.isFinite(date.getTime())
    ?date.toLocaleString(props.locale,{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})
    :'';
};
</script>

<style scoped>
.ai-social-event-sources{margin:6px 0;min-width:0;color:var(--n-text-color-3,var(--text-secondary,#888));font-size:12px;line-height:1.55}
.ai-social-event-sources>summary,.ai-social-event-sources__inline-heading{display:flex;align-items:center;gap:8px;flex-wrap:wrap;width:fit-content;padding:3px 0}
.ai-social-event-sources>summary{cursor:pointer;user-select:none}
.ai-social-event-sources>summary:hover{color:var(--n-text-color,inherit)}
.ai-social-event-sources__summary{font-weight:600}
.ai-social-event-sources__stage{display:inline-flex;align-items:center;font-size:11px;font-weight:700;padding:1px 6px;border-radius:5px;border:1px solid currentColor}
.ai-social-event-sources__stage[data-status=success]{color:#17844d;background:color-mix(in srgb,#17844d 9%,transparent)}
.ai-social-event-sources__stage[data-status=declared]{color:#3374b8;background:color-mix(in srgb,#3374b8 9%,transparent)}
.ai-social-event-sources__stage[data-status=expected]{color:#a56b18;background:color-mix(in srgb,#a56b18 9%,transparent)}
.ai-social-event-sources__stage[data-status=announced]{color:var(--n-text-color-3,#64748b)}
.ai-social-event-sources__content{border-top:1px solid color-mix(in srgb,currentColor 14%,transparent);margin-top:4px;padding-top:4px}
.ai-social-event-sources ol{padding:2px 0 0 18px;margin:0;display:grid;gap:5px;list-style:decimal}
.ai-social-event-sources li{min-width:0;padding-left:2px}
.ai-social-event-sources__row{display:flex;align-items:baseline;gap:4px 9px;flex-wrap:wrap;min-width:0}
.ai-social-event-sources__kind{flex:none;font-weight:650;white-space:nowrap;color:var(--n-text-color,inherit)}
.ai-social-event-sources__kind[data-stage=completed]{color:var(--ai-action,var(--n-primary-color,#3374b8))}
.ai-social-event-sources[data-status=success] .ai-social-event-sources__kind[data-stage=completed]{color:#17844d}
.ai-social-event-sources__row a{flex:1 1 190px;min-width:0;overflow-wrap:anywhere;color:var(--n-text-color,inherit);text-decoration:none}
.ai-social-event-sources__row a:hover{text-decoration:underline;text-underline-offset:2px;color:var(--n-primary-color,#438bec)}
.ai-social-event-sources time,.ai-social-event-sources__views{white-space:nowrap;color:var(--n-text-color-3,var(--text-secondary,#888));font-size:11px;font-variant-numeric:tabular-nums}
.ai-social-event-sources__original{margin:3px 0 5px;font-size:12px;line-height:1.65;overflow-wrap:anywhere;white-space:pre-wrap;opacity:.9}
.ai-social-event-sources__footer{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;margin-top:6px;font-size:11px}
.ai-social-event-sources__toggle{padding:1px 4px;border:0;border-radius:4px;background:transparent;color:var(--ai-action,var(--n-primary-color,#438bec));cursor:pointer;font:inherit}
.ai-social-event-sources__toggle:hover{text-decoration:underline}
:global(html[data-dailyhot-theme=dark]) .ai-social-event-sources__stage[data-status=success]{color:#71d4a1;background:color-mix(in srgb,#71d4a1 11%,transparent)}
:global(html[data-dailyhot-theme=dark]) .ai-social-event-sources__stage[data-status=declared]{color:#92bbf1;background:color-mix(in srgb,#92bbf1 11%,transparent)}
:global(html[data-dailyhot-theme=dark]) .ai-social-event-sources__stage[data-status=expected]{color:#ebc27a;background:color-mix(in srgb,#ebc27a 11%,transparent)}
@media(max-width:480px){.ai-social-event-sources ol{padding-left:16px}.ai-social-event-sources__row a{flex-basis:100%;order:2}.ai-social-event-sources__row time{order:3}.ai-social-event-sources__row .ai-social-event-sources__views{order:4}}
</style>