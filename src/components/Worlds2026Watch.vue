<template>
  <div ref="menuRoot" class="worlds-watch-menu" @mouseenter="hovered = true" @mouseleave="hovered = false" @keydown.esc.stop="expanded = false; hovered = false">
    <button type="button" class="ww-trigger" :aria-expanded="menuOpen" aria-controls="worlds-watch-channels" @click="expanded = !expanded">
      <span class="ww-live-dot" aria-hidden="true"></span>
      <span>{{ copy.title }}</span>
      <DisclosureChevron class="ww-chevron" :expanded="menuOpen" />
    </button>
    <div v-show="menuOpen" id="worlds-watch-channels" class="ww-panel">
      <div class="ww-heading">
        <strong>{{ copy.heading }}</strong>
        <small>{{ copy.description }}</small>
      </div>
      <div class="ww-featured">
        <a v-for="item in featured" :key="item.key" :href="item.url" target="_blank"
           rel="nofollow noopener noreferrer" :title="item.hint">
          <span class="ww-platform"><img :src="channelLogo(item)" alt="" width="20" height="20" loading="lazy" /><strong>{{ item.label }}</strong></span><span aria-hidden="true">↗</span>
          <small>{{ item.hint }}</small>
        </a>
      </div>
      <div v-if="secondary.length" class="ww-extra-links" :aria-label="copy.more">
        <a v-for="item in secondary" :key="item.key" :href="item.url" target="_blank"
           rel="nofollow noopener noreferrer" :title="item.hint">
          <span class="ww-platform"><img :src="channelLogo(item)" alt="" width="20" height="20" loading="lazy" /><span><b>{{ item.label }}</b><small>{{ item.hint }}</small></span></span><span aria-hidden="true">↗</span>
        </a>
      </div>
      <p class="ww-disclaimer">{{ copy.disclaimer }}</p>
    </div>
  </div>
</template>
<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import DisclosureChevron from './ui/DisclosureChevron.vue';
const hovered = ref(false);
const expanded = ref(false);
const menuRoot = ref(null);
const menuOpen = computed(() => hovered.value || expanded.value);
const closeOnOutside = (event) => { if (!menuRoot.value?.contains(event.target)) { expanded.value = false; hovered.value = false; } };
onMounted(() => document.addEventListener('pointerdown', closeOnOutside));
onBeforeUnmount(() => document.removeEventListener('pointerdown', closeOnOutside));
const props = defineProps({ locale: { type: String, default: 'zh-CN' } });
const messages = {
  'zh-CN': {
    title: '在线观赛', heading: '官方授权观赛平台',
    description: '选择平台观看赛事直播或回放。',
    more: '更多观赛平台', disclaimer: '官方授权不代表该频道当前开播。直播、回放和地区可用性以平台实时信息为准。',
  },
  'zh-TW': {
    title: '線上觀賽', heading: '賽事轉播平台',
    description: '依偏好的平台選擇直播與回放。',
    more: '更多平台', disclaimer: '直播與回放依地區及場次授權而異。',
  },
  en: {
    title: 'Watch live', heading: 'Official viewing channels',
    description: 'Select a broadcast or replay platform.',
    more: 'More channels', disclaimer: 'Broadcasts and VODs depend on regional rights and match availability.',
  },
  ja: {
    title: '試合を視聴', heading: '公式配信チャンネル',
    description: '配信・アーカイブを選択してください。',
    more: 'その他のチャンネル', disclaimer: '配信は地域・試合によって異なります。',
  },
  ko: {
    title: '경기 시청', heading: '공식 중계 채널',
    description: '생방송 또는 다시보기를 선택하세요.',
    more: '다른 채널', disclaimer: '중계 및 VOD는 지역과 경기별 권리에 따라 다릅니다.',
  },
};
const channels = {
  'zh-CN': [
    { key: 'bili', label: '哔哩哔哩', url: 'https://live.bilibili.com/6', hint: '英雄联盟赛事直播频道' },
    { key: 'huya', label: '虎牙直播', url: 'https://www.huya.com/lpl', hint: '英雄联盟赛事官方频道' },
    { key: 'bili-match', label: 'B站赛事中心', url: 'https://www.bilibili.com/match/game?gid=2', hint: '赛事资料、回放与赛程' },
    { key: 'tencent-video', label: '腾讯视频', url: 'https://v.qq.com/', hint: '官方授权渠道 · 站内搜索世界赛' },
    { key: 'tencent-sports', label: '腾讯体育', url: 'https://sports.qq.com/', hint: '官方授权渠道 · 站内搜索世界赛' },
    { key: 'weibo', label: '新浪微博', url: 'https://weibo.com/', hint: '官方授权渠道 · 站内搜索赛事' },
    { key: 'wechat', label: '微信视频号', url: 'https://channels.weixin.qq.com/', hint: '请在微信内搜索赛事直播' },
  ],
  'zh-TW': [
    { key: 'twitch-tw', label: 'Twitch 繁中', url: 'https://www.twitch.tv/lolesportstw', hint: '繁體中文電競頻道' },
    { key: 'youtube-tw', label: 'YouTube 繁中', url: 'https://www.youtube.com/@lolesportstw', hint: '賽事影片與直播' },
  ],
  en: [
    { key: 'youtube', label: 'YouTube', url: 'https://www.youtube.com/@lolesports', hint: 'LoL Esports official channel' },
    { key: 'twitch', label: 'Twitch', url: 'https://www.twitch.tv/riotgames', hint: 'Riot Games broadcasts' },
  ],
  ja: [
    { key: 'twitch-jp', label: 'Riot Games JP', url: 'https://www.twitch.tv/riotgamesjp', hint: '日本語公式チャンネル' },
    { key: 'youtube', label: 'LoL Esports', url: 'https://www.youtube.com/@lolesports', hint: '大会公式チャンネル' },
  ],
  ko: [
    { key: 'lck', label: 'LCK Global', url: 'https://www.youtube.com/@LCKglobal', hint: '공식 LCK 채널 · 월즈 생중계 여부 확인' },
    { key: 'youtube', label: 'LoL Esports', url: 'https://www.youtube.com/@lolesports', hint: '공식 국제 채널' },
  ],
};
const channelIcons = Object.freeze({
  bili:'/logo/bilibili.png','bili-match':'/logo/bilibili.png',huya:'/logo/platforms/huya-video-rankings.png',
  'tencent-video':'/logo/platforms/tencent.png','tencent-sports':'/logo/platforms/tencent.png',
  weibo:'/logo/weibo.png',wechat:'/logo/watch/wechat.svg',
  youtube:'/logo/watch/youtube.svg','youtube-tw':'/logo/watch/youtube.svg',lck:'/logo/watch/youtube.svg',
  twitch:'/logo/watch/twitch.svg','twitch-tw':'/logo/watch/twitch.svg','twitch-jp':'/logo/watch/twitch.svg',
});
const channelLogo = item => channelIcons[item.key] || '/logo/lol-esports-mark.png';
const copy = computed(() => messages[props.locale] || messages.en);
const platformList = computed(() => channels[props.locale] || channels.en);
const featured = computed(() => platformList.value.slice(0, 2));
const secondary = computed(() => platformList.value.slice(2));
</script>
<style scoped>
.worlds-watch-menu { position:relative; flex:0 0 auto; margin-left:auto; z-index:20; font:inherit; color:inherit; }
.worlds-watch-menu>.ww-trigger { font-family:inherit; display:inline-flex; align-items:center; justify-content:center; gap:9px; min-height:38px; padding:0 14px; border:1px solid #bda06480; border-radius:8px; color:#fff5d6; background:#99804430; font-size:12px; font-weight:750; cursor:pointer; list-style:none; white-space:nowrap; }

.worlds-watch-menu>.ww-trigger:hover,.worlds-watch-menu>.ww-trigger[aria-expanded="true"] { border-color:#c9a96d; background:#99804455; }
.worlds-watch-menu button:focus-visible,.ww-panel a:focus-visible { outline:2px solid #d4b36e; outline-offset:3px; }
.ww-live-dot { width:7px; height:7px; flex:none; border-radius:50%; background:#d4b36e; }
.ww-chevron { width:12px; height:12px; flex:none; }
.ww-panel { display:grid; position:absolute; right:0; top:100%; z-index:50; width:min(358px,calc(100vw - 40px)); max-height:min(550px,75vh); overflow-y:auto; box-sizing:border-box; padding:14px; border:1px solid #bda06480; border-radius:12px; background:#101b28; color:#edf2f5;  }
.worlds-watch-menu>.ww-panel { gap:12px; }
.ww-heading { display:grid; gap:5px; }
.ww-heading strong { font-size:13px; }
.ww-heading small,.ww-disclaimer { color:#b6c6cd; font-size:11px; line-height:1.6; }
.ww-featured { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
.ww-featured a { display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:center; gap:5px; padding:11px; border:1px solid #53677a; border-radius:8px; color:#f4f7f7; text-decoration:none; }
.ww-featured a:hover,.ww-extra-links a:hover { border-color:#c9a96d; background:#c9a96d17; }
.ww-featured strong { font-size:12px;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
.ww-platform{display:flex;align-items:center;gap:9px;min-width:0}
.ww-platform img{width:20px;height:20px;flex:none;object-fit:contain}
.ww-platform>span{min-width:0;display:grid;gap:3px}
.ww-featured small { grid-column:1 / -1; color:#b6c6cd; font-size:10px; line-height:1.4; }
.ww-extra-links { display:grid; gap:3px; padding-top:9px; border-top:1px solid #465465; }
.ww-extra-links a { display:flex; justify-content:space-between; align-items:center; gap:12px; padding:8px; border:1px solid transparent; border-radius:6px; color:inherit; text-decoration:none; }
.ww-extra-links a>span:first-child { display:flex;align-items:center;gap:10px;min-width:0; }
.ww-extra-links b { font-size:12px; }
.ww-extra-links small { font-size:10px; color:#b6c6cd; }
.ww-disclaimer { margin:0; padding-top:8px; border-top:1px solid #465465; }

@media(max-width:600px) { .worlds-watch-menu>.ww-trigger { min-height:42px; } .ww-panel { position:fixed; inset:auto 12px max(12px,env(safe-area-inset-bottom)); width:auto; max-height:min(70dvh,520px); overflow-y:auto; overscroll-behavior:contain; box-shadow:0 14px 40px #0009; } }
@media(prefers-reduced-motion:reduce) { .ww-chevron { transition:none; } }
</style>
