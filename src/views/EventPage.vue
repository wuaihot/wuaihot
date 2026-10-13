<template><component :is="page" /></template>
<script setup>
import { computed, defineAsyncComponent } from "vue";
import { useRoute } from "vue-router";
const route = useRoute();
const live = defineAsyncComponent(() => import("./EventHub.vue"));
const archive = defineAsyncComponent(() => import("./WorldsArchive.vue"));
const page = computed(() => route.params.eventSlug === "worlds-2025" ? archive : live);
</script>
