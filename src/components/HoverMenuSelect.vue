<template>
  <n-popover
    trigger="manual"
    :show="isOpen"
    :show-arrow="false"
    placement="bottom-start"
    :overlap="false"
    :style="{ ...themeStyle, padding: '5px', maxWidth: 'min(340px, calc(100vw - 24px))', borderRadius: '9px' }"
    @clickoutside="close"
  >
    <template #trigger>
      <button
        ref="triggerRef"
        type="button"
        class="hover-menu-select"
        :class="[{ 'is-open': isOpen }, variant && `is-${variant}`]"
        :title="activeLabel"
        :aria-label="ariaLabel || activeLabel"
        aria-haspopup="listbox"
        :aria-expanded="isOpen"
        :aria-controls="isOpen ? menuId : undefined"
        @pointerenter="onTriggerEnter"
        @pointerleave="onTriggerLeave"
        @click="toggle($event)"
        @keydown.down.prevent="openByKeyboard(1)"
        @keydown.up.prevent="openByKeyboard(-1)"
        @keydown.esc.prevent="close"
      >
        <img v-if="variant === 'model' && activeIcon" class="hover-menu-select__logo" :src="activeIcon" alt="" loading="lazy" @error="fallbackLogo" /><span class="hover-menu-select__text">{{ activeLabel }}</span>
        <svg class="hover-menu-select__chevron" :class="{ 'is-open': isOpen }" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path d="m4 6 4 4 4-4" />
        </svg>
      </button>
    </template>
    <div
      v-if="isOpen"
      :id="menuId"
      ref="menuRef"
      class="hover-menu-select__menu"
      role="listbox"
      :aria-label="ariaLabel || activeLabel"
      @pointerenter="onMenuEnter"
      @pointerleave="onMenuLeave"
      @focusin="cancelClose"
      @focusout="onMenuFocusOut"
      @keydown="onMenuKeydown"
    >
      <button
        v-for="(option, index) in options"
        :key="option.value"
        type="button"
        class="hover-menu-select__option"
        :class="{ 'is-selected': option.value === modelValue }"
        role="option"
        :aria-selected="option.value === modelValue"
        :disabled="Boolean(option.disabled)"
        :tabindex="index === focusedIndex ? 0 : -1"
        @click="select(option)"
      >
        <img v-if="variant === 'model' && option.icon" class="hover-menu-select__logo" :src="option.icon" alt="" loading="lazy" @error="fallbackLogo" /><span class="hover-menu-select__option-text">{{ option.label }}</span>
        <svg v-if="option.value === modelValue" class="hover-menu-select__check" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m3.5 8.5 3 3 6-7" /></svg>
      </button>
    </div>
  </n-popover>
</template>

<script setup>
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { HOVER_MENU_OPEN_EVENT, announceHoverMenuOpen } from '@/utils/hoverMenu';
import {getSourceLogoFallback} from '@/utils/sourceLogos';

const props = defineProps({
  modelValue: { type: [String, Number], required: true },
  options: { type: Array, default: () => [] },
  ariaLabel: { type: String, default: '' },
  variant: { type: String, default: '' },
  themeStyle: { type: Object, default: () => ({}) },
});
const emit = defineEmits(['update:modelValue']);
const uid = getCurrentInstance().uid;
const menuId = `hover-menu-select-${uid}`;
const triggerRef = ref(null);
const menuRef = ref(null);
const isOpen = ref(false);
const hoverCapable = ref(false);
const focusedIndex = ref(-1);
const activeLabel = computed(() => String(props.options.find(item => item.value === props.modelValue)?.label || props.modelValue || ''));
const activeIcon = computed(() => props.options.find(item => item.value === props.modelValue)?.icon || '');
const fallbackLogo = event => { const fallback=getSourceLogoFallback(); if(event.target.src!==new URL(fallback,location.href).href) event.target.src=fallback; };
const availableIndices = computed(() => props.options.flatMap((option, index) => option.disabled ? [] : [index]));
let enterTimer;
let leaveTimer;
let hoverMediaQuery;
let pointerInside = false;
const cancelEnter = () => { clearTimeout(enterTimer); enterTimer = undefined; };
const cancelClose = () => { clearTimeout(leaveTimer); leaveTimer = undefined; };
const close = () => { cancelEnter(); cancelClose(); isOpen.value = false; focusedIndex.value = -1; };
const open = () => {
  if (!props.options.length) return;
  cancelEnter(); cancelClose();
  if (isOpen.value) return;
  isOpen.value = true;
  announceHoverMenuOpen(menuId);
};
const scheduleClose = () => {
  cancelClose();
  leaveTimer = setTimeout(() => { if (!pointerInside && !menuRef.value?.contains(document.activeElement)) close(); }, 170);
};
const canHover = event => event.pointerType === 'mouse' && hoverCapable.value;
const onTriggerEnter = event => {
  if (!canHover(event)) return;
  pointerInside = true;
  cancelClose();
  if (!isOpen.value) {
    cancelEnter();
    enterTimer = setTimeout(open, 130);
  }
};
const onTriggerLeave = event => {
  if (!canHover(event)) return;
  pointerInside = false;
  cancelEnter();
  scheduleClose();
};
const onMenuEnter = event => { if (canHover(event)) { pointerInside = true; cancelClose(); } };
const onMenuLeave = event => { if (canHover(event)) { pointerInside = false; scheduleClose(); } };
const toggle = event => {
  if (isOpen.value) { close(); return; }
  open();
  // Native keyboard activation of a button has detail=0. Move focus to the
  // listbox when activated by Enter/Space, without stealing mouse focus.
  if (event?.detail === 0) {
    const selected = availableIndices.value.includes(props.options.findIndex(option => option.value === props.modelValue))
      ? props.options.findIndex(option => option.value === props.modelValue)
      : availableIndices.value[0];
    if (selected !== undefined) void focusOption(selected);
  }
};
const focusOption = async index => {
  if (!availableIndices.value.length) return;
  focusedIndex.value = index;
  await nextTick();
  menuRef.value?.querySelectorAll('.hover-menu-select__option')[index]?.focus({ preventScroll: true });
};
const openByKeyboard = async delta => {
  open();
  const current = props.options.findIndex(option => option.value === props.modelValue);
  const positions = availableIndices.value;
  const at = positions.indexOf(current);
  await focusOption(positions[(at < 0 ? (delta > 0 ? 0 : positions.length - 1) : at + delta + positions.length) % positions.length]);
};
const moveTabFromMenu = backwards => {
  // The popover is teleported to <body>; native Tab from its option would
  // otherwise jump to the end of the page instead of the next card control.
  const focusables = [...document.querySelectorAll(
    'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
  )].filter(el => el.tabIndex >= 0 && !el.closest('.hover-menu-select__menu') &&
    el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden');
  const at = focusables.indexOf(triggerRef.value);
  const target = at >= 0 ? focusables[at + (backwards ? -1 : 1)] : null;
  close();
  (target || triggerRef.value)?.focus({ preventScroll: true });
};
const onMenuKeydown = event => {
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    close();
    triggerRef.value?.focus({ preventScroll: true });
    return;
  }
  if (event.key === 'Tab') { event.preventDefault(); moveTabFromMenu(event.shiftKey); return; }
  const positions = availableIndices.value;
  if (!positions.length) return;
  let next;
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    const index = positions.indexOf(focusedIndex.value);
    const step = event.key === 'ArrowDown' ? 1 : -1;
    next = positions[(index + step + positions.length) % positions.length];
  } else if (event.key === 'Home') next = positions[0];
  else if (event.key === 'End') next = positions[positions.length - 1];
  if (next !== undefined) { event.preventDefault(); void focusOption(next); }
};
const onMenuFocusOut = event => {
  if (!menuRef.value?.contains(event.relatedTarget) && event.relatedTarget !== triggerRef.value) close();
};
const select = option => {
  if (option.disabled) return;
  emit('update:modelValue', option.value);
  close();
  triggerRef.value?.focus({ preventScroll: true });
};
const onOtherMenu = event => { if (event.detail?.id !== menuId) close(); };
const onPointerCapability = event => { hoverCapable.value = Boolean(event.matches); if (!hoverCapable.value) cancelEnter(); };
onMounted(() => {
  hoverMediaQuery = matchMedia('(hover: hover) and (pointer: fine)');
  onPointerCapability(hoverMediaQuery);
  hoverMediaQuery.addEventListener?.('change', onPointerCapability);
  window.addEventListener(HOVER_MENU_OPEN_EVENT, onOtherMenu);
});
onBeforeUnmount(() => {
  close();
  hoverMediaQuery?.removeEventListener?.('change', onPointerCapability);
  window.removeEventListener(HOVER_MENU_OPEN_EVENT, onOtherMenu);
});
watch(() => props.modelValue, close);
</script>

<style scoped>
.hover-menu-select{display:inline-flex;align-items:center;justify-content:flex-start;gap:5px;box-sizing:border-box;min-width:0;max-width:100%;min-height:36px;padding:4px 5px;border:0;border-radius:5px;background:transparent;color:inherit;font:inherit;cursor:pointer;text-align:left;vertical-align:middle}
.hover-menu-select__text{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.4;font-weight:inherit}
.hover-menu-select__chevron{display:block;width:12px;height:12px;flex:0 0 12px;align-self:center;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;opacity:.7;transform-origin:50% 50%;transition:transform .14s ease}
.hover-menu-select__chevron.is-open{transform:rotate(180deg)}
.hover-menu-select:hover,.hover-menu-select.is-open{background:color-mix(in srgb,currentColor 6%,transparent)}
.hover-menu-select:focus-visible{outline:2px solid var(--ai-action,var(--n-primary-color,#ea444d));outline-offset:1px}
.hover-menu-select__menu{min-width:min(160px,calc(100vw - 40px));max-width:min(328px,calc(100vw - 36px));max-height:min(52dvh,420px);overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin}
.hover-menu-select__option{display:flex;align-items:center;justify-content:space-between;gap:12px;box-sizing:border-box;width:100%;min-height:36px;padding:7px 9px;border:0;border-radius:6px;background:transparent;color:var(--n-text-color,var(--ai-text,#222));font:inherit;font-size:12px;cursor:pointer;text-align:left}
.hover-menu-select__option-text{min-width:0;flex:1;overflow-wrap:anywhere;line-height:1.4}
.hover-menu-select__logo{display:block;width:17px;height:17px;flex:0 0 17px;object-fit:contain;border-radius:3px}
.hover-menu-select__option:has(.model-ranking-icon){justify-content:flex-start;gap:8px}
.hover-menu-select__check{display:block;width:14px;height:14px;flex:none;fill:none;stroke:var(--n-primary-color,var(--ai-action,#d03050));stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.hover-menu-select__option.is-selected{color:var(--n-primary-color,var(--ai-action,#d03050));font-weight:700;background:color-mix(in srgb,var(--n-primary-color,var(--ai-action,#d03050)) 8%,transparent)}
.hover-menu-select__option:hover:not(:disabled),.hover-menu-select__option:focus-visible{background:var(--n-option-color-pending,rgba(127,127,127,.11));outline:2px solid transparent}
.hover-menu-select__option:focus-visible{outline:2px solid var(--n-primary-color,var(--ai-action,#d03050));outline-offset:-2px}
.hover-menu-select__option:disabled{opacity:.38;cursor:not-allowed}
@media(pointer:coarse){.hover-menu-select{min-height:44px}.hover-menu-select__option{min-height:44px}}
@media(prefers-reduced-motion:reduce){.hover-menu-select__chevron{transition:none}}
</style>
