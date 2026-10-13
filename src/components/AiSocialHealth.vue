<template>
  <n-popover v-if="payload" trigger="click" placement="bottom-end">
    <template #trigger><button type="button" class="ai-social-health" :class="{ degraded: healthy.length!==feeds.length }">{{ zh?'自动追踪':'Auto tracking' }} · {{ healthy.length }}/{{ feeds.length }} <span>{{ zh?'每 5 分钟':'Every 5 min' }}</span></button></template>
    <div class="ai-social-health-detail">
      <p>{{ zh?'公开原帖采集，AI 辅助提炼。采集时间不是发布时间。':'Public posts with AI-assisted summaries. Collection time is not publication time.' }}</p>
      <ul><li v-for="feed in feeds" :key="feed.source"><strong>{{ feed.label }}</strong><span>{{ isHealthy(feed)?(zh?'正常':'Healthy'):(zh?'过期 / 采集故障':'Stale / unavailable') }}</span><time v-if="feed.lastSuccessfulAt">{{ zh?'最近成功采集':'Last successful collection' }}：{{ time(feed.lastSuccessfulAt) }}</time><span v-if="feed.pendingCount">{{ zh?'等待 AI 处理':'Awaiting AI processing' }}：{{ feed.pendingCount }}</span></li></ul>
      <p>{{ zh?'主机离线时更新会延迟；超过 30 分钟未成功采集，相关消息退出精华看板。':'Updates may be delayed while the collector is offline. After 30 minutes without successful collection, these posts leave highlights.' }}</p>
    </div>
  </n-popover>
</template>
<script setup>
import {computed,ref,onMounted,onBeforeUnmount} from 'vue';
const props=defineProps({payload:Object,locale:{type:String,default:'zh-CN'}});
const zh=computed(()=>props.locale.startsWith('zh')),clock=ref(Date.now());let timer;
onMounted(()=>{timer=setInterval(()=>clock.value=Date.now(),60000);});onBeforeUnmount(()=>clearInterval(timer));
const feeds=computed(()=>props.payload?.feeds||[]);
const isHealthy=feed=>feed.status==='ok'&&!feed.stale&&Number.isFinite(Date.parse(feed.lastSuccessfulAt))&&clock.value-Date.parse(feed.lastSuccessfulAt)<=1800000;
const healthy=computed(()=>feeds.value.filter(isHealthy));
const time=value=>new Date(value).toLocaleString(props.locale);
</script>
<style scoped>
.ai-social-health{display:inline-flex;align-items:center;gap:5px;cursor:pointer;border:0;background:transparent;color:var(--ranking-stream-muted,#64748b);font:inherit;font-size:11px;padding:4px 0}.ai-social-health span{opacity:.75}.ai-social-health.degraded{color:#b7791f}.ai-social-health:focus-visible{outline:2px solid currentColor;outline-offset:3px}.ai-social-health-detail{max-width:min(340px,80vw);font-size:12px;line-height:1.6}.ai-social-health-detail p{margin:4px 0;color:var(--n-text-color)}.ai-social-health-detail ul{list-style:none;padding:0;margin:10px 0}.ai-social-health-detail li{display:flex;flex-wrap:wrap;gap:4px 10px;padding:6px 0}.ai-social-health-detail time{flex-basis:100%;opacity:.75}.ai-social-health-detail li span{margin-left:auto}
</style>
