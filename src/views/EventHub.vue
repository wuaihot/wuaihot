<template>
  <section class="event-hub">
    <n-result
      v-if="fatalError"
      status="error"
      :title="copy.loadFailed"
      :description="fatalError"
      class="event-hub__error"
    >
      <template #footer>
        <n-button type="primary" @click="loadAll(true)">
          {{ copy.retry }}
        </n-button>
      </template>
    </n-result>

    <template v-else>
      <section class="event-hero">
        <div class="event-hero__main">
          <div class="event-hero__eyebrow">
            <span>{{ eventUi.eyebrow || copy.eventCenter }}</span>
            <span
              v-if="eventData"
              class="event-status"
              :class="`is-${eventData.status || 'active'}`"
            >
              {{ statusLabel(eventData.status) }}
            </span>
          </div>
          <h1>{{ localizedEventTitle }}</h1>
          <p class="event-hero__description">
            {{ localizedDescription }}
          </p>
          <div v-if="eventData" class="event-hero__meta">
            <span>{{ formatDateRange(eventData.startDate, eventData.endDate) }}</span>
            <span>{{ eventUi.host || eventData.host }} · {{ eventUi.country || eventData.country }}</span>
            <span v-if="Number.isFinite(Number(eventData.sportCount))">
              {{ eventData.sportCount }} {{ copy.sports }}
            </span>
            <span v-if="Number.isFinite(Number(eventData.nocCount))">
              {{ eventData.nocCount }} {{ copy.nocs }}
            </span>
            <span v-if="eventData.stages?.length">
              {{ eventData.stages.length }} {{ copy.stages }}
            </span>
          </div>
          <div v-if="eventData" class="event-hero__actions">
            <a
              :href="eventData.officialUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="event-link"
            >
              {{ copy.officialSite }}
            </a>
            <a
              :href="eventData.resultsUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="event-link is-secondary"
            >
              {{ eventUi.resultsLabel || copy.officialResults }}
            </a>
          </div>
        </div>

        <div class="event-hero__snapshot">
          <div class="snapshot-head">
            <span>{{ eventUi.snapshotLabel || copy.liveSnapshot }}</span>
            <time v-if="generatedAt">{{ formatUpdatedAt(generatedAt) }}</time>
          </div>
          <div class="snapshot-grid">
            <div class="snapshot-stat">
              <strong>{{ primarySnapshotValue }}</strong>
              <span>{{ primarySnapshotLabel }}</span>
              <small v-if="primarySnapshotDetail">
                {{ primarySnapshotDetail }}
              </small>
            </div>
            <div class="snapshot-stat">
              <strong>{{ scheduleData?.liveCount ?? "—" }}</strong>
              <span>{{ copy.liveNow }}</span>
              <small v-if="scheduleData">
                {{ scheduleData.completedCount }} {{ copy.completed }}
              </small>
            </div>
            <div class="snapshot-stat">
              <strong>{{ scheduleData?.total ?? "—" }}</strong>
              <span>{{ eventUi.scheduleSnapshotLabel || copy.eventsToday }}</span>
              <small v-if="scheduleData">
                {{ scheduleData.upcomingCount }} {{ copy.upcoming }}
              </small>
            </div>
          </div>
        </div>
      </section>

      <div v-if="degradedModules.length" class="event-degraded" role="status">
        {{ copy.degraded }}：{{ degradedModules.map(moduleLabel).join("、") }}
      </div>

      <section class="event-dashboard">
        <article
          class="event-panel primary-panel"
          :class="primaryModule === 'standings' ? 'standings-panel' : 'medal-panel'"
        >
          <header class="panel-head">
            <div>
              <span class="panel-kicker">
                {{
                  primaryModule === "standings"
                    ? eventUi.standingsKicker || copy.officialStandings
                    : copy.officialData
                }}
              </span>
              <h2>
                {{
                  primaryModule === "standings"
                    ? eventUi.standingsTitle || copy.qualifiedTeams
                    : copy.medalTable
                }}
              </h2>
            </div>
            <span v-if="primaryModule === 'standings' && standingsData" class="panel-count">
              {{ standingsData.total }} {{ eventUi.qualifiedLabel || copy.qualified }}
              <template v-if="standingsData.pendingCount">
                · {{ standingsData.pendingCount }} {{ eventUi.pendingLabel || copy.pending }}
              </template>
            </span>
            <span v-else-if="medalData" class="panel-count">
              {{ medalData.total }} {{ copy.delegations }}
            </span>
          </header>

          <template v-if="primaryModule === 'standings'">
            <div v-if="loading && !standingsData" class="panel-loading">
              <n-skeleton text :repeat="8" />
            </div>
            <div v-else-if="standingsData?.entries?.length" class="standings-groups">
              <section
                v-for="group in standingsGroups"
                :key="group.name"
                class="standings-group"
              >
                <header>
                  <strong>{{ group.name }}</strong>
                  <span>{{ group.entries.length }}</span>
                </header>
                <div class="standings-team-grid">
                  <article
                    v-for="entry in group.entries"
                    :key="entry.id"
                    class="standings-team"
                  >
                    <img
                      v-if="entry.image"
                      :src="entry.image"
                      :alt="entry.code || entry.name"
                      loading="lazy"
                    />
                    <span v-else class="standings-team__fallback">
                      {{ (entry.code || entry.name || "?").slice(0, 3) }}
                    </span>
                    <div>
                      <strong>{{ entry.code || entry.name }}</strong>
                      <small>{{ entry.statusLabel || eventUi.qualifiedLabel || copy.qualified }}</small>
                    </div>
                  </article>
                </div>
              </section>
              <div v-if="standingsData.pendingCount" class="standings-pending">
                <strong>{{ standingsData.pendingCount }}</strong>
                <span>{{ eventUi.pendingLabel || copy.pending }}</span>
              </div>
            </div>
            <n-empty v-else :description="eventUi.standingsTitle || copy.qualifiedTeams" />
          </template>

          <template v-else>
            <div v-if="loading && !medalData" class="panel-loading">
              <n-skeleton text :repeat="8" />
            </div>
            <div v-else-if="medalData?.standings?.length" class="medal-table-wrap">
              <table class="medal-table">
                <thead>
                  <tr>
                    <th>{{ copy.rank }}</th>
                    <th>{{ copy.delegation }}</th>
                    <th class="medal-col gold">{{ copy.gold }}</th>
                    <th class="medal-col silver">{{ copy.silver }}</th>
                    <th class="medal-col bronze">{{ copy.bronze }}</th>
                    <th>{{ copy.total }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in medalData.standings"
                    :key="row.noc"
                    :class="{ 'is-top-three': row.rank <= 3 }"
                  >
                    <td class="rank-cell">{{ row.rankLabel || row.rank }}</td>
                    <td class="delegation-cell">
                      <strong>{{ row.noc }}</strong>
                      <span>{{ localizedNocName(row) }}</span>
                    </td>
                    <td class="medal-number gold">{{ row.gold }}</td>
                    <td class="medal-number silver">{{ row.silver }}</td>
                    <td class="medal-number bronze">{{ row.bronze }}</td>
                    <td class="total-number">{{ row.total }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <n-empty v-else :description="copy.noMedals" />
          </template>
        </article>

        <article class="event-panel schedule-panel">
          <header class="panel-head schedule-head">
            <div>
              <span class="panel-kicker">{{ eventUi.scheduleKicker || copy.officialSchedule }}</span>
              <h2>{{ eventUi.scheduleTitle || copy.schedule }}</h2>
            </div>
            <div class="schedule-controls">
              <label>
                <span class="sr-only">{{ copy.date }}</span>
                <input
                  v-model="selectedDate"
                  type="date"
                  :min="eventData?.startDate"
                  :max="eventData?.endDate"
                  @change="applyScheduleFilters"
                />
              </label>
              <n-select
                v-if="disciplineCatalog.length"
                v-model:value="selectedDiscipline"
                size="small"
                :options="disciplineOptions"
                :placeholder="copy.allSports"
                class="discipline-select"
                @update:value="applyScheduleFilters"
              />
            </div>
          </header>

          <div class="schedule-summary">
            <span><strong>{{ scheduleData?.total ?? 0 }}</strong> {{ copy.totalEvents }}</span>
            <span class="is-live"><strong>{{ scheduleData?.liveCount ?? 0 }}</strong> {{ copy.live }}</span>
            <span><strong>{{ scheduleData?.completedCount ?? 0 }}</strong> {{ copy.completed }}</span>
            <span><strong>{{ scheduleData?.upcomingCount ?? 0 }}</strong> {{ copy.upcoming }}</span>
          </div>

          <div v-if="scheduleLoading" class="panel-loading">
            <n-skeleton text :repeat="8" />
          </div>
          <div v-else-if="scheduleData?.items?.length" class="schedule-list">
            <article
              v-for="item in visibleScheduleItems"
              :key="item.id"
              class="schedule-row"
              :class="{ 'is-live': item.isLive }"
            >
              <div class="schedule-time">
                <strong>{{ formatEventTime(item.startAt) }}</strong>
                <span>{{ item.discipline }}</span>
              </div>
              <div class="schedule-main">
                <div class="schedule-title-line">
                  <span class="schedule-discipline">
                    {{ localizedDisciplineName(item) }}
                  </span>
                  <span
                    class="schedule-state"
                    :class="{ 'is-live': item.isLive }"
                  >
                    {{ localizedScheduleStatus(item) }}
                  </span>
                </div>
                <h3>{{ localizedScheduleTitle(item) }}</h3>
                <p v-if="localizedScheduleSubtitle(item)">
                  {{ localizedScheduleSubtitle(item) }}
                </p>
              </div>
              <a
                v-if="item.resultUrl && item.showResults"
                :href="item.resultUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="result-link"
              >
                {{ copy.results }}
              </a>
            </article>
            <button
              v-if="hasMoreSchedule"
              type="button"
              class="schedule-more"
              @click="showMoreSchedule"
            >
              {{ copy.showMore }}
              <span>{{ visibleScheduleItems.length }} / {{ scheduleData.items.length }}</span>
            </button>
          </div>
          <n-empty v-else :description="eventUi.noSchedule || copy.noSchedule" />
        </article>
      </section>

      <section
        v-if="eventData?.stages?.length"
        class="event-panel stages-panel"
      >
        <header class="panel-head">
          <div>
            <span class="panel-kicker">
              {{ eventUi.stageKicker || copy.officialSchedule }}
            </span>
            <h2>{{ eventUi.stageTitle || copy.schedule }}</h2>
          </div>
          <span class="panel-count">
            {{ eventData.stages.length }} {{ copy.stages }}
          </span>
        </header>
        <div class="stage-grid">
          <article
            v-for="stage in eventData.stages"
            :key="stage.key"
            class="stage-card"
          >
            <div class="stage-card__head">
              <strong>{{ stageLabel(stage) }}</strong>
              <span v-if="stage.dateLabel">{{ stage.dateLabel }}</span>
            </div>
            <p v-if="stage.venue">
              {{ stage.venue }}
              <template v-if="stage.location"> · {{ stage.location }}</template>
            </p>
            <small v-if="stage.description && locale === 'en'">{{ stage.description }}</small>
          </article>
        </div>
      </section>

      <section class="event-panel news-panel">
        <header class="panel-head">
          <div>
            <span class="panel-kicker">{{ copy.officialUpdates }}</span>
            <h2>{{ copy.news }}</h2>
          </div>
          <a
            v-if="eventData?.officialUrl"
            :href="eventData.officialUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="panel-more"
          >
            {{ copy.officialSite }}
          </a>
        </header>

        <div v-if="loading && !newsData" class="panel-loading">
          <n-skeleton text :repeat="5" />
        </div>
        <div v-else-if="newsData?.items?.length" class="news-grid">
          <a
            v-for="item in newsData.items"
            :key="item.url"
            :href="item.url"
            target="_blank"
            rel="noopener noreferrer"
            class="news-card"
          >
            <div class="news-card__meta">
              <time>{{ formatNewsDate(item.publishedAt) }}</time>
              <span v-if="item.categories?.length">{{ localizedNewsCategory(item) }}</span>
            </div>
            <h3>{{ localizedNewsTitle(item) }}</h3>
            <p v-if="item.summary">{{ localizedNewsSummary(item) }}</p>
            <span class="news-card__open">{{ copy.readOfficial }} →</span>
          </a>
        </div>
        <n-empty v-else :description="copy.noNews" />
      </section>

      <footer class="event-source-note">
        <strong>{{ copy.dataSource }}</strong>
        <span>{{ eventUi.sourceNote || copy.dataSourceNote }}</span>
      </footer>
    </template>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  getEventOverview,
  getEventSchedule,
} from "@/api";
import {
  EVENT_REGISTRY,
  getEventTitle,
} from "@/config/events";
import { DATA_REFRESH_EVENT } from "@/utils/dataRefresh";
import {
  localizeEventDiscipline,
  localizeEventNoc,
  localizeEventStatus,
  localizeKnownScheduleText,
  normalizeEventTranslatedText,
  shouldTranslateEventFreeText,
} from "@/utils/eventHubLocalization";
import { getLocaleFromRoute, normalizeLocale } from "@/utils/locale";
import { translateReadableTitles } from "@/utils/readableTitles";

const route = useRoute();
const router = useRouter();

const eventSlug = computed(() => String(route.params.eventSlug || ""));
const locale = computed(() => normalizeLocale(getLocaleFromRoute(route)));
const eventConfig = computed(
  () => EVENT_REGISTRY.find((item) => item.id === eventSlug.value) || null,
);

const COPY = {
  "zh-CN": {
    eventCenter: "赛事中心",
    active: "进行中",
    upcomingStatus: "即将开始",
    completedStatus: "已结束",
    sports: "大项",
    nocs: "参赛代表团",
    officialSite: "赛事官网",
    officialResults: "官方成绩",
    liveSnapshot: "实时概览",
    medalLeader: "奖牌榜首",
    liveNow: "正在进行",
    eventsToday: "今日赛程",
    completed: "已完成",
    upcoming: "待进行",
    degraded: "部分模块暂时不可用",
    medals: "奖牌榜",
    standingsModule: "晋级 / 排名",
    officialStandings: "官方参赛信息",
    qualifiedTeams: "已晋级队伍",
    qualified: "已晋级",
    pending: "待定",
    stages: "阶段",
    scheduleModule: "赛程",
    newsModule: "资讯",
    officialData: "官方奖牌数据",
    medalTable: "奖牌榜",
    delegations: "代表团",
    rank: "排名",
    delegation: "代表团",
    gold: "金",
    silver: "银",
    bronze: "铜",
    total: "总计",
    noMedals: "暂无奖牌数据",
    officialSchedule: "官方赛程",
    schedule: "今日与指定日期赛程",
    date: "日期",
    allSports: "全部项目",
    totalEvents: "场 / 单元",
    live: "进行中",
    results: "成绩",
    noSchedule: "当前筛选暂无赛程",
    showMore: "显示更多赛程",
    officialUpdates: "官方动态",
    news: "赛事资讯",
    readOfficial: "查看官方原文",
    noNews: "暂无官方资讯",
    dataSource: "数据来源",
    dataSourceNote: "奖牌与赛程来自赛事官方 Results；资讯来自赛事官网。数据会随比赛实时变化。",
    loadFailed: "赛事数据加载失败",
    retry: "重新加载",
  },
  en: {
    eventCenter: "Event Hub",
    active: "Live",
    upcomingStatus: "Upcoming",
    completedStatus: "Completed",
    sports: "sports",
    nocs: "NOCs",
    officialSite: "Official site",
    officialResults: "Official results",
    liveSnapshot: "Live snapshot",
    medalLeader: "Medal leader",
    liveNow: "Live now",
    eventsToday: "Events today",
    completed: "completed",
    upcoming: "upcoming",
    degraded: "Some modules are temporarily unavailable",
    medals: "Medals",
    standingsModule: "Standings / qualification",
    officialStandings: "Official participants",
    qualifiedTeams: "Qualified teams",
    qualified: "qualified",
    pending: "pending",
    stages: "stages",
    scheduleModule: "Schedule",
    newsModule: "News",
    officialData: "Official medal data",
    medalTable: "Medal table",
    delegations: "delegations",
    rank: "Rank",
    delegation: "Delegation",
    gold: "Gold",
    silver: "Silver",
    bronze: "Bronze",
    total: "Total",
    noMedals: "No medal data",
    officialSchedule: "Official schedule",
    schedule: "Schedule",
    date: "Date",
    allSports: "All sports",
    totalEvents: "events / units",
    live: "live",
    results: "Results",
    noSchedule: "No schedule matches this filter",
    showMore: "Show more schedule",
    officialUpdates: "Official updates",
    news: "Event news",
    readOfficial: "Read official",
    noNews: "No official news",
    dataSource: "Data source",
    dataSourceNote: "Medals and schedules come from the official Results service; news comes from the event website. Data changes as competition progresses.",
    loadFailed: "Event data failed to load",
    retry: "Retry",
  },
  "zh-TW": {
    eventCenter: "賽事中心",
    active: "進行中",
    upcomingStatus: "即將開始",
    completedStatus: "已結束",
    sports: "大項",
    nocs: "參賽代表團",
    officialSite: "賽事官網",
    officialResults: "官方成績",
    liveSnapshot: "即時概覽",
    medalLeader: "獎牌榜首",
    liveNow: "正在進行",
    eventsToday: "今日賽程",
    completed: "已完成",
    upcoming: "待進行",
    degraded: "部分模組暫時不可用",
    medals: "獎牌榜",
    standingsModule: "晉級 / 排名",
    officialStandings: "官方參賽資訊",
    qualifiedTeams: "已晉級隊伍",
    qualified: "已晉級",
    pending: "待定",
    stages: "階段",
    scheduleModule: "賽程",
    newsModule: "資訊",
    officialData: "官方獎牌資料",
    medalTable: "獎牌榜",
    delegations: "代表團",
    rank: "排名",
    delegation: "代表團",
    gold: "金",
    silver: "銀",
    bronze: "銅",
    total: "總計",
    noMedals: "暫無獎牌資料",
    officialSchedule: "官方賽程",
    schedule: "今日與指定日期賽程",
    date: "日期",
    allSports: "全部項目",
    totalEvents: "場 / 單元",
    live: "進行中",
    results: "成績",
    noSchedule: "目前篩選暫無賽程",
    showMore: "顯示更多賽程",
    officialUpdates: "官方動態",
    news: "賽事資訊",
    readOfficial: "查看官方原文",
    noNews: "暫無官方資訊",
    dataSource: "資料來源",
    dataSourceNote: "獎牌與賽程來自賽事官方 Results；資訊來自賽事官網。資料會隨比賽即時變化。",
    loadFailed: "賽事資料載入失敗",
    retry: "重新載入",
  },
  ja: {
    eventCenter: "大会ハブ",
    active: "開催中",
    upcomingStatus: "開催予定",
    completedStatus: "終了",
    sports: "競技",
    nocs: "NOC",
    officialSite: "公式サイト",
    officialResults: "公式結果",
    liveSnapshot: "ライブ概要",
    medalLeader: "メダル首位",
    liveNow: "進行中",
    eventsToday: "本日の競技",
    completed: "終了",
    upcoming: "予定",
    degraded: "一部のモジュールを一時利用できません",
    medals: "メダル",
    standingsModule: "順位 / 出場",
    officialStandings: "公式出場情報",
    qualifiedTeams: "出場確定チーム",
    qualified: "出場確定",
    pending: "未確定",
    stages: "フェーズ",
    scheduleModule: "日程",
    newsModule: "ニュース",
    officialData: "公式メダルデータ",
    medalTable: "メダル順位",
    delegations: "代表団",
    rank: "順位",
    delegation: "代表団",
    gold: "金",
    silver: "銀",
    bronze: "銅",
    total: "合計",
    noMedals: "メダルデータはありません",
    officialSchedule: "公式日程",
    schedule: "競技日程",
    date: "日付",
    allSports: "全競技",
    totalEvents: "試合 / ユニット",
    live: "進行中",
    results: "結果",
    noSchedule: "該当する日程はありません",
    showMore: "日程をさらに表示",
    officialUpdates: "公式情報",
    news: "大会ニュース",
    readOfficial: "公式記事を見る",
    noNews: "公式ニュースはありません",
    dataSource: "データソース",
    dataSourceNote: "メダルと日程は公式 Results、ニュースは大会公式サイトから取得しています。競技進行に合わせて更新されます。",
    loadFailed: "大会データを読み込めません",
    retry: "再読み込み",
  },
  ko: {
    eventCenter: "대회 허브",
    active: "진행 중",
    upcomingStatus: "예정",
    completedStatus: "종료",
    sports: "종목",
    nocs: "NOC",
    officialSite: "공식 사이트",
    officialResults: "공식 결과",
    liveSnapshot: "실시간 개요",
    medalLeader: "메달 선두",
    liveNow: "진행 중",
    eventsToday: "오늘 일정",
    completed: "완료",
    upcoming: "예정",
    degraded: "일부 모듈을 일시적으로 사용할 수 없습니다",
    medals: "메달",
    standingsModule: "순위 / 진출",
    officialStandings: "공식 참가 정보",
    qualifiedTeams: "진출 확정 팀",
    qualified: "진출 확정",
    pending: "미정",
    stages: "단계",
    scheduleModule: "일정",
    newsModule: "뉴스",
    officialData: "공식 메달 데이터",
    medalTable: "메달 순위",
    delegations: "대표단",
    rank: "순위",
    delegation: "대표단",
    gold: "금",
    silver: "은",
    bronze: "동",
    total: "합계",
    noMedals: "메달 데이터가 없습니다",
    officialSchedule: "공식 일정",
    schedule: "경기 일정",
    date: "날짜",
    allSports: "전체 종목",
    totalEvents: "경기 / 단위",
    live: "진행 중",
    results: "결과",
    noSchedule: "조건에 맞는 일정이 없습니다",
    showMore: "일정 더 보기",
    officialUpdates: "공식 업데이트",
    news: "대회 뉴스",
    readOfficial: "공식 원문 보기",
    noNews: "공식 뉴스가 없습니다",
    dataSource: "데이터 출처",
    dataSourceNote: "메달과 일정은 공식 Results, 뉴스는 대회 공식 사이트에서 제공합니다. 경기 진행에 따라 실시간으로 변경됩니다.",
    loadFailed: "대회 데이터를 불러오지 못했습니다",
    retry: "다시 시도",
  },
};

const copy = computed(() => COPY[locale.value] || COPY["zh-CN"]);
const eventUi = computed(() => {
  const ui = eventConfig.value?.ui || {};
  return ui[locale.value] || (locale.value === "zh-CN" ? ui["zh-CN"] : {}) || {};
});
const overview = ref(null);
const medalData = ref(null);
const standingsData = ref(null);
const scheduleData = ref(null);
const newsData = ref(null);
const translatedEventText = ref({});
let eventTranslationVersion = 0;
const loading = ref(false);
const scheduleLoading = ref(false);
const scheduleVisibleCount = ref(24);
const fatalError = ref("");
const disciplineCatalog = ref([]);
const selectedDate = ref(
  typeof route.query.date === "string" ? route.query.date : "",
);
const selectedDiscipline = ref(
  typeof route.query.discipline === "string" ? route.query.discipline : "",
);

const eventData = computed(() => overview.value?.event || null);
const generatedAt = computed(() => overview.value?.generatedAt || "");
const degradedModules = computed(() =>
  Array.isArray(overview.value?.degradedModules)
    ? overview.value.degradedModules
    : [],
);
const leader = computed(() => medalData.value?.standings?.[0] || null);
const primaryModule = computed(
  () => eventData.value?.primaryModule || (standingsData.value ? "standings" : "medals"),
);
const standingsGroups = computed(() => {
  const groups = new Map();
  for (const entry of standingsData.value?.entries || []) {
    const key = entry.group || entry.groupName || copy.value.qualifiedTeams;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  }
  return [...groups.entries()].map(([name, entries]) => ({ name, entries }));
});
const primarySnapshotValue = computed(() =>
  primaryModule.value === "standings"
    ? standingsData.value?.total ?? "—"
    : leader.value?.noc || "—",
);
const primarySnapshotLabel = computed(() =>
  primaryModule.value === "standings"
    ? eventUi.value.qualifiedLabel || copy.value.qualifiedTeams
    : copy.value.medalLeader,
);
const primarySnapshotDetail = computed(() => {
  if (primaryModule.value === "standings") {
    const pending = Number(standingsData.value?.pendingCount || 0);
    return pending > 0
      ? `${pending} ${eventUi.value.pendingLabel || copy.value.pending}`
      : eventUi.value.qualifiedLabel || copy.value.qualified;
  }
  return leader.value
    ? `${leader.value.gold} / ${leader.value.silver} / ${leader.value.bronze}`
    : "";
});
const visibleScheduleItems = computed(() =>
  Array.isArray(scheduleData.value?.items)
    ? scheduleData.value.items.slice(0, scheduleVisibleCount.value)
    : [],
);
const hasMoreSchedule = computed(
  () => visibleScheduleItems.value.length < (scheduleData.value?.items?.length || 0),
);
const localizedEventTitle = computed(
  () => getEventTitle(eventConfig.value, locale.value) || eventData.value?.title || eventSlug.value,
);
const localizedDescription = computed(() => {
  if (eventUi.value.description) return eventUi.value.description;
  const descriptions = {
    "zh-CN": "汇总官方奖牌榜、实时赛程、比赛结果与赛事动态，一页掌握大型综合赛事当前进展。",
    en: "Official medal standings, live schedules, results and event updates in one focused view.",
    "zh-TW": "彙整官方獎牌榜、即時賽程、比賽結果與賽事動態，一頁掌握大型綜合賽事進展。",
    ja: "公式メダル順位、競技日程、結果、公式ニュースを一つの画面で確認できます。",
    ko: "공식 메달 순위, 실시간 일정, 경기 결과와 공식 뉴스를 한 화면에서 확인합니다.",
  };
  return descriptions[locale.value] || descriptions["zh-CN"];
});
const disciplineOptions = computed(() => [
  { label: copy.value.allSports, value: "" },
  ...disciplineCatalog.value.map((item) => ({
    label: `${localizeEventDiscipline(
      eventSlug.value,
      item.key,
      item.name || item.key,
      locale.value,
    )} · ${item.count}`,
    value: item.key,
  })),
]);

const localeTag = computed(
  () =>
    ({
      "zh-CN": "zh-CN",
      "zh-TW": "zh-TW",
      en: "en-US",
      ja: "ja-JP",
      ko: "ko-KR",
    })[locale.value] || "zh-CN",
);

const statusLabel = (status) => {
  const value = String(status || "").toLowerCase();
  if (value === "upcoming") return copy.value.upcomingStatus;
  if (value === "completed" || value === "official") return copy.value.completedStatus;
  return copy.value.active;
};
const moduleLabel = (module) =>
  ({
    medals: copy.value.medals,
    standings: copy.value.standingsModule,
    schedule: copy.value.scheduleModule,
    news: copy.value.newsModule,
  })[module] || module;
const stageLabel = (stage) =>
  eventUi.value.stageLabels?.[stage?.key] || stage?.label || stage?.key || "";

const localizedNocName = (row) =>
  localizeEventNoc(
    eventSlug.value,
    row?.noc,
    row?.name || row?.noc,
    locale.value,
  );

const localizedDisciplineName = (item) =>
  localizeEventDiscipline(
    eventSlug.value,
    item?.discipline,
    item?.disciplineName || item?.discipline,
    locale.value,
  );

const translatedFreeText = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const known = localizeKnownScheduleText(eventSlug.value, raw, locale.value);
  if (known && known !== raw) return known;
  return normalizeEventTranslatedText(
    eventSlug.value,
    raw,
    translatedEventText.value[raw] || raw,
    locale.value,
  );
};

const localizedScheduleStatus = (item) => {
  if (item?.isLive) return copy.value.live;
  return localizeEventStatus(
    eventSlug.value,
    item?.status,
    item?.statusLabel || statusLabel(item?.status),
    locale.value,
  );
};

const localizedScheduleTitle = (item) =>
  translatedFreeText(item?.unitName || item?.phaseName || item?.eventName);

const localizedScheduleSubtitle = (item) => {
  const title = localizedScheduleTitle(item);
  const phase = translatedFreeText(item?.phaseName || item?.eventName);
  const venue = translatedFreeText(item?.venueName);
  return [phase && phase !== title ? phase : "", venue].filter(Boolean).join(" · ");
};

const localizedNewsTitle = (item) => translatedFreeText(item?.title);
const localizedNewsSummary = (item) => translatedFreeText(item?.summary);
const localizedNewsCategory = (item) =>
  translatedFreeText(Array.isArray(item?.categories) ? item.categories[0] : "");

const translateVisibleEventText = async ({ includeNews = true } = {}) => {
  if (!shouldTranslateEventFreeText(eventSlug.value, locale.value)) return;
  const requestVersion = ++eventTranslationVersion;
  const requestEvent = eventSlug.value;
  const requestLocale = locale.value;
  const texts = [];

  for (const item of visibleScheduleItems.value) {
    for (const value of [
      item?.unitName,
      item?.phaseName,
      item?.eventName,
      item?.venueName,
    ]) {
      const raw = String(value || "").trim();
      if (!raw) continue;
      if (localizeKnownScheduleText(requestEvent, raw, requestLocale) !== raw) continue;
      texts.push(raw);
    }
  }

  if (includeNews) {
    for (const item of newsData.value?.items || []) {
      for (const value of [
        item?.title,
        item?.summary,
        ...(Array.isArray(item?.categories) ? item.categories.slice(0, 1) : []),
      ]) {
        const raw = String(value || "").trim();
        if (raw) texts.push(raw);
      }
    }
  }

  const uniqueTexts = [...new Set(texts)];
  if (!uniqueTexts.length) return;

  const translated = await translateReadableTitles(
    uniqueTexts,
    requestLocale,
    { priority: 900 },
  );

  if (
    requestVersion !== eventTranslationVersion ||
    requestEvent !== eventSlug.value ||
    requestLocale !== locale.value
  ) {
    return;
  }

  translatedEventText.value = {
    ...translatedEventText.value,
    ...translated,
  };
};

const showMoreSchedule = () => {
  scheduleVisibleCount.value += 24;
  void translateVisibleEventText({ includeNews: false });
};

const formatDate = (value, options = {}) => {
  if (!value) return "";
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00+09:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(localeTag.value, {
    month: "short",
    day: "numeric",
    ...options,
  }).format(date);
};
const formatDateRange = (start, end) => {
  if (!start && !end) return "";
  return `${formatDate(start, { year: "numeric" })} – ${formatDate(end, { year: "numeric" })}`;
};
const formatUpdatedAt = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(localeTag.value, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};
const formatEventTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return new Intl.DateTimeFormat(localeTag.value, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: eventData.value?.timezone || "Asia/Tokyo",
  }).format(date);
};
const formatNewsDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(localeTag.value, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const updateRouteQuery = () => {
  const query = { ...route.query };
  if (selectedDate.value) query.date = selectedDate.value;
  else delete query.date;
  if (selectedDiscipline.value) query.discipline = selectedDiscipline.value;
  else delete query.discipline;
  router.replace({ path: route.path, query, hash: route.hash });
};

const applyScheduleFilters = async () => {
  updateRouteQuery();
  await loadSchedule(false);
};

const loadSchedule = async (force = false) => {
  if (!eventSlug.value || !selectedDate.value) return;
  scheduleVisibleCount.value = 24;
  scheduleLoading.value = true;
  try {
    scheduleData.value = await getEventSchedule(eventSlug.value, {
      date: selectedDate.value,
      discipline: selectedDiscipline.value || undefined,
      limit: 60,
      force,
    });
    void translateVisibleEventText({ includeNews: false });
  } catch (error) {
    console.warn("event schedule request failed", error);
    scheduleData.value = {
      date: selectedDate.value,
      total: 0,
      liveCount: 0,
      completedCount: 0,
      upcomingCount: 0,
      disciplines: [],
      items: [],
    };
  } finally {
    scheduleLoading.value = false;
  }
};

const loadAll = async (force = false) => {
  if (!eventSlug.value) return;
  scheduleVisibleCount.value = 24;
  loading.value = true;
  fatalError.value = "";
  try {
    const data = await getEventOverview(eventSlug.value, {
      date: selectedDate.value || undefined,
      medalLimit: 20,
      scheduleLimit: 60,
      newsLimit: 10,
      force,
    });
    overview.value = data;
    medalData.value = data.modules?.medals || null;
    standingsData.value = data.modules?.standings || null;
    scheduleData.value = data.modules?.schedule || null;
    newsData.value = data.modules?.news || null;
    if (!selectedDate.value) {
      selectedDate.value =
        data.modules?.schedule?.date || data.today || eventData.value?.startDate || "";
    }
    if (Array.isArray(data.modules?.schedule?.disciplines)) {
      disciplineCatalog.value = data.modules.schedule.disciplines;
    }
    if (selectedDiscipline.value) {
      await loadSchedule(force);
    }
    void translateVisibleEventText({ includeNews: true });
  } catch (error) {
    fatalError.value =
      error?.message || error?.code || copy.value.loadFailed;
  } finally {
    loading.value = false;
  }
};

const handleRefresh = () => loadAll(true);

watch(
  () => route.query.date,
  (value) => {
    const next = typeof value === "string" ? value : "";
    if (next === selectedDate.value) return;
    selectedDate.value = next;
    if (overview.value) loadSchedule(false);
  },
);
watch(
  () => route.query.discipline,
  (value) => {
    const next = typeof value === "string" ? value : "";
    if (next === selectedDiscipline.value) return;
    selectedDiscipline.value = next;
    if (overview.value) loadSchedule(false);
  },
);
watch(eventSlug, () => {
  eventTranslationVersion += 1;
  translatedEventText.value = {};
  overview.value = null;
  medalData.value = null;
  standingsData.value = null;
  scheduleData.value = null;
  newsData.value = null;
  disciplineCatalog.value = [];
  selectedDate.value = typeof route.query.date === "string" ? route.query.date : "";
  selectedDiscipline.value =
    typeof route.query.discipline === "string" ? route.query.discipline : "";
  loadAll(false);
});

watch(locale, () => {
  eventTranslationVersion += 1;
  translatedEventText.value = {};
  if (overview.value) {
    void translateVisibleEventText({ includeNews: true });
  }
});

onMounted(() => {
  loadAll(false);
  if (typeof window !== "undefined") {
    window.addEventListener(DATA_REFRESH_EVENT, handleRefresh);
  }
});
onBeforeUnmount(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener(DATA_REFRESH_EVENT, handleRefresh);
  }
});
</script>

<style scoped>
.event-hub {
  --event-border: var(--n-border-color, rgba(127, 127, 127, 0.16));
  --event-soft: color-mix(in srgb, var(--n-action-color, #f4f5f7) 74%, transparent);
  --event-surface: var(--n-color, #fff);
  --event-muted: var(--n-text-color-3, #8a8f98);
  display: grid;
  gap: 20px;
  padding-bottom: 32px;
}

.event-hub__error {
  min-height: 420px;
  display: grid;
  place-items: center;
}

.event-hero,
.event-panel {
  border: 1px solid var(--event-border);
  background: var(--event-surface);
  border-radius: 16px;
}

.event-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(340px, 0.72fr);
  gap: clamp(24px, 3vw, 42px);
  padding: clamp(28px, 3.3vw, 46px);
  overflow: hidden;
  background:
    linear-gradient(
      112deg,
      color-mix(in srgb, var(--n-primary-color, #d03050) 5%, var(--event-surface)) 0%,
      var(--event-surface) 42%,
      color-mix(in srgb, var(--n-info-color, #2080f0) 4%, var(--event-surface)) 100%
    );
  box-shadow: 0 14px 42px rgba(0, 0, 0, 0.045);
}

.event-hero::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: var(--n-primary-color, #d03050);
}

.event-hero::after {
  content: "";
  position: absolute;
  right: -8%;
  top: -46%;
  width: 420px;
  aspect-ratio: 1;
  border: 1px solid color-mix(in srgb, var(--n-primary-color, #d03050) 14%, transparent);
  border-radius: 50%;
  pointer-events: none;
}

.event-hero__main,
.event-hero__snapshot {
  position: relative;
  z-index: 1;
}

.event-hero__eyebrow {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--n-primary-color, #d03050);
  font-size: 12px;
  font-weight: 760;
  letter-spacing: 0.025em;
}

.event-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 0 3px 9px;
  border-left: 1px solid color-mix(in srgb, currentColor 38%, transparent);
  font-size: 12px;
  letter-spacing: 0;
}

.event-status::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 10%, transparent);
}

.event-status.is-completed {
  color: var(--n-text-color-3, #999);
}

.event-status.is-upcoming {
  color: var(--n-info-color, #2080f0);
}

.event-hero h1 {
  max-width: 820px;
  margin: 13px 0 12px;
  color: var(--n-text-color);
  font-size: clamp(32px, 3.6vw, 50px);
  font-weight: 820;
  line-height: 1.08;
  letter-spacing: -0.042em;
}

.event-hero__description {
  max-width: 760px;
  margin: 0;
  color: var(--n-text-color-2);
  font-size: 15px;
  line-height: 1.78;
}

.event-hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 22px;
  margin-top: 20px;
  color: var(--n-text-color-2);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.event-hero__meta span {
  position: relative;
}

.event-hero__meta span + span::before {
  content: "·";
  position: absolute;
  left: -11px;
  color: var(--n-text-color-3);
}

.event-hero__actions {
  display: flex;
  gap: 10px;
  margin-top: 26px;
}

.event-link,
.result-link,
.panel-more {
  color: var(--n-primary-color, #d03050);
  text-decoration: none;
  font-weight: 700;
}

.event-link {
  padding: 9px 16px;
  border-radius: 7px;
  color: #fff;
  background: var(--n-primary-color, #d03050);
  box-shadow: 0 6px 18px color-mix(in srgb, var(--n-primary-color, #d03050) 18%, transparent);
}

.event-link.is-secondary {
  color: var(--n-text-color);
  background: var(--event-soft);
  border: 1px solid var(--event-border);
}

.event-hero__snapshot {
  align-self: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 180px;
  padding: 20px 22px;
  border: 1px solid color-mix(in srgb, var(--event-border) 76%, transparent);
  border-radius: 12px;
  background: color-mix(in srgb, var(--event-surface) 82%, transparent);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, #fff 70%, transparent),
    0 10px 30px rgba(0, 0, 0, 0.035);
  backdrop-filter: blur(14px);
}

.snapshot-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--event-border);
  color: var(--n-text-color-2);
  font-size: 11px;
  font-weight: 650;
}

.snapshot-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 14px;
}

.snapshot-stat {
  min-width: 0;
  padding: 8px 14px;
  background: transparent;
}

.snapshot-stat + .snapshot-stat {
  border-left: 1px solid var(--event-border);
}

.snapshot-stat:first-child {
  padding-left: 0;
}

.snapshot-stat:last-child {
  padding-right: 0;
}

.snapshot-stat strong,
.snapshot-stat span,
.snapshot-stat small {
  display: block;
}

.snapshot-stat strong {
  color: var(--n-text-color);
  font-size: 26px;
  font-weight: 820;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.snapshot-stat span {
  margin-top: 5px;
  color: var(--n-text-color-2);
  font-size: 12px;
}

.snapshot-stat small {
  margin-top: 4px;
  color: var(--n-text-color-3);
  font-size: 11px;
}

.event-degraded {
  padding: 10px 14px;
  border: 1px solid var(--n-warning-color, #f0a020);
  border-radius: 10px;
  color: var(--n-warning-color, #f0a020);
  background: color-mix(in srgb, var(--n-warning-color, #f0a020) 7%, transparent);
  font-size: 13px;
}

.event-dashboard {
  display: grid;
  grid-template-columns: minmax(410px, 0.9fr) minmax(0, 1.34fr);
  gap: 20px;
  align-items: start;
}

.event-panel {
  min-width: 0;
  padding: 20px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.025);
}

.panel-head {
  min-height: 46px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}

.panel-kicker {
  display: block;
  margin-bottom: 5px;
  color: var(--n-text-color-3);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.025em;
}

.panel-head h2 {
  margin: 0;
  color: var(--n-text-color);
  font-size: 21px;
  font-weight: 790;
  line-height: 1.22;
  letter-spacing: -0.018em;
}

.panel-count,
.panel-more {
  flex: 0 0 auto;
  color: var(--n-text-color-3);
  font-size: 12px;
}

.panel-more:hover {
  color: var(--n-primary-color, #d03050);
}

.panel-loading {
  padding: 10px 2px;
}

.standings-groups {
  display: grid;
  gap: 12px;
}

.standings-group {
  padding: 12px;
  border: 1px solid var(--event-border);
  border-radius: 10px;
  background: var(--event-soft);
}

.standings-group > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 9px;
}

.standings-group > header strong {
  color: var(--n-text-color-1);
  font-size: 13px;
}

.standings-group > header span {
  color: var(--n-text-color-3);
  font-size: 11px;
}

.standings-team-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.standings-team {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 9px;
  padding: 8px 9px;
  border-radius: 8px;
  background: var(--n-color, #fff);
}

.standings-team img,
.standings-team__fallback {
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  border-radius: 8px;
}

.standings-team img {
  object-fit: contain;
}

.standings-team__fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--n-text-color-2);
  background: var(--event-border);
  font-size: 10px;
  font-weight: 800;
}

.standings-team > div {
  display: grid;
  min-width: 0;
  gap: 1px;
}

.standings-team strong {
  overflow: hidden;
  color: var(--n-text-color-1);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.standings-team small {
  color: var(--n-text-color-3);
  font-size: 10px;
}

.standings-pending {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border: 1px dashed var(--event-border);
  border-radius: 8px;
  color: var(--n-text-color-3);
}

.standings-pending strong {
  color: var(--n-text-color-1);
  font-size: 16px;
}

.medal-table-wrap {
  overflow-x: auto;
}

.medal-table {
  width: 100%;
  min-width: 460px;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.medal-table th,
.medal-table td {
  padding: 11px 8px;
  border-bottom: 1px solid var(--event-border);
  text-align: center;
}

.medal-table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  border-bottom-color: color-mix(in srgb, var(--event-border) 135%, transparent);
  color: var(--n-text-color-3);
  background: var(--event-surface);
  font-size: 10px;
  font-weight: 760;
  letter-spacing: 0.025em;
}

.medal-table th:nth-child(2),
.medal-table td:nth-child(2) {
  text-align: left;
}

.medal-table tbody tr {
  transition: background 0.14s ease;
}

.medal-table tbody tr:hover {
  background: var(--event-soft);
}

.medal-table tbody tr.is-top-three {
  background: color-mix(in srgb, var(--n-primary-color, #d03050) 2.4%, transparent);
}

.medal-table tbody tr:nth-child(1) .rank-cell {
  color: #b8860b;
}

.medal-table tbody tr:nth-child(2) .rank-cell {
  color: #7d8791;
}

.medal-table tbody tr:nth-child(3) .rank-cell {
  color: #a96328;
}

.rank-cell {
  width: 42px;
  color: var(--n-text-color-2);
  font-size: 15px;
  font-weight: 850;
}

.delegation-cell {
  max-width: 180px;
}

.delegation-cell strong,
.delegation-cell span {
  display: block;
}

.delegation-cell strong {
  color: var(--n-text-color);
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.delegation-cell span {
  margin-top: 3px;
  overflow: hidden;
  color: var(--n-text-color-2);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.medal-number {
  font-weight: 800;
}

.medal-number.gold,
.medal-col.gold {
  color: #b8860b;
}

.medal-number.silver,
.medal-col.silver {
  color: #7d8791;
}

.medal-number.bronze,
.medal-col.bronze {
  color: #a96328;
}

.total-number {
  color: var(--n-text-color);
  font-weight: 850;
}

.schedule-head {
  align-items: center;
}

.schedule-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.schedule-controls input {
  box-sizing: border-box;
  height: 34px;
  padding: 0 10px;
  border: 1px solid var(--event-border);
  border-radius: 7px;
  color: var(--n-text-color);
  background: var(--n-input-color, var(--n-color, #fff));
  font: inherit;
  font-size: 12px;
}

.discipline-select {
  width: 190px;
}

.schedule-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  margin: 0 0 12px;
  border-top: 1px solid var(--event-border);
  border-bottom: 1px solid var(--event-border);
}

.schedule-summary span {
  padding: 8px 12px;
  color: var(--n-text-color-2);
  background: transparent;
  font-size: 11px;
}

.schedule-summary span + span {
  border-left: 1px solid var(--event-border);
}

.schedule-summary strong {
  color: var(--n-text-color);
  font-size: 13px;
  font-weight: 820;
  font-variant-numeric: tabular-nums;
}

.schedule-summary span.is-live {
  color: var(--n-primary-color, #d03050);
}

.schedule-list {
  display: grid;
  gap: 0;
}

.schedule-more {
  width: 100%;
  margin-top: 8px;
  padding: 9px 12px;
  border: 1px dashed var(--event-border);
  border-radius: 8px;
  color: var(--n-text-color-2);
  background: var(--event-soft);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
}

.schedule-more span {
  margin-left: 6px;
  color: var(--n-text-color-3);
  font-weight: 500;
}

.schedule-more:hover {
  color: var(--n-primary-color, #d03050);
  border-color: var(--n-primary-color, #d03050);
}

.schedule-row {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  padding: 13px 8px;
  border-bottom: 1px solid var(--event-border);
  transition: background 0.14s ease;
}

.schedule-row:hover {
  background: var(--event-soft);
}

.schedule-row.is-live {
  background: color-mix(in srgb, var(--n-primary-color, #d03050) 4%, transparent);
  box-shadow: inset 3px 0 0 var(--n-primary-color, #d03050);
}

.schedule-time strong,
.schedule-time span {
  display: block;
}

.schedule-time strong {
  color: var(--n-text-color);
  font-size: 15px;
  font-weight: 820;
  font-variant-numeric: tabular-nums;
}

.schedule-time span {
  margin-top: 3px;
  color: var(--n-text-color-3);
  font-size: 10px;
}

.schedule-title-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.schedule-discipline,
.schedule-state {
  color: var(--n-text-color-3);
  font-size: 10px;
  font-weight: 720;
}

.schedule-state {
  padding-left: 8px;
  border-left: 1px solid var(--event-border);
}

.schedule-state.is-live {
  color: var(--n-primary-color, #d03050);
}

.schedule-main h3 {
  margin: 4px 0 0;
  color: var(--n-text-color);
  font-size: 14px;
  font-weight: 760;
  line-height: 1.42;
}

.schedule-main p {
  margin: 4px 0 0;
  color: var(--n-text-color-3);
  font-size: 11px;
  line-height: 1.48;
}

.result-link {
  padding: 6px 0 6px 10px;
  border-left: 1px solid var(--event-border);
  font-size: 11px;
  white-space: nowrap;
}

.stages-panel {
  padding-bottom: 18px;
}

.stage-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.stage-card {
  min-width: 0;
  padding: 13px;
  border: 1px solid var(--event-border);
  border-radius: 10px;
  background: var(--event-soft);
}

.stage-card__head {
  display: grid;
  gap: 4px;
  margin-bottom: 9px;
}

.stage-card__head strong {
  color: var(--n-text-color-1);
  font-size: 14px;
}

.stage-card__head span {
  color: var(--n-primary-color, #d03050);
  font-size: 11px;
  font-weight: 700;
}

.stage-card p {
  margin: 0;
  color: var(--n-text-color-2);
  font-size: 11px;
  line-height: 1.5;
}

.stage-card small {
  display: block;
  margin-top: 7px;
  color: var(--n-text-color-3);
  font-size: 10px;
  line-height: 1.45;
}

.news-panel {
  padding-bottom: 20px;
}

.news-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.news-card {
  position: relative;
  min-width: 0;
  padding: 18px 18px 17px;
  border: 1px solid var(--event-border);
  border-radius: 10px;
  color: inherit;
  background: color-mix(in srgb, var(--event-soft) 54%, var(--event-surface));
  text-decoration: none;
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease;
}

.news-card:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--n-primary-color, #d03050) 48%, var(--event-border));
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.045);
}

.news-card__meta {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: var(--n-text-color-3);
  font-size: 10px;
}

.news-card h3 {
  margin: 10px 0 0;
  color: var(--n-text-color);
  font-size: 16px;
  font-weight: 760;
  line-height: 1.5;
  letter-spacing: -0.012em;
}

.news-card p {
  display: -webkit-box;
  margin: 8px 0 0;
  overflow: hidden;
  color: var(--n-text-color-2);
  font-size: 12px;
  line-height: 1.65;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.news-card__open {
  display: inline-block;
  margin-top: 10px;
  color: var(--n-primary-color, #d03050);
  font-size: 11px;
  font-weight: 700;
}

.event-source-note {
  display: flex;
  gap: 10px;
  padding: 14px 4px 0;
  border-top: 1px solid var(--event-border);
  color: var(--n-text-color-3);
  font-size: 11px;
  line-height: 1.65;
}

.event-source-note strong {
  flex: 0 0 auto;
  color: var(--n-text-color-2);
}

@media (max-width: 1080px) {
  .event-hero {
    grid-template-columns: 1fr;
  }

  .event-hero__snapshot {
    max-width: none;
  }

  .event-dashboard {
    grid-template-columns: 1fr;
  }

  .stage-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .news-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .event-hub {
    gap: 12px;
  }

  .event-hero,
  .event-panel {
    border-radius: 11px;
  }

  .event-hero {
    gap: 18px;
    padding: 18px;
  }

  .event-hero h1 {
    font-size: 29px;
  }

  .event-hero__meta {
    display: grid;
    gap: 5px;
  }

  .event-hero__meta span + span::before {
    display: none;
  }

  .event-hero__actions {
    flex-wrap: wrap;
  }

  .snapshot-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .snapshot-stat {
    padding: 10px 7px;
  }

  .snapshot-stat strong {
    font-size: 19px;
  }

  .event-panel {
    padding: 14px;
  }

  .schedule-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .schedule-controls {
    width: 100%;
  }

  .schedule-controls label {
    flex: 1 1 45%;
  }

  .schedule-controls input,
  .discipline-select {
    width: 100%;
  }

  .schedule-row {
    grid-template-columns: 58px minmax(0, 1fr);
    gap: 8px;
  }

  .result-link {
    grid-column: 2;
    justify-self: start;
    padding-left: 0;
  }

  .stage-grid {
    grid-template-columns: 1fr;
  }

  .news-grid {
    grid-template-columns: 1fr;
  }

  .event-source-note {
    display: block;
  }

  .event-source-note strong {
    display: block;
    margin-bottom: 3px;
  }
}

@media (max-width: 460px) {
  .standings-team-grid {
    grid-template-columns: 1fr;
  }

  .snapshot-grid {
    grid-template-columns: 1fr;
  }

  .snapshot-stat,
  .snapshot-stat:first-child,
  .snapshot-stat:last-child {
    display: grid;
    grid-template-columns: minmax(44px, auto) 1fr;
    align-items: baseline;
    gap: 4px 10px;
    padding: 10px 0;
  }

  .snapshot-stat + .snapshot-stat {
    border-top: 1px solid var(--event-border);
    border-left: 0;
  }

  .snapshot-stat small {
    grid-column: 2;
    margin-top: 0;
  }
}
</style>
