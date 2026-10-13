<template>
  <span class="native-select-shell">
    <slot />
    <svg class="native-select-shell__chevron" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="m4 6 4 4 4-4" />
    </svg>
  </span>
</template>

<!--
  Decorative shell for an unchanged native <select>. The select remains the
  keyboard, accessibility, touch and value owner. We only replace browser-
  specific arrow painting and lay out the icon geometrically with CSS grid.
  Do not bind hover events or create another listbox in this component.
-->
<style scoped>
.native-select-shell {
  display: inline-grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  box-sizing: border-box;
  min-width: 0;
  max-width: 100%;
  vertical-align: middle;
  color: inherit;
}
.native-select-shell :deep(select) {
  grid-column: 1 / -1;
  grid-row: 1;
  box-sizing: border-box;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  padding-inline-end: 34px;
  appearance: none;
  -webkit-appearance: none;
  text-overflow: ellipsis;
  cursor: pointer;
}
.native-select-shell :deep(select::-ms-expand) { display: none; }
.native-select-shell__chevron {
  display: block;
  grid-column: 2;
  grid-row: 1;
  justify-self: end;
  width: 12px;
  height: 12px;
  margin-inline-end: 10px;
  pointer-events: none;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.native-select-shell:has(:disabled) { opacity: .62; }
@media (forced-colors: active) {
  .native-select-shell__chevron { stroke: CanvasText; }
}
</style>
