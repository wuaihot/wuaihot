<template>
  <section ref="favoriteRoot" class="ranking-favorites" tabindex="-1" :style="themeStyle" :aria-label="copy.saved">
    <div class="ranking-favorites__heading"><strong>{{ copy.saved }}</strong><button v-if="favorites.length > 1" type="button" :aria-pressed="organizing" @click="organizing = !organizing">{{ organizing ? copy.done : copy.sort }}</button></div>
    <div v-if="favorites.length" class="ranking-favorites__items">
      <div v-for="(node, index) in favorites" :key="node.id" class="ranking-favorites__item">
        <router-link :to="nodeLocation(node)" :title="titleFor(node)" @click="follow($event, node)">
          <img v-if="node.sourceName" :src="getSourceLogo(node.sourceName)" alt="" @error="logoError" />
          <span v-else class="ranking-favorites__symbol" aria-hidden="true">☆</span>
          <span>{{ labelFor(node) }}</span>
        </router-link>
        <button type="button" class="ranking-favorites__remove" :aria-label="copy.remove + ' ' + titleFor(node)" :title="copy.remove" @click="manage($event, () => toggleFavorite(node.id))">★</button>
        <div v-if="organizing" class="ranking-favorites__order">
          <button type="button" :disabled="index === 0" :aria-label="copy.up + ' ' + titleFor(node)" @click="manage($event, () => moveFavorite(node.id, -1))">←</button>
          <button type="button" :disabled="index === favorites.length - 1" :aria-label="copy.down + ' ' + titleFor(node)" @click="manage($event, () => moveFavorite(node.id, 1))">→</button>
        </div>
      </div>
    </div>
    <p v-else class="ranking-favorites__empty">{{ copy.empty }}</p>
  </section>
</template>
<script setup>
import { computed, nextTick, ref } from 'vue';
import { useThemeVars } from 'naive-ui';
import { useRankingNavigation } from '@/composables/useRankingNavigation';
import { getSourceLogo, getSourceLogoFallback } from '@/utils/sourceLogos';
import { getSourceDisplayLabel } from '@/utils/sourceLabels';
const { locale, favorites, nodeLocation, navigate, toggleFavorite, moveFavorite } = useRankingNavigation();
const emit = defineEmits(['navigate']);
const organizing = ref(false), favoriteRoot = ref(null);
// Keep focus inside the host panel while keyed chips move or disappear.
const manage = async (event, action) => {
 const trigger = event.currentTarget, focused = document.activeElement === trigger;
 if (focused) favoriteRoot.value?.focus({ preventScroll: true });
 action();
 await nextTick();
 if (!focused) return;
 const target = trigger.isConnected && !trigger.disabled ? trigger : favoriteRoot.value?.querySelector('.ranking-favorites__remove');
 target?.focus({ preventScroll: true });
};
const theme = useThemeVars();
const themeStyle = computed(() => ({ '--fav-text': theme.value.textColor2, '--fav-muted': theme.value.textColor3, '--fav-border': theme.value.borderColor, '--fav-hover': theme.value.hoverColor, '--fav-primary': theme.value.primaryColor }));
const labels = {
 'zh-CN': ['常用', '整理', '完成', '取消收藏', '暂无常用，可点击平台旁的星标添加。', '上移', '下移'],
 'zh-TW': ['常用', '整理', '完成', '取消收藏', '暫無常用，可點擊平台旁的星標新增。', '上移', '下移'],
 en: ['Favorites', 'Arrange', 'Done', 'Unsave', 'Use the star beside a source to save it.', 'Move earlier', 'Move later'],
 ja: ['お気に入り', '並べ替え', '完了', '保存を解除', '情報源の星で保存できます。', '前へ', '後へ'],
 ko: ['즐겨찾기', '정렬', '완료', '저장 해제', '출처 옆의 별표로 저장할 수 있습니다.', '앞으로', '뒤로'],
};
const copy = computed(() => Object.fromEntries(['saved','sort','done','remove','empty','up','down'].map((key,i)=>[key,(labels[locale.value] || labels.en)[i]])));
const labelFor = node => node.kind === 'rank' ? getSourceDisplayLabel(node.sourceName, locale.value) + ' · ' + node.label : node.label;
const titleFor = node => labelFor(node);
const logoError = event => { event.target.src = getSourceLogoFallback(); };
const follow = (event, node) => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return; event.preventDefault(); navigate(node); emit('navigate'); };
</script>
<style scoped>
.ranking-favorites { color: var(--fav-text); min-width: 0; font-size: 12px; }
.ranking-favorites__heading { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:7px; }
.ranking-favorites__heading strong { font-size:12px; font-weight:500; color:var(--fav-muted); }
.ranking-favorites button { border:0; border-radius:4px; background:transparent; color:inherit; font:inherit; cursor:pointer; }
.ranking-favorites__heading button { padding:5px; color:var(--fav-muted); }
.ranking-favorites__items { display:flex; flex-wrap:wrap; gap:6px; }
.ranking-favorites__item { display:flex; align-items:center; max-width:100%; border:1px solid var(--fav-border); border-radius:6px; }
.ranking-favorites__item a { display:flex; align-items:center; gap:5px; min-width:0; padding:6px 4px 6px 7px; text-decoration:none; color:inherit; }
.ranking-favorites__item a span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ranking-favorites__item img { width:16px; height:16px; flex:0 0 16px; border-radius:3px; object-fit:contain; }
.ranking-favorites__remove { color:var(--fav-primary) !important; align-self:stretch; min-width:27px; }
.ranking-favorites__order { display:flex; }
.ranking-favorites__order button { min-width:25px; align-self:stretch; }
.ranking-favorites button:disabled { opacity:.3; cursor:default; }
.ranking-favorites a:hover, .ranking-favorites button:hover:not(:disabled) { background:var(--fav-hover); }
.ranking-favorites a:focus-visible, .ranking-favorites button:focus-visible { outline:2px solid var(--fav-primary); outline-offset:-2px; }
.ranking-favorites__empty { margin:0; color:var(--fav-muted); font-size:12px; }
@media (max-width:1099px), (pointer:coarse) {
 .ranking-favorites__item a, .ranking-favorites__remove, .ranking-favorites__order button, .ranking-favorites__heading button { min-height:44px; box-sizing:border-box; }
 .ranking-favorites__remove, .ranking-favorites__order button { min-width:44px; }
}
</style>
