<template>
  <li class="ranking-nav-node" :class="{ 'is-active': active }">
    <div class="ranking-nav-row" :data-current="active ? 'true' : undefined">
      <button v-if="node.children?.length" class="ranking-nav-toggle" type="button" :aria-label="`${expanded ? copy.collapse : copy.expand} ${node.label}`" :aria-expanded="expanded" @click="toggle">
        <svg viewBox="0 0 16 16" aria-hidden="true" :class="{ expanded }"><path d="m6 3 5 5-5 5" /></svg>
      </button>
      <span v-else class="ranking-nav-spacer" aria-hidden="true"></span>
      <a v-if="node.directoryOnly && node.externalUrl" :href="node.externalUrl" target="_blank" rel="noopener noreferrer" class="ranking-nav-link" :title="node.label">
        <img :src="getSourceLogo(node.sourceName)" alt="" loading="lazy" @error="handleLogoError" />
        <span>{{ node.label }}</span><small aria-hidden="true">↗</small>
      </a>
      <router-link v-else :to="nodeLocation(node)" class="ranking-nav-link" :aria-current="active ? 'page' : undefined" :title="node.label" @click="follow">
        <img v-if="node.kind === 'source'" :src="getSourceLogo(node.sourceName)" alt="" loading="lazy" @error="handleLogoError" />
        <span>{{ node.label }}</span>
        <small v-if="node.kind === 'category'" aria-hidden="true">{{ sourceCount }}</small>
      </router-link>
      <button v-if="!node.directoryOnly" class="ranking-nav-favorite" type="button" :aria-label="`${isFavorite(node.id) ? copy.unpin : copy.pin} ${node.label}`" :aria-pressed="isFavorite(node.id)" @click="toggleFavorite(node.id)">
        <svg viewBox="0 0 18 18" aria-hidden="true"><path d="m9 2 2.1 4.3 4.7.7-3.4 3.3.8 4.7L9 12.8l-4.2 2.2.8-4.7L2.2 7l4.7-.7Z" /></svg>
      </button>
    </div>
    <ul v-if="node.children?.length && expanded" class="ranking-nav-children">
      <RankingNavigationNode v-for="child in node.children" :key="child.id" :node="child" :copy="copy" :force-expanded="forceExpanded" />
    </ul>
  </li>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useRankingNavigation } from '@/composables/useRankingNavigation';
import { getSourceLogo, getSourceLogoFallback } from '@/utils/sourceLogos';
const handleLogoError = event => { if (event.target) { event.target.onerror = null; event.target.src = getSourceLogoFallback(); } };
const props = defineProps({ node: { type: Object, required: true }, copy: { type: Object, required: true }, forceExpanded: Boolean });
const { preferences, scope, sourceName, variant, isList, currentNavigationPath, nodeLocation, navigate, isFavorite, toggleFavorite } = useRankingNavigation();
const route = useRoute();
const expanded = computed(() => props.forceExpanded || preferences.expanded[props.node.id] === true);
const active = computed(() => {
  const node = props.node;
  if (node.path) return route.path === node.path || node.eventIds?.includes(String(route.params.eventSlug || ''));
  if (node.kind === 'category') return scope.value === node.scope && !isList.value;
  const parentSource = currentNavigationPath.value.find(item => item.kind === 'source');
  return isList.value && node.scope === parentSource?.scope && sourceName.value === node.sourceName && (node.kind === 'source' || variant.value === String(node.variant || ''));
});
const sourceCount = computed(() => {
  const names = new Set();
  const visit = node => { if (node.sourceName) names.add(node.sourceName); else node.children?.forEach(visit); };
  props.node.children?.forEach(visit);
  return names.size || '';
});
const toggle = () => { preferences.expanded[props.node.id] = !expanded.value; };
const follow = event => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
  event.preventDefault();
  navigate(props.node);
};
</script>
