<template>
  <span v-if="platforms.length" class="event-watch-links" :class="{ 'is-replay': kind === 'replay' }">
    <a v-for="platform in platforms" :key="platform.id || platform.url" :href="platform.url" target="_blank" rel="noopener noreferrer" :title="platform.displayLabel" :aria-label="`${name(platform)} · ${platform.displayLabel}`">
      <img v-if="logo(platform)" :src="logo(platform)" alt="" width="16" height="16" />
      <span>{{ name(platform) }}</span>
    </a>
  </span>
</template>
<script setup>
import { computed } from "vue";
import { eventResourceKey, eventResourceLogo } from "@/utils/eventResourceLinks";
const props = defineProps({
  platforms: { type: Array, default: () => [] },
  locale: { type: String, default: "zh-CN" },
  kind: { type: String, default: "live", validator: value => ["live", "replay"].includes(value) },
});
const copy = computed(() => ({
  "zh-CN": { live: "直播地址：", replay: "回放地址：", findReplay: "查找回放：", bilibili: "B站", huya: "虎牙" },
  "zh-TW": { live: "直播網址：", replay: "回放網址：", findReplay: "查找回放：", bilibili: "B站", huya: "虎牙" },
  en: { live: "Watch:", replay: "Replay:", findReplay: "Find replay:", bilibili: "Bilibili", huya: "Huya" },
  ja: { live: "配信：", replay: "リプレイ：", findReplay: "リプレイを探す：", bilibili: "Bilibili", huya: "Huya" },
  ko: { live: "라이브:", replay: "다시보기:", findReplay: "다시보기 찾기:", bilibili: "Bilibili", huya: "Huya" },
}[props.locale] || { live: "Watch:", replay: "Replay:", findReplay: "Find replay:", bilibili: "Bilibili", huya: "Huya" }));
const platformKey = platform => eventResourceKey(platform.url);
const name = platform => {
  const key = platformKey(platform);
  const base = copy.value[key] || (key === "lol" ? "LoL Esports" : platform.displayLabel);
  if (!["huya","bilibili","lol"].includes(key)) return base;
  const suffix = ({
    "zh-CN":{live:"直播间",replay:"回放",list:"回放列表"},
    "zh-TW":{live:"直播間",replay:"回放",list:"回放列表"},
    en:{live:" live",replay:" replay",list:" replays"},
    ja:{live:" ライブ",replay:" リプレイ",list:" リプレイ一覧"},
    ko:{live:" 라이브",replay:" 다시보기",list:" 다시보기 목록"},
  }[props.locale] || {live:" live",replay:" replay",list:" replays"});
  return base + suffix[props.kind === "replay" ? (platform.fallback ? "list" : "replay") : "live"];
};
const logo = platform => eventResourceLogo(platform.url);
</script>
<style scoped>
.event-watch-links { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; font-size: 12px; }
.event-watch-links a { display: inline-flex; align-items: center; gap: 5px; min-height: 32px; color: inherit; text-decoration: none; border-radius: 4px; }
.event-watch-links a img { display: block; flex: 0 0 auto; object-fit: contain; }
.event-watch-links a:hover { text-decoration: underline; text-underline-offset: 3px; }
.event-watch-links a:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
@media(max-width:680px) { .event-watch-links a { min-height: 44px; } }
</style>
