<template>
  <n-float-button
    class="feedback-float-button"
    position="relative"
    :width="44"
    :height="44"
    :title="t('feedback.launcher')"
    :aria-label="t('feedback.launcher')"
    @click="openFeedback"
  >
    <n-icon size="21">
      <Message />
    </n-icon>
  </n-float-button>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import { Message } from "@icon-park/vue-next";
import { feedbackConfig } from "@/config/feedback.mjs";

const { t } = useI18n({ useScope: "global" });

const openFeedback = () => {
  if (!feedbackConfig.enabled || !feedbackConfig.portalUrl) return;
  if (typeof window === "undefined") return;
  window.open(feedbackConfig.portalUrl, "_blank", "noopener,noreferrer");
};
</script>

<style lang="scss" scoped>
.feedback-float-button {
  cursor: pointer;
}
</style>
