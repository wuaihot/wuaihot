<template>
  <section
    :id="sectionId || undefined"
    class="competition-guide"
    aria-labelledby="competition-guide-title"
  >
    <header class="competition-guide__head">
      <div>
        <span v-if="text(guide.kicker)" class="competition-guide__kicker">
          {{ text(guide.kicker) }}
        </span>
        <h2 id="competition-guide-title">{{ text(guide.title) }}</h2>
        <p v-if="text(guide.summary)">{{ text(guide.summary) }}</p>
      </div>
      <span v-if="text(guide.badge)" class="competition-guide__badge">
        {{ text(guide.badge) }}
      </span>
    </header>

    <div
      v-if="guide.progression?.length"
      class="competition-guide__progression"
      :aria-label="text(guide.progressionLabel)"
    >
      <template v-for="(item, index) in guide.progression" :key="item.key || index">
        <div class="competition-guide__progress-step">
          <strong>{{ text(item.value) }}</strong>
          <span>{{ text(item.label) }}</span>
        </div>
        <span
          v-if="index < guide.progression.length - 1"
          class="competition-guide__progress-arrow"
          aria-hidden="true"
        >→</span>
      </template>
    </div>

    <div v-if="guide.ruleGroups?.length" class="competition-guide__rules">
      <article
        v-for="group in guide.ruleGroups"
        :key="group.key"
        class="competition-guide__rule-card"
      >
        <div class="competition-guide__rule-head">
          <span>{{ text(group.eyebrow) }}</span>
          <strong>{{ text(group.title) }}</strong>
        </div>
        <p v-if="text(group.summary)">{{ text(group.summary) }}</p>
        <div v-if="group.facts?.length" class="competition-guide__facts">
          <div v-for="fact in group.facts" :key="fact.key">
            <strong>{{ text(fact.value) }}</strong>
            <span>{{ text(fact.label) }}</span>
          </div>
        </div>
        <ul v-if="group.rules?.length">
          <li v-for="(rule, index) in group.rules" :key="index">
            {{ text(rule) }}
          </li>
        </ul>
      </article>
    </div>

    <div v-if="guide.calendar?.length" class="competition-guide__calendar">
      <div class="competition-guide__section-head">
        <div>
          <span>{{ text(guide.calendarKicker) }}</span>
          <h3>{{ text(guide.calendarTitle) }}</h3>
        </div>
        <small v-if="text(guide.calendarHint)">{{ text(guide.calendarHint) }}</small>
      </div>
      <div class="competition-guide__calendar-grid">
        <article
          v-for="day in guide.calendar"
          :key="day.key || day.date"
          class="competition-guide__day"
          :class="{ 'is-offline': day.mode === 'offline', 'is-final': day.final }"
        >
          <time>{{ text(day.date) }}</time>
          <div>
            <strong>{{ text(day.title) }}</strong>
            <span v-if="text(day.note)">{{ text(day.note) }}</span>
          </div>
          <b>{{ text(day.format) }}</b>
        </article>
      </div>
    </div>

    <aside v-if="guide.specialRule" class="competition-guide__special">
      <div class="competition-guide__special-mark" aria-hidden="true">VOICE</div>
      <div class="competition-guide__special-copy">
        <span>{{ text(guide.specialRule.kicker) }}</span>
        <h3>{{ text(guide.specialRule.title) }}</h3>
        <p>{{ text(guide.specialRule.summary) }}</p>
      </div>
      <div
        v-if="guide.specialRule.facts?.length"
        class="competition-guide__special-facts"
      >
        <div v-for="fact in guide.specialRule.facts" :key="fact.key">
          <strong>{{ text(fact.value) }}</strong>
          <span>{{ text(fact.label) }}</span>
        </div>
      </div>
    </aside>
  </section>
</template>

<script setup>
const props = defineProps({
  guide: {
    type: Object,
    required: true,
  },
  locale: {
    type: String,
    default: "zh-CN",
  },
  sectionId: {
    type: String,
    default: "",
  },
});

const text = (value) => {
  if (value == null) return "";
  if (typeof value !== "object" || Array.isArray(value)) return String(value);
  return String(
    value[props.locale] ??
      value["zh-CN"] ??
      value.en ??
      value["zh-TW"] ??
      Object.values(value)[0] ??
      "",
  );
};
</script>

<style scoped>
.competition-guide {
  --guide-blue: var(--demacia-blue, #29329e);
  --guide-blue-deep: var(--demacia-blue-deep, #0d164f);
  --guide-blue-mid: var(--demacia-blue-mid, #1d2b88);
  --guide-ivory: var(--n-text-color-1);
  --guide-surface: var(--event-surface);
  --guide-gold: var(--guide-accent, var(--n-text-color-1));
  --guide-line: var(--event-border);
  position: relative;
  overflow: hidden;
  border: 1px solid var(--event-border);
  border-radius: 12px;
  background: var(--guide-surface);
  color: var(--guide-ivory);
}

.competition-guide::before { display: none; }

.competition-guide__head,
.competition-guide__progression,
.competition-guide__rules,
.competition-guide__calendar,
.competition-guide__special {
  position: relative;
  z-index: 1;
}

.competition-guide__head {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 20px 22px 16px;
  border-bottom: 1px solid var(--guide-line);
}

.competition-guide__head > div {
  min-width: 0;
}

.competition-guide__kicker,
.competition-guide__section-head span,
.competition-guide__special-copy > span {
  color: var(--guide-gold);
  font-size: 12px;
  font-weight: 780;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.competition-guide__head h2,
.competition-guide__section-head h3,
.competition-guide__special h3 {
  margin: 3px 0 0;
  color: var(--guide-ivory);
}

.competition-guide__head h2 {
  font-size: 20px;
  line-height: 1.28;
}

.competition-guide__head p {
  max-width: 760px;
  margin: 8px 0 0;
  color: color-mix(in srgb, var(--guide-ivory) 76%, transparent);
  font-size: 12px;
  line-height: 1.65;
}

.competition-guide__badge {
  align-self: flex-start;
  padding: 6px 9px;
  border: 1px solid color-mix(in srgb, var(--guide-gold) 55%, transparent);
  border-radius: 999px;
  color: var(--guide-gold);
  background: color-mix(in srgb, var(--guide-gold) 10%, transparent);
  font-size: 12px;
  font-weight: 760;
  white-space: nowrap;
}

.competition-guide__progression {
  display: flex;
  align-items: stretch;
  padding: 16px 22px;
  border-bottom: 1px solid var(--guide-line);
}

.competition-guide__progress-step {
  display: grid;
  align-content: center;
  flex: 1 1 0;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid color-mix(in srgb, var(--guide-ivory) 15%, transparent);
  border-radius: 7px;
  background: color-mix(in srgb, var(--guide-blue) 5%, var(--guide-surface));
}

.competition-guide__progress-step strong {
  color: var(--guide-gold);
  font-size: 17px;
  line-height: 1.15;
}

.competition-guide__progress-step span {
  margin-top: 4px;
  color: color-mix(in srgb, var(--guide-ivory) 82%, transparent);
  font-size: 12px;
  line-height: 1.35;
}

.competition-guide__progress-arrow {
  display: grid;
  place-items: center;
  flex: 0 0 28px;
  color: color-mix(in srgb, var(--guide-gold) 66%, transparent);
  font-size: 14px;
}

.competition-guide__rules {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 0 22px 18px;
}

.competition-guide__rule-card {
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--guide-line);
  border-radius: 8px;
  background: var(--guide-surface);
}

.competition-guide__rule-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.competition-guide__rule-head span {
  color: var(--guide-gold);
  font-size: 12px;
  font-weight: 760;
  font-variant-numeric: tabular-nums;
}

.competition-guide__rule-head strong {
  color: var(--guide-ivory);
  font-size: 15px;
}

.competition-guide__rule-card > p {
  margin: 8px 0 0;
  color: color-mix(in srgb, var(--guide-ivory) 78%, transparent);
  font-size: 11px;
  line-height: 1.6;
}

.competition-guide__facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 13px;
  border-block: 1px solid var(--guide-line);
}

.competition-guide__facts > div {
  min-width: 0;
  padding: 10px 8px;
  text-align: center;
}

.competition-guide__facts > div + div {
  border-inline-start: 1px solid var(--guide-line);
}

.competition-guide__facts strong,
.competition-guide__special-facts strong {
  display: block;
  color: var(--guide-gold);
  font-size: 16px;
  line-height: 1.1;
}

.competition-guide__facts span,
.competition-guide__special-facts span {
  display: block;
  margin-top: 3px;
  color: var(--event-muted);
  font-size: 11px;
  line-height: 1.35;
}

.competition-guide__rule-card ul {
  display: grid;
  gap: 6px;
  margin: 12px 0 0;
  padding-inline-start: 17px;
  color: color-mix(in srgb, var(--guide-ivory) 84%, transparent);
  font-size: 12px;
  line-height: 1.55;
}

.competition-guide__calendar {
  padding: 17px 22px 20px;
  border-top: 1px solid var(--guide-line);
  background: color-mix(in srgb, var(--guide-blue) 4%, var(--guide-surface));
}

.competition-guide__section-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 11px;
}

.competition-guide__section-head h3 {
  font-size: 15px;
}

.competition-guide__section-head small {
  color: var(--event-muted);
  font-size: 11px;
}

.competition-guide__calendar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 7px;
}

.competition-guide__day {
  position: relative;
  min-width: 0;
  min-height: 106px;
  padding: 11px 10px 10px;
  border: 1px solid var(--guide-line);
  border-radius: 7px;
  background: var(--guide-surface);
}

.competition-guide__day::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 2px;
  border-radius: 7px 0 0 7px;
  background: color-mix(in srgb, var(--guide-blue) 82%, white);
}

.competition-guide__day.is-offline::before {
  background: var(--guide-gold);
}

.competition-guide__day.is-final {
  border-color: color-mix(in srgb, var(--guide-gold) 58%, transparent);
  background: color-mix(in srgb, var(--guide-gold) 12%, var(--guide-surface));
}

.competition-guide__day time {
  display: block;
  color: var(--guide-gold);
  font-size: 13px;
  font-weight: 780;
  font-variant-numeric: tabular-nums;
}

.competition-guide__day > div {
  display: grid;
  gap: 3px;
  margin-top: 8px;
}

.competition-guide__day strong {
  color: var(--guide-ivory);
  font-size: 12px;
  line-height: 1.4;
}

.competition-guide__day span {
  color: var(--event-muted);
  font-size: 11px;
  line-height: 1.4;
}

.competition-guide__day b {
  display: block;
  margin-top: 8px;
  color: var(--event-muted);
  font-size: 11px;
  letter-spacing: .04em;
}

.competition-guide__special {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  margin: 0 22px 22px;
  padding: 14px 16px;
  border: 1px solid color-mix(in srgb, var(--guide-gold) 52%, transparent);
  border-radius: 8px;
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--guide-gold) 17%, transparent), transparent 55%),
    var(--guide-surface);
}

.competition-guide__special-mark {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border: 1px solid color-mix(in srgb, var(--guide-gold) 58%, transparent);
  border-radius: 50%;
  color: var(--guide-gold);
  font-size: 8px;
  font-weight: 820;
  letter-spacing: .08em;
}

.competition-guide__special h3 {
  font-size: 14px;
}

.competition-guide__special p {
  margin: 6px 0 0;
  color: color-mix(in srgb, var(--guide-ivory) 76%, transparent);
  font-size: 12px;
  line-height: 1.58;
}

.competition-guide__special-facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(76px, 1fr));
  gap: 6px;
}

.competition-guide__special-facts > div {
  padding: 9px 12px;
  border-inline-start: 1px solid var(--guide-line);
  text-align: center;
}

@media (max-width: 1180px) {
  .competition-guide__calendar-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .competition-guide__head {
    align-items: flex-start;
    padding: 17px 16px 14px;
  }

  .competition-guide__progression {
    overflow-x: auto;
    padding: 14px 16px;
  }

  .competition-guide__progress-step {
    flex: 0 0 132px;
  }

  .competition-guide__rules {
    grid-template-columns: 1fr;
    padding: 0 16px 16px;
  }

  .competition-guide__calendar {
    padding: 16px;
  }

  .competition-guide__calendar-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .competition-guide__section-head {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }

  .competition-guide__special {
    grid-template-columns: auto minmax(0, 1fr);
    margin: 0 16px 16px;
  }

  .competition-guide__special-facts {
    grid-column: 1 / -1;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .competition-guide__special-facts > div {
    border-inline-start: 0;
    border-top: 1px solid var(--guide-line);
  }
}

@media (max-width: 420px) {
  .competition-guide__calendar-grid {
    grid-template-columns: 1fr;
  }

  .competition-guide__facts {
    grid-template-columns: 1fr;
  }

  .competition-guide__facts > div + div {
    border-inline-start: 0;
    border-top: 1px solid var(--guide-line);
  }
}
</style>
