<template>
  <div class="event-hot-ranking" role="list" :aria-label="labels.heading">
    <article v-for="(item, index) in items" :key="item.key" class="event-hot-ranking__card" role="listitem">
      <span class="event-hot-ranking__place" :data-top="index < 3 ? index + 1 : null" :aria-label="labels.rank + ' ' + (offset + index + 1)">{{ offset + index + 1 }}</span>
      <div class="event-hot-ranking__body">
        <a class="event-hot-ranking__title" :href="item.url" target="_blank" rel="nofollow noopener noreferrer" :title="item.summary || item.title">
          {{ item.title }} <span class="event-hot-ranking__arrow" aria-hidden="true">↗</span>
        </a>
        <div class="event-hot-ranking__details">
          <span v-if="item.sourceCount" :title="platformEvidence(item)">{{ item.sourceCount }} {{ labels.platforms }}</span>
          <span v-if="item.bestRank"> {{ labels.peak }} #{{ item.bestRank }}</span>
          <span v-if="item.observedHours">{{ item.observedHours }} {{ labels.hours }}</span>
        </div>
      </div>
      <div class="event-hot-ranking__metric" v-if="typeof item.score === 'number' && Number.isFinite(item.score) && item.score > 0"
           :title="item.scoreMethod === 'normalized-cross-platform-heat-sum' ? labels.normalizedHelp : labels.scoreHelp">
        <b>{{ formatScore(item.score) }}</b>
        <small>{{ item.scoreMethod === 'normalized-cross-platform-heat-sum' ? labels.normalized : labels.score }}</small>
      </div>
    </article>
  </div>
</template>

<script setup>
import { computed } from 'vue';
const props = defineProps({
  items: { type: Array, default: () => [] },
  locale: { type: String, default: 'zh-CN' },
  offset: { type: Number, default: 0 },
});
const labels = computed(() => ({
  'zh-CN': {heading:'热议排行榜',rank:'第',platforms:'平台',peak:'最高',hours:'小时观测',normalized:'跨平台指数',score:'综合指数',
    normalizedHelp:'各平台同期榜单热度先归一化，按独立平台合计；不直接累加不同平台原始热度值。',
    scoreHelp:'按榜位、持续时间及来源覆盖计算的综合指数，不代表可累加的原始热度。'},
  'zh-TW': {heading:'熱議排行榜',rank:'第',platforms:'平台',peak:'最高',hours:'小時觀測',normalized:'跨平台指數',score:'綜合指數',
    normalizedHelp:'各平台熱度先標準化，再跨平台加總；並非原始熱度數值相加。',
    scoreHelp:'榜位、持續時間與覆蓋來源組成的綜合指數。'},
  en: {heading:'Trending ranking',rank:'Rank',platforms:'platforms',peak:'Peak',hours:'sampled hours',normalized:'Cross-source index',score:'Trend index',
    normalizedHelp:'Source heat values are normalized within their original ranking before combining distinct platforms.',
    scoreHelp:'Composite index of ranking, duration and source evidence; not raw popularity.'},
  ja: {heading:'話題ランキング',rank:'順位',platforms:'媒体',peak:'最高',hours:'観測時間',normalized:'複数媒体指数',score:'総合指数',
    normalizedHelp:'各媒体の熱度を内部で正規化してから合算した指数です。',scoreHelp:'順位、観測時間、媒体数に基づく指数です。'},
  ko: {heading:'화제 순위',rank:'순위',platforms:'플랫폼',peak:'최고',hours:'관측 시간',normalized:'교차 플랫폼 지수',score:'종합 지수',
    normalizedHelp:'플랫폼별 수치를 정규화한 뒤 합산한 지수입니다.',scoreHelp:'순위, 관측 시간, 출처를 반영한 지수입니다.'},
})[props.locale] || {
  heading:'热议排行榜',rank:'第',platforms:'平台',peak:'最高',hours:'小时观测',normalized:'跨平台指数',score:'综合指数',
  normalizedHelp:'各平台内归一化后加权汇总，并非原始热度直接相加。',scoreHelp:'榜位与时长形成的综合指数。'
});
const formatScore = n => new Intl.NumberFormat(props.locale, { maximumFractionDigits: 1 }).format(n);
const platformEvidence = item => Array.isArray(item.evidenceSources)
  ? item.evidenceSources.slice(0,8).map(s => [s.sourceKey || s.sourceName || s.source, s.variant || ''].filter(Boolean).join(' / ')).join(' · ') : '';
</script>

<style scoped>
.event-hot-ranking{display:grid;gap:7px;min-width:0;align-content:start}
.event-hot-ranking__card{display:grid;grid-template-columns:24px minmax(0,1fr) auto;align-items:start;gap:9px;min-width:0;padding:11px 10px;
 border:1px solid var(--event-border);border-radius:9px;background:color-mix(in srgb,var(--event-surface) 96%,var(--n-text-color));transition:border-color .16s,background .16s}
.event-hot-ranking__card:hover{border-color:color-mix(in srgb,var(--n-primary-color) 40%,var(--event-border));background:var(--event-surface)}
.event-hot-ranking__place{font-size:16px;font-weight:800;line-height:1.45;color:var(--event-muted);font-variant-numeric:tabular-nums;text-align:center}
.event-hot-ranking__place[data-top="1"]{color:#cf7b13}.event-hot-ranking__place[data-top="2"]{color:#758598}.event-hot-ranking__place[data-top="3"]{color:#ae764b}
.event-hot-ranking__body{display:grid;gap:7px;min-width:0}
.event-hot-ranking__title{font-size:13px;line-height:1.55;font-weight:700;color:var(--n-text-color);text-decoration:none;overflow-wrap:anywhere;
 display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden}
.event-hot-ranking__title:hover,.event-hot-ranking__title:focus-visible{color:var(--n-primary-color)}
.event-hot-ranking__title:focus-visible{outline:2px solid var(--n-primary-color);outline-offset:3px}
.event-hot-ranking__arrow{font-size:11px;opacity:.58}
.event-hot-ranking__details{display:flex;flex-wrap:wrap;gap:3px 9px;font-size:10px;line-height:1.5;color:var(--event-muted)}
.event-hot-ranking__metric{display:grid;justify-items:end;align-content:start;min-width:0;gap:2px;padding-top:1px;font-variant-numeric:tabular-nums}
.event-hot-ranking__metric b{font-size:13px;line-height:1.4;color:var(--n-primary-color)}
.event-hot-ranking__metric small{max-width:72px;text-align:right;font-size:9px;line-height:1.35;color:var(--event-muted)}
@media(max-width:380px){.event-hot-ranking__card{gap:6px;padding:9px 7px;grid-template-columns:21px minmax(0,1fr) auto}.event-hot-ranking__metric small{max-width:57px}}
@media(prefers-reduced-motion:reduce){.event-hot-ranking__card{transition:none}}
</style>
