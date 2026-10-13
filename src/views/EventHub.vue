<template>
  <section
    class="event-hub"
    :class="{
      'is-dark': store.siteTheme === 'dark',
      'is-aichi-event': eventSlug === 'aichi-nagoya-2026',
      'is-lol-event': isLolEvent,
      'is-worlds-event': eventSlug === 'worlds-2026',
      'is-demacia-event': eventSlug === 'demacia-cup-2026',
    }"
  >
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
      <LolEventHero v-if="isLolEvent" :active-id="eventSlug" :locale="locale" :title="localizedEventTitle" :eyebrow="eventUi.eyebrow" :status="eventData?.status" :status-label="eventData ? statusLabel(eventData.status) : ''" :logo="eventConfig?.hero?.logo" :edition="lolHeroEditionMark" :demacia="eventSlug === 'demacia-cup-2026'" :meta="lolHeroMeta" :description="eventUi.description" :links="lolHeroLinks" :services-label="liveDashboardCopy.eventServices">
        <template #tools><button v-if="eventData && eventData.status !== 'completed'" type="button" class="event-refresh-button" :class="{ 'is-loading': loading || scheduleLoading || topicLoading }" :disabled="loading || scheduleLoading || topicLoading" :title="refreshError || liveDashboardCopy.refreshNow" :aria-label="liveDashboardCopy.refreshNow" @click="refreshEventHubNow"><n-icon class="event-refresh-button__icon" :component="Refresh" aria-hidden="true" /><span>{{ liveDashboardCopy.refreshNow }}</span></button></template>
        <template #watch><Worlds2026Watch v-if="eventSlug === 'worlds-2026'" :locale="locale" /><EventWatchLinks v-else :platforms="lolHeroWatchPlatforms" :locale="locale" :kind="eventData?.status === 'completed' ? 'replay' : 'live'" /></template>
      </LolEventHero>
      <section v-else class="event-hero">
        <span
          v-if="eventSlug === 'aichi-nagoya-2026'"
          class="event-hero__palette"
          aria-hidden="true"
        >
          <i class="is-red"></i>
          <i class="is-purple"></i>
          <i class="is-green"></i>
          <i class="is-gold"></i>
          <i class="is-ocher"></i>
        </span>
        <div class="event-hero__topbar">
          <div class="event-hero__eyebrow">
            <span
              v-if="eventSlug === 'aichi-nagoya-2026'"
              class="event-hero__edition-label"
            >
              20TH ASIAN GAMES · AICHI–NAGOYA 2026
            </span>
            <span v-else>{{ eventUi.eyebrow || copy.eventCenter }}</span>
            <span
              v-if="eventData"
              class="event-status"
              :class="`is-${eventData.status || 'active'}`"
            >
              {{ statusLabel(eventData.status) }}
            </span>
          </div>
          <div v-if="eventData && eventData.status !== 'completed'" class="event-hero__ops">
            <button
              v-if="eventData && eventData.status !== 'completed'"
              type="button"
              class="event-refresh-button"
              :class="{ 'is-loading': loading || scheduleLoading || topicLoading }"
              :disabled="loading || scheduleLoading || topicLoading"
              :title="refreshError || liveDashboardCopy.refreshNow"
              :aria-label="liveDashboardCopy.refreshNow"
              @click="refreshEventHubNow"
            >
              <n-icon
                class="event-refresh-button__icon"
                :component="Refresh"
                aria-hidden="true"
              />
              <span>{{ liveDashboardCopy.refreshNow }}</span>
            </button>

          </div>
        </div>

        <div
          v-if="eventSlug === 'aichi-nagoya-2026'"
          class="event-hero__backdrop"
          aria-hidden="true"
        >
          <svg
            class="event-hero__motion-ribbons"
            viewBox="0 0 1600 320"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              class="event-hero__motion-ribbon is-red"
              d="M-140 226C175 116 330 238 574 186C799 138 929 34 1185 93C1390 140 1511 237 1740 194"
            />
            <path
              class="event-hero__motion-ribbon is-purple"
              d="M-150 166C120 65 360 135 578 225C785 310 1004 253 1191 148C1380 41 1533 87 1748 144"
            />
            <path
              class="event-hero__motion-ribbon is-green"
              d="M-155 280C119 190 316 291 562 252C792 215 954 111 1190 145C1390 174 1532 269 1750 235"
            />
            <path
              class="event-hero__motion-ribbon is-gold"
              d="M-142 111C131 11 355 68 570 143C774 214 964 185 1178 78C1379-22 1536 24 1750 80"
            />
          </svg>
          <DotLottieVue
            class="event-hero__winner"
            src="/animations/aichi-winner-medal.lottie"
            :autoplay="!prefersReducedMotion"
            :loop="!prefersReducedMotion"
            :speed="0.82"
          />
          <span class="event-hero__backdrop-wash"></span>
        </div>

        <div class="event-hero__main">
          <div class="event-hero__identity">
            <h1>{{ localizedEventTitle }}</h1>
            <div v-if="eventData" class="event-hero__meta">
              <div class="event-hero__meta-row is-date">
                <svg
                  class="event-hero__meta-icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M7 3v3M17 3v3M4.5 9.5h15M6 5h12a2 2 0 0 1 2 2v12H4V7a2 2 0 0 1 2-2Z" />
                </svg>
                <span>{{ formatDateRange(eventData.startDate, eventData.endDate) }}</span>
              </div>
              <div class="event-hero__meta-row is-location">
                <svg
                  class="event-hero__meta-icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" />
                  <circle cx="12" cy="10" r="2.25" />
                </svg>
                <span>{{ eventUi.host || eventData.host }} · {{ eventUi.country || eventData.country }}</span>
              </div>
              <div class="event-hero__meta-row is-scale">
                <span
                  v-if="Number.isFinite(Number(eventData.sportCount))"
                  class="event-hero__meta-metric"
                >
                  <svg
                    class="event-hero__meta-icon"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <rect x="4" y="4" width="6" height="6" rx="1.25" />
                    <rect x="14" y="4" width="6" height="6" rx="1.25" />
                    <rect x="4" y="14" width="6" height="6" rx="1.25" />
                    <rect x="14" y="14" width="6" height="6" rx="1.25" />
                  </svg>
                  {{ eventData.sportCount }} {{ copy.sports }}
                </span>
                <span
                  v-if="Number.isFinite(Number(eventData.nocCount))"
                  class="event-hero__meta-metric"
                >
                  <svg
                    class="event-hero__meta-icon"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle cx="9" cy="8" r="3" />
                    <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
                    <circle cx="17" cy="9" r="2.25" />
                    <path d="M15 14.5a4.5 4.5 0 0 1 5.5 4.5" />
                  </svg>
                  {{ eventData.nocCount }} {{ copy.nocs }}
                </span>
                <span
                  v-if="eventData.stages?.length"
                  class="event-hero__meta-metric"
                >
                  {{ eventData.stages.length }} {{ copy.stages }}
                </span>
              </div>
            </div>

            <nav
              v-if="eventData"
              class="event-service-nav"
              :aria-label="liveDashboardCopy.eventServices"
            >
              <header class="event-service-nav__head">
                <strong>{{ liveDashboardCopy.eventServices }}</strong>
              </header>
              <div class="event-service-nav__links">
                <a
                  :href="eventData.officialUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="is-primary"
                >
                  <span>{{ copy.officialSite }}</span>
                  <i aria-hidden="true">↗</i>
                </a>
                <a
                  :href="eventData.resultsUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>{{ eventUi.resultsLabel || copy.officialResults }}</span>
                  <i aria-hidden="true">↗</i>
                </a>
                <a
                  v-if="eventConfig?.brandUrl"
                  :href="eventConfig.brandUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>{{ copy.officialEmblem }}</span>
                  <i aria-hidden="true">↗</i>
                </a>
                <a
                  v-if="eventConfig?.rulesUrl"
                  :href="eventConfig.rulesUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>{{ eventUi.rulesLabel || copy.officialSite }}</span>
                  <i aria-hidden="true">↗</i>
                </a>
                <a
                  v-if="eventConfig?.ticketsUrl"
                  :href="eventConfig.ticketsUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>{{ eventUi.ticketsLabel || copy.officialSite }}</span>
                  <i aria-hidden="true">↗</i>
                </a>
                <a v-for="platform in localizedWatchPlatforms.filter(item => !['live', 'live-replay'].includes(item.kind))" :key="platform.id" :href="platform.url" target="_blank" rel="noopener noreferrer">
                  <span>{{ platform.displayLabel }}</span><i aria-hidden="true">↗</i>
                </a>
                <EventWatchLinks :platforms="localizedWatchPlatforms.filter(item => ['live', 'live-replay'].includes(item.kind))" :locale="locale" />
              </div>
            </nav>

          </div>
        </div>

        <section
          v-if="filteredBriefItems.length"
          class="event-brief-ticker"
          :aria-label="eventUi.worldsBriefLabel || copy.liveBriefs"
        >
          <div class="event-brief-ticker__label">
            <strong>{{ eventUi.worldsBriefLabel || copy.liveBriefs }}</strong>
            <span>{{ eventUi.worldsBriefSource || copy.briefSource }}</span>
          </div>
          <div class="event-brief-ticker__viewport">
            <div
              class="event-brief-ticker__track"
              :class="{ 'is-static': filteredBriefItems.length <= 1 }"
            >
              <a
                v-for="(item, index) in tickerBriefItems"
                :key="`${item.url}-${index}`"
                :href="item.url"
                target="_blank"
                rel="noopener noreferrer"
                class="event-brief-ticker__item"
                :class="{ 'is-new': isNewBrief(item) }"
                :title="item.summary || item.title"
                :aria-hidden="index >= filteredBriefItems.length ? 'true' : undefined"
              >
                <time>{{ formatBriefTime(item.publishedAt) }}</time>
                <i aria-hidden="true"></i>
                <em v-if="isNewBrief(item)">{{ liveDashboardCopy.newBrief }}</em>
                <span>{{ item.title }}</span>
              </a>
            </div>
          </div>
        </section>

      </section>

      <div v-if="degradedModules.length" class="event-degraded" role="status">
        {{ copy.degraded }}：{{ degradedModules.map(moduleLabel).join("、") }}
      </div>

      <section class="event-dashboard" :class="{ 'worlds-workspace': eventSlug === 'worlds-2026', 'is-worlds-schedule-view': eventSlug === 'worlds-2026' && worldsSection === 'schedule' }">
        <section v-if="eventSlug === 'worlds-2026'" v-show="worldsSection !== 'schedule'" class="event-panel worlds-main-shell">
        <div class="worlds-main-head">
          <nav class="worlds-main-tabs" role="group" :aria-label="worldsNavigationCopy.label">
            <button v-for="section in worldsNavigationCopy.sections" :key="section.key" type="button"
              :aria-pressed="worldsSection === section.key || (worldsSection === 'schedule' && section.key === 'bracket')" :class="{ 'is-active': worldsSection === section.key || (worldsSection === 'schedule' && section.key === 'bracket') }"
              @click="selectWorldsSection(section.key)">{{ section.label }}</button>
          </nav>
        </div>
        <div v-show="worldsSection === 'bracket'" class="worlds-bracket-panel" role="tabpanel" :aria-label="worldsNavigationCopy.sections[0]?.label">
          <Worlds2026Bracket :locale="locale" :teams="standingsData?.entries || []" :schedule-items="scheduleData?.items || []" @open-schedule="selectWorldsSection('schedule')"
            :schedule-complete="scheduleScope === 'all' && scheduleData?.total === scheduleData?.items?.length && scheduleData?.total > 0"
            :refresh-key="overview?.generatedAt" />
        </div>
        <div v-show="worldsSection === 'guide'" class="worlds-format-panel" role="tabpanel" :aria-label="worldsNavigationCopy.sections[1]?.label">
          <Worlds2026Guide :locale="locale" :teams="standingsData?.entries || []" :stages="eventData?.stages || []" :stage-date-labels="eventUi.stageDateLabels || {}" :stage-venue-labels="eventUi.stageVenueLabels || {}" />
        </div>
        </section>
        <article
          :id="isLolEvent ? `${eventSlug}-teams` : undefined"
          v-show="eventSlug !== 'worlds-2026'"
          class="event-panel primary-panel"
          :class="primaryModule === 'standings' ? 'standings-panel' : 'medal-panel'"
        >
          <header class="panel-head core-panel-head">
            <div>
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
              <template v-if="eventSearchNeedle">
                {{ filteredMedalStandings.length }} / {{ medalData.total }}
              </template>
              <template v-else>
                {{ medalData.total }}
              </template>
              {{ copy.medalDelegations || copy.delegations }}
              <template v-if="eventData?.nocCount">
                · {{ eventData.nocCount }} {{ copy.nocs }}
              </template>
            </span>
          </header>

          <div v-if="eventSlug === 'worlds-2026' && eventData?.stages?.length" class="worlds-route-compact">
            <div class="worlds-route-compact__head">
              <strong>{{ eventUi.stageTitle || copy.stages }}</strong>
              <span>{{ eventUi.stageKicker || copy.officialSchedule }}</span>
            </div>
            <div class="worlds-route-compact__list">
              <div v-for="(stage, index) in eventData.stages" :key="stage.key" class="worlds-route-compact__item">
                <span class="worlds-route-compact__index">{{ String(index + 1).padStart(2, '0') }}</span>
                <div>
                  <strong>{{ stageLabel(stage) }}</strong>
                  <time>{{ stageDateLabel(stage) }}</time>
                  <small>{{ stageVenueLabel(stage) }}</small>
                </div>
              </div>
            </div>
            <details class="worlds-route-compact__details">
              <summary>{{ eventUi.worldsFormatDetail || '查看完整赛制与赛事路线' }}</summary>
              <Worlds2026Primer :locale="locale" />
            </details>
          </div>

          <template v-if="primaryModule === 'standings'">
            <div v-if="loading && !standingsData" class="panel-loading">
              <n-skeleton text :repeat="8" />
            </div>
            <LolLiveStandings v-else-if="eventSlug === 'demacia-cup-2026'" :locale="locale" :date="selectedDate" :refresh-key="overview?.generatedAt" :fallback-entries="standingsData?.entries || []" @stage-url="demaciaResultsUrl=$event" />
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
                    <span class="standings-team__logo">
                      <img
                        v-if="entry.image"
                        :src="entry.image"
                        :alt="entry.code || entry.name"
                        loading="lazy"
                      />
                      <span v-else class="standings-team__fallback">
                        {{ (entry.code || entry.name || "?").slice(0, 3) }}
                      </span>
                    </span>
                    <div>
                      <div class="standings-team__name-row">
                        <strong>{{ entry.code || entry.name }}</strong>
                        <span
                          v-if="isLolEvent && entry.record"
                          class="standings-team__record"
                          :title="entry.statusLabel || entry.record"
                        >
                          {{ entry.record }}
                        </span>
                        <span
                          v-if="eventSlug === 'worlds-2026'"
                          class="standings-team__seed"
                          :class="{
                            'is-direct': Boolean(worldsDirectQualifier(entry)),
                            'is-pending': !worldsSeedNumber(entry) && !worldsDirectQualifier(entry),
                          }"
                          :title="worldsSeedTitle(entry)"
                        >
                          {{ worldsSeedLabel(entry) }}
                        </span>
                        <span
                          v-if="eventSlug === 'worlds-2026' && worldsDirectQualifier(entry)"
                          class="standings-team__qualifier"
                        >
                          {{ eventUi.directQualifierLabel || "MSI champion berth" }}
                        </span>
                      </div>
                      <small>
                        {{
                          entry.record
                            ? (entry.summary || entry.statusLabel || eventUi.qualifiedLabel || copy.qualified)
                            : (entry.statusLabel === "Qualified" ? (eventUi.qualifiedLabel || copy.qualified) : (entry.statusLabel || eventUi.qualifiedLabel || copy.qualified))
                        }}
                      </small>
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
                    <th class="medal-col gold">
                      <span class="medal-head"><span aria-hidden="true">🥇</span>{{ copy.gold }}</span>
                    </th>
                    <th class="medal-col silver">
                      <span class="medal-head"><span aria-hidden="true">🥈</span>{{ copy.silver }}</span>
                    </th>
                    <th class="medal-col bronze">
                      <span class="medal-head"><span aria-hidden="true">🥉</span>{{ copy.bronze }}</span>
                    </th>
                    <th>{{ copy.total }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in filteredMedalStandings"
                    :key="row.noc"
                    :class="{ 'is-top-three': row.rank <= 3 }"
                  >
                    <td class="rank-cell">{{ row.rankLabel || row.rank }}</td>
                    <td class="delegation-cell">
                      <div class="delegation-identity">
                        <img
                          v-if="nocFlagImage(row.noc)"
                          class="noc-flag-image"
                          :src="nocFlagImage(row.noc)"
                          alt=""
                          aria-hidden="true"
                          loading="lazy"
                          referrerpolicy="no-referrer"
                        />
                        <span
                          v-else
                          class="noc-flag"
                          :class="{ 'is-code-fallback': isNocCodeFallback(row.noc) }"
                          aria-hidden="true"
                        >{{ nocFlag(row.noc) || row.noc }}</span>
                        <span class="delegation-copy">
                          <strong>{{ localizedNocName(row) }}</strong>
                        </span>
                      </div>
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

        <article
          :id="isLolEvent ? `${eventSlug}-schedule` : undefined"
          v-show="eventSlug !== 'worlds-2026' || worldsSection === 'schedule'"
          class="event-panel schedule-panel"
        >
          <header class="panel-head schedule-head core-panel-head">
            <div class="schedule-heading-row">
              <div class="schedule-heading-copy">
                <h2>{{ eventUi.scheduleTitle || copy.schedule }}</h2>
                <button v-if="eventSlug === 'worlds-2026'" type="button" class="worlds-return-bracket" @click="selectWorldsSection('bracket')">← {{ worldsNavigationCopy.sections[0]?.label }}</button>
                <small v-if="eventSlug === 'worlds-2026' && locale.startsWith('zh')" class="worlds-schedule-clock-note">
                  {{ locale === 'zh-TW'
                    ? '選擇日期依賽事當地時間 · 下方為台灣時間（含跨日）'
                    : '选择日期按赛事当地时间 · 下方为北京时间（含跨日）' }}
                </small>
              </div>

            </div>
            <div class="schedule-controls">
              <div class="schedule-scope" role="group" :aria-label="copy.dateScope">
                <button
                  v-for="option in scheduleScopeOptions"
                  :key="option.value"
                  type="button"
                  :class="{ 'is-active': scheduleScope === option.value }"
                  :aria-pressed="scheduleScope === option.value"
                  @click="setScheduleScope(option.value)"
                >
                  {{ option.label }}
                </button>
              </div>
              <div class="schedule-control-row">
                <template v-if="scheduleScope === 'day'">
                  <button
                    type="button"
                    class="schedule-today"
                    :class="{ 'is-active': selectedDate === currentScheduleDate }"
                    @click="showToday"
                  >
                    {{ copy.today }}
                  </button>
                  <button
                    type="button"
                    class="schedule-today"
                    @click="showYesterday"
                  >
                    {{ copy.yesterday }}
                  </button>
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
                </template>
                <template v-else-if="scheduleScope === 'range'">
                  <label class="schedule-range-field">
                    <span>{{ copy.rangeStart }}</span>
                    <input
                      v-model="selectedRangeStart"
                      type="date"
                      :min="eventData?.startDate"
                      :max="selectedRangeEnd || eventData?.endDate"
                      @change="applyScheduleFilters"
                    />
                  </label>
                  <span class="schedule-range-separator" aria-hidden="true">—</span>
                  <label class="schedule-range-field">
                    <span>{{ copy.rangeEnd }}</span>
                    <input
                      v-model="selectedRangeEnd"
                      type="date"
                      :min="selectedRangeStart || eventData?.startDate"
                      :max="eventData?.endDate"
                      @change="applyScheduleFilters"
                    />
                  </label>
                </template>
                <span v-else class="schedule-range-all">
                  {{ formatDateRange(eventData?.startDate, eventData?.endDate) }}
                </span>
                <n-select
                  v-if="disciplineCatalog.length"
                  v-model:value="selectedDiscipline"
                  size="small"
                  :options="disciplineOptions"
                  :placeholder="copy.allSports"
                  :consistent-menu-width="false"
                  class="discipline-select"
                  @update:value="applyScheduleFilters"
                />

              </div>
            </div>
          </header>

          <div class="schedule-status-row">
            <div class="schedule-status-filter" role="group" :aria-label="copy.statusFilter">
              <button
                v-for="option in scheduleStatusOptions"
                :key="option.value"
                type="button"
                :class="{ 'is-active': scheduleStatusFilter === option.value }"
                :aria-pressed="scheduleStatusFilter === option.value"
                @click="setScheduleStatusFilter(option.value)"
              >
                <span>{{ option.label }}</span>
                <small class="schedule-status-count">
                  {{ scheduleStatusCount(option.value) }}
                </small>
              </button>
            </div>
            <div
              class="schedule-order-filter"
              role="group"
              :aria-label="liveDashboardCopy.orderMode"
            >
              <button
                type="button"
                :class="{ 'is-active': scheduleSortDirection === 'asc' }"
                :aria-pressed="scheduleSortDirection === 'asc'"
                @click="setScheduleSortDirection('asc')"
              >
                <span aria-hidden="true">↑</span>
                {{ liveDashboardCopy.timeAscending }}
              </button>
              <button
                type="button"
                :class="{ 'is-active': scheduleSortDirection === 'desc' }"
                :aria-pressed="scheduleSortDirection === 'desc'"
                @click="setScheduleSortDirection('desc')"
              >
                <span aria-hidden="true">↓</span>
                {{ liveDashboardCopy.timeDescending }}
              </button>
            </div>
            <button
              v-if="!isCurrentScheduleContext"
              type="button"
              class="schedule-focus-now"
              @click="returnToCurrentSchedule"
            >
              {{ liveDashboardCopy.locateCurrent }}
            </button>
            <button
              v-if="scheduleBrowseSnapshot"
              type="button"
              class="schedule-focus-now is-secondary"
              @click="restoreScheduleBrowse"
            >
              {{ liveDashboardCopy.restoreFilters }}
            </button>
          </div>

          <p v-if="scheduleData?.isStaticFallback" class="schedule-fallback-note" role="status">{{ locale.startsWith('zh') ? '实时赛程暂不可读；当前回退快照仅覆盖 ' : 'Live schedule unavailable; the static snapshot covers only ' }}{{ scheduleData.snapshotDate }}</p>
          <div v-if="scheduleLoading" class="panel-loading">
            <n-skeleton text :repeat="8" />
          </div>
          <div v-else-if="filteredScheduleItems.length" class="schedule-list">
            <article
              v-for="item in visibleScheduleItems"
              :key="item.id"
              class="schedule-row"
              :class="{
                'is-live': scheduleBucket(item) === 'live',
                'is-completed': scheduleBucket(item) === 'completed',
              }"
              :aria-label="eventSlug === 'demacia-cup-2026' ? `${scheduleSideName(item.home)} vs ${scheduleSideName(item.away)}` : undefined"
            >
              <div class="schedule-time">
                <strong>{{ formatEventTime(item.startAt) }}</strong>
                <span v-if="eventSlug !== 'demacia-cup-2026' || scheduleScope !== 'day'">{{ scheduleScope === "day" ? item.discipline : formatDate(item.startAt) }}</span>
              </div>
              <div class="schedule-main">
                <div class="schedule-title-line">
                  <span class="schedule-discipline">
                    {{ eventSlug === 'demacia-cup-2026' ? /\bBO[1357]\b/i.exec(item.unitName || '')?.[0] || localizedDisciplineName(item) : localizedDisciplineName(item) }}
                  </span>
                  <span
                    class="schedule-state"
                    :class="{ 'is-live': scheduleBucket(item) === 'live' }"
                  >
                    <span class="schedule-state__icon" aria-hidden="true">
                      {{ scheduleStatusIcon(item) }}
                    </span>
                    {{ localizedScheduleStatus(item) }}
                  </span>
                </div>
                <h3 v-if="eventSlug !== 'demacia-cup-2026'">{{ localizedScheduleTitle(item) }}</h3>
                <p v-if="localizedScheduleSubtitle(item)">
                  {{ localizedScheduleSubtitle(item) }}
                </p>
                <div
                  v-if="hasHeadToHeadSides(item)"
                  class="schedule-result"
                  :aria-label="copy.results"
                >
                  <span
                    class="schedule-result__side"
                    :class="{ 'is-winner': item.home?.winner }"
                  >
                    <img
                      v-if="scheduleSideImage(item.home)"
                      :src="scheduleSideImage(item.home)"
                      :alt="scheduleSideName(item.home)"
                      class="schedule-team-logo"
                      loading="lazy"
                      referrerpolicy="no-referrer"
                    />
                    <span
                      v-else-if="item.home?.noc"
                      class="noc-flag"
                      :class="{ 'is-code-fallback': isNocCodeFallback(item.home?.noc) }"
                      aria-hidden="true"
                    >{{ nocFlag(item.home?.noc) }}</span>
                    <span>{{ scheduleSideName(item.home) }}</span>
                  </span>
                  <strong
                    v-if="hasHeadToHeadResult(item)"
                    class="schedule-result__score"
                  >
                    {{ scheduleSideScore(item.home) }}
                    <span aria-hidden="true">:</span>
                    {{ scheduleSideScore(item.away) }}
                  </strong>
                  <strong v-else class="schedule-result__versus">VS</strong>
                  <span
                    class="schedule-result__side is-away"
                    :class="{ 'is-winner': item.away?.winner }"
                  >
                    <span>{{ scheduleSideName(item.away) }}</span>
                    <img
                      v-if="scheduleSideImage(item.away)"
                      :src="scheduleSideImage(item.away)"
                      :alt="scheduleSideName(item.away)"
                      class="schedule-team-logo"
                      loading="lazy"
                      referrerpolicy="no-referrer"
                    />
                    <span
                      v-else-if="item.away?.noc"
                      class="noc-flag"
                      :class="{ 'is-code-fallback': isNocCodeFallback(item.away?.noc) }"
                      aria-hidden="true"
                    >{{ nocFlag(item.away?.noc) }}</span>
                  </span>
                </div>
                <div
                  v-else-if="hasPlacementResults(item)"
                  class="schedule-placements"
                  :aria-label="copy.results"
                >
                  <span
                    v-for="placement in schedulePlacements(item)"
                    :key="placement.rank + ':' + (placement.noc || '') + ':' + (placement.name || '')"
                    class="schedule-placement"
                  >
                    <strong
                      v-if="placementRankLabel(placement)"
                      class="schedule-placement__rank"
                    >
                      {{ placementRankLabel(placement) }}
                    </strong>
                    <span
                      class="noc-flag"
                      :class="{ 'is-code-fallback': isNocCodeFallback(placement.noc) }"
                      aria-hidden="true"
                    >{{ nocFlag(placement.noc) }}</span>
                    <span class="schedule-placement__identity">
                      {{ placementName(placement) }}
                    </span>
                    <b v-if="placement.result" class="schedule-placement__result">
                      {{ placement.result }}
                    </b>
                  </span>
                </div>
              </div>
              <div class="schedule-actions">
                <a
                  v-if="hasDistinctScheduleResult(item)"
                  :href="item.resultUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="result-link"
                >
                  {{ eventUi.resultsLabel || copy.results }}
                </a>
                <EventWatchLinks :platforms="scheduleLiveLinks(item)" :locale="locale" />
                <EventWatchLinks :platforms="scheduleReplayLinks(item)" :locale="locale" kind="replay" />
              </div>
            </article>
            <button
              v-if="hasMoreSchedule"
              type="button"
              class="schedule-more"
              @click="showMoreSchedule"
            >
              {{ copy.showMore }}
              <span>{{ visibleScheduleItems.length }} / {{ filteredScheduleItems.length }}</span>
            </button>
          </div>
          <div
            v-else-if="isLolEvent"
            class="lol-schedule-empty"
          >
            <div class="lol-schedule-empty__mark" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div class="lol-schedule-empty__copy">
              <strong>{{ eventUi.noScheduleTitle || eventUi.noSchedule || copy.noSchedule }}</strong>
              <p>{{ eventUi.noSchedule || copy.noSchedule }}</p>
              <div v-if="eventData?.stages?.length" class="lol-schedule-empty__next">
                <span>{{ stageLabel(eventData.stages[0]) }}</span>
                <b>{{ stageDateLabel(eventData.stages[0]) }}</b>
                <small>{{ stageVenueLabel(eventData.stages[0]) }}</small>
              </div>
            </div>
            <div class="lol-schedule-empty__actions">
              <a
                v-if="eventData?.resultsUrl"
                :href="eventData.resultsUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="lol-schedule-empty__action"
              >
                {{ eventUi.officialScheduleAction || eventUi.resultsLabel || copy.officialResults }}
                <span aria-hidden="true">↗</span>
              </a>
              <a
                v-for="platform in lolAuxiliaryWatchPlatforms"
                :key="platform.id"
                :href="platform.url"
                target="_blank"
                rel="noopener noreferrer"
                class="lol-schedule-empty__action is-secondary"
              >
                {{ platform.displayLabel }}
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
          <n-empty v-else :description="eventUi.noSchedule || copy.noSchedule" />
        </article>
        <aside v-if="eventSlug === 'worlds-2026'" class="event-panel worlds-insights" :aria-label="eventUi.worldsUpdatesTitle || '资讯动态'">
          <header class="worlds-insights__head">
            <div>
              <span class="panel-kicker">{{ eventUi.newsKicker || 'LoL Esports' }}</span>
              <h2>{{ eventUi.worldsUpdatesTitle || '资讯动态' }}</h2>
            </div>
            <span class="worlds-insights__count">{{ filteredWorldsUpdates.length }}</span>
          </header>
          <div class="worlds-insights__tabs" role="group" :aria-label="eventUi.worldsUpdatesTitle || '资讯动态'">
            <button v-for="tab in worldsUpdateTabs" :key="tab.key" type="button"
              :aria-pressed="worldsUpdateFilter === tab.key" :class="{ 'is-active': worldsUpdateFilter === tab.key }"
              @click="worldsUpdateFilter = tab.key; worldsUpdatesVisible = 8">
              {{ tab.label }}
            </button>
          </div>
          <div v-if="loading && !newsData && !briefData" class="panel-loading">
            <n-skeleton text :repeat="5" />
          </div>
          <EventHotRankList v-else-if="worldsUpdateFilter === 'topic' && visibleWorldsUpdates.length" :items="visibleWorldsUpdates" :locale="locale" :offset="0" />
          <div v-else-if="worldsUpdateFilter === 'official' && visibleWorldsUpdates.length" class="worlds-insights__feed" aria-live="polite" tabindex="0" @scroll.passive="loadWorldsUpdatesOnScroll">
            <article v-for="item in visibleWorldsUpdates" :key="item.key"
              class="worlds-insights__item">
              <a class="worlds-insights__primary-link" :href="item.url" target="_blank" rel="nofollow noopener noreferrer"
                :title="item.summary || item.title">
              <n-tooltip v-if="item.summary" trigger="hover" placement="left" :delay="200">
                <template #trigger><strong>{{ item.title }}</strong></template>
                <span>{{ item.summary }}</span>
              </n-tooltip>
              <strong v-else>{{ item.title }}</strong>
              <div class="worlds-insights__meta">
                <time v-if="item.publishedAt">{{ formatWorldsUpdateDate(item.publishedAt) }}</time>
                <span class="worlds-insights__source">{{ item.source }}</span>
                <span class="worlds-insights__kind">{{ item.kind === 'topic' ? (eventUi.worldsTopicTag || '热议') : (eventUi.worldsOfficialTag || '官方') }}</span>
              </div>
              <small v-if="item.sourceCount">{{ item.sourceCount }} {{ copy.sources }} · {{ copy.bestRank }} #{{ item.bestRank || '—' }}</small>
              </a>
              <a v-if="item.alternateOfficialUrl" class="worlds-insights__alternate"
                 :href="item.alternateOfficialUrl" target="_blank" rel="nofollow noopener noreferrer">
                {{ locale.startsWith('zh') ? 'LoL Esports 原文' : 'LoL Esports original' }} ↗
              </a>
            </article>
          </div>
          <div v-else class="worlds-insights__empty">
            {{ worldsUpdateFilter === 'topic'
              ? (eventUi.worldsNoTopics || copy.noTopics)
              : (eventUi.worldsNoNews || copy.noNews) }}
          </div>
          <button v-if="worldsUpdatesCanExpand" class="worlds-insights__more" type="button" @click="worldsUpdatesVisible += 8">
            {{ copy.showMore }} · {{ visibleWorldsUpdates.length }}/{{ filteredWorldsUpdates.length }}
          </button>
        </aside>
        <aside v-if="eventSlug === 'aichi-nagoya-2026'" class="event-panel worlds-insights aichi-insights" :aria-label="aichiArchiveCopy.newsTitle">
          <header class="worlds-insights__head">
            <div>
              <span class="panel-kicker">{{ eventUi.newsKicker || copy.officialUpdates }}</span>
              <h2>{{ aichiArchiveCopy.newsTitle }}</h2>
            </div>
            <span class="worlds-insights__count">{{ filteredAichiUpdates.length }}</span>
          </header>
          <p v-if="isAichiArchived" class="aichi-insights__archive-caption">
            {{ aichiArchiveCopy.ended }}
            <a v-if="eventData?.resultsUrl" :href="eventData.resultsUrl" target="_blank" rel="noopener noreferrer">{{ eventUi.resultsLabel || copy.officialResults }} ↗</a>
          </p>
          <div class="worlds-insights__tabs" role="group" :aria-label="aichiArchiveCopy.newsTitle">
            <button v-for="tab in worldsUpdateTabs" :key="tab.key" type="button"
              :aria-pressed="aichiUpdateFilter === tab.key" :class="{ 'is-active': aichiUpdateFilter === tab.key }"
              @click="aichiUpdateFilter = tab.key; aichiUpdatesVisible = 8">{{ tab.label }}</button>
          </div>
          <p v-if="isAichiArchived && aichiUpdateFilter === 'topic' && archiveTopicData" class="aichi-insights__archive-caption">
            {{ aichiArchiveSupplement.windowLabel }} · {{ archiveTopicData.coverage?.coveredTargets || 0 }}/{{ archiveTopicData.coverage?.targetCount || 8 }} {{ aichiArchiveSupplement.coverageTag }}
          </p>
          <div v-if="(archiveTopicLoading && aichiUpdateFilter === 'topic') || (loading && !newsData && !briefData)" class="panel-loading"><n-skeleton text :repeat="5" /></div>
          <EventHotRankList v-else-if="aichiUpdateFilter === 'topic' && visibleAichiUpdates.length" :items="visibleAichiUpdates" :locale="locale" :offset="0" />
          <div v-else-if="aichiUpdateFilter === 'official' && visibleAichiUpdates.length" class="worlds-insights__feed" aria-live="polite" tabindex="0" @scroll.passive="loadAichiUpdatesOnScroll">
            <article v-for="item in visibleAichiUpdates" :key="item.key" class="worlds-insights__item">
              <a :href="item.url" target="_blank" rel="nofollow noopener noreferrer" class="worlds-insights__primary-link" :title="item.summary || item.title">
                <n-tooltip v-if="item.summary" trigger="hover" placement="left" :delay="200">
                  <template #trigger><strong>{{ item.title }}</strong></template>
                  <span>{{ item.summary }}</span>
                </n-tooltip>
                <strong v-else>{{ item.title }}</strong>
                <div class="worlds-insights__meta">
                  <time v-if="item.publishedAt">{{ formatWorldsUpdateDate(item.publishedAt) }}</time>
                  <span class="worlds-insights__source">{{ item.source }}</span>
                  <span class="worlds-insights__kind">{{ item.kind === 'topic' ? aichiArchiveCopy.topicTag : aichiArchiveCopy.officialTag }}</span>
                </div>
                <small v-if="item.kind === 'topic' && item.sourceCount">
                  <template v-if="item.archiveRank">#{{ item.archiveRank }} · </template>
                  {{ item.sourceCount }} {{ aichiArchiveSupplement.platformTag }} · {{ copy.bestRank }} #{{ item.bestRank || '—' }}
                  <template v-if="item.observedHours"> · {{ item.observedHours }} {{ aichiArchiveSupplement.hourTag }}</template>
                </small>
              </a>
            </article>
          </div>
          <div v-else class="worlds-insights__empty" role="status">{{ isAichiArchived && aichiUpdateFilter === 'topic' ? (archiveTopicError ? aichiArchiveSupplement.loadFailed : aichiArchiveCopy.noHistory) : (aichiUpdateFilter === 'topic' ? copy.noTopics : copy.noNews) }}</div>
          <button v-if="aichiUpdatesCanExpand" class="worlds-insights__more" type="button" @click="aichiUpdatesVisible += 8">
            {{ copy.showMore }} · {{ visibleAichiUpdates.length }}/{{ filteredAichiUpdates.length }}
          </button>
        </aside>
      </section>

      <EventCompetitionGuide
        v-if="eventConfig?.competitionGuide"
        :guide="eventConfig.competitionGuide"
        :locale="locale"
        :section-id="isLolEvent ? `${eventSlug}-stages` : ''"
      />

      <section
        v-else-if="eventSlug !== 'worlds-2026' && eventData?.stages?.length"
        :id="isLolEvent ? `${eventSlug}-stages` : undefined"
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
        <Worlds2026Primer v-if="eventSlug === 'worlds-2026'" :locale="locale" />
        <div class="stage-grid">
          <article
            v-for="(stage, index) in eventData.stages"
            :key="stage.key"
            class="stage-card"
          >
            <div class="stage-card__head">
              <span
                v-if="eventSlug === 'worlds-2026'"
                class="lol-stage-index"
                aria-hidden="true"
              >{{ stage.key === "final" ? "03" : String(index + 1).padStart(2, "0") }}</span>
              <strong>{{ stageLabel(stage) }}</strong>
              <span v-if="stageDateLabel(stage)">{{ stageDateLabel(stage) }}</span>
            </div>
            <p v-if="stageVenueLabel(stage)">
              {{ stageVenueLabel(stage) }}
            </p>
            <small v-if="stageDescription(stage)">{{ stageDescription(stage) }}</small>
            <div
              v-if="eventSlug === 'worlds-2026' && stageBroadcastTime(stage)"
              class="lol-stage-broadcast"
            >
              <span>{{ liveDashboardCopy.watch }}</span>
              <b>{{ stageBroadcastTime(stage) }}</b>
            </div>
          </article>
        </div>
      </section>

      <section
        v-if="eventConfig?.topicKey && eventSlug !== 'worlds-2026' && eventSlug !== 'aichi-nagoya-2026'"
        class="event-panel topic-panel"
      >
        <header class="panel-head core-panel-head">
          <div>
            <h2>{{ eventUi.worldsHotTopicsTitle || copy.hotTopics }}</h2>
          </div>
          <div v-if="topicData" class="topic-panel__status">
            <span>{{ topicData.events?.length || 0 }} {{ copy.topics }}</span>
            <time v-if="topicData.generatedAt">{{ formatUpdatedAt(topicData.generatedAt) }}</time>
          </div>
        </header>

        <p class="topic-panel__lead">{{ eventUi.worldsHotTopicsDescription || copy.topicDescription }}</p>

        <div v-if="topicLoading && !topicData" class="panel-loading">
          <n-skeleton text :repeat="6" />
        </div>
        <div v-else-if="visibleTopicEvents.length" class="topic-grid">
          <article
            v-for="item in visibleTopicEvents"
            :key="item.eventKey"
            class="topic-card"
          >
            <n-popover
              trigger="hover"
              placement="left-start"
              :show-arrow="false"
              :delay="90"
              :style="{ width: '440px', maxWidth: 'calc(100vw - 32px)' }"
            >
              <template #trigger>
                <div
                  class="topic-card__main"
                  :class="{ 'has-media': Boolean(topicPrimarySource(item)?.cover) }"
                >
                  <div
                    v-if="topicPrimarySource(item)?.cover"
                    class="topic-card__media is-previewable"
                  >
                    <n-image
                      class="topic-card__preview-image"
                      :src="getCoverDisplaySrc(topicPrimarySource(item).cover)"
                      :preview-src="getCoverFullSrc(topicPrimarySource(item).cover)"
                      :alt="localizedTopicTitle(item)"
                      lazy
                      object-fit="cover"
                      :img-props="{
                        tabindex: 0,
                        role: 'button',
                        referrerpolicy: COVER_REFERRER_POLICY,
                        onKeydown: handleTopicCoverPreviewKeydown,
                        onError: handleTopicCoverError,
                      }"
                      @error="handleTopicCoverError"
                    />
                  </div>
                  <div class="topic-card__body">
                    <a
                      :href="topicEventUrl(item)"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="topic-card__title-link"
                    >
                      <h3>{{ localizedTopicTitle(item) }}</h3>
                    </a>
                    <span v-if="localizedTopicSummary(item)" class="sr-only">
                      {{ localizedTopicSummary(item) }}
                    </span>
                    <footer class="topic-card__evidence">
                      <div class="topic-source-list">
                        <span
                          v-for="source in topicEvidenceSources(item)"
                          :key="source.sourceKey + ':' + (source.variant || '')"
                          class="topic-source-chip"
                          :title="source.variantLabel || source.sourceName"
                        >
                          <img
                            :src="getSourceLogo(source.sourceKey)"
                            :alt="topicSourceLabel(source)"
                            loading="lazy"
                            @error="handleTopicSourceLogoError"
                          />
                          <span>{{ topicSourceLabel(source) }}</span>
                          <small v-if="source.rank">#{{ source.rank }}</small>
                        </span>
                      </div>
                      <span
                        v-if="topicPrimarySource(item)?.hot"
                        class="topic-heat"
                        :title="copy.heat"
                      >
                        <n-icon
                          class="topic-heat__icon"
                          :component="Fire"
                          aria-hidden="true"
                        />
                        <span class="sr-only">{{ copy.heat }}</span>
                        {{ formatCompactMetric(topicPrimarySource(item).hot, locale.value) }}
                      </span>
                    </footer>
                  </div>
                </div>
              </template>
              <div
                class="topic-card__tooltip"
                :class="{ 'has-media': Boolean(topicPrimarySource(item)?.cover) }"
              >
                <div
                  v-if="topicPrimarySource(item)?.cover"
                  class="topic-card__tooltip-media"
                >
                  <img
                    :src="getCoverDisplaySrc(topicPrimarySource(item).cover)"
                    :alt="localizedTopicTitle(item)"
                    loading="lazy"
                    :referrerpolicy="COVER_REFERRER_POLICY"
                    @error="handleTopicCoverError"
                  />
                </div>
                <div class="topic-card__tooltip-content">
                  <p v-if="localizedTopicSummary(item)">
                    {{ localizedTopicSummary(item) }}
                  </p>
                  <div class="topic-card__tooltip-meta">
                    <span
                      class="topic-trend"
                      :class="'is-' + (item.trend?.signal || 'stable')"
                    >
                      <span aria-hidden="true">{{ topicTrendSymbol(item) }}</span>
                      {{ topicTrendLabel(item) }}
                    </span>
                    <span v-if="item.bestRank">
                      {{ copy.bestRank }} #{{ item.bestRank }}
                    </span>
                    <span v-if="item.sourceCount">
                      {{ item.sourceCount }} {{ copy.sources }}
                    </span>
                  </div>
                </div>
              </div>
            </n-popover>

          </article>
        </div>
        <n-empty v-else :description="eventUi.worldsNoTopics || copy.noTopics" />

        <button
          v-if="hasMoreTopics"
          type="button"
          class="topic-more"
          @click="showMoreTopics"
        >
          {{ copy.showMoreTopics }}
          <span>{{ visibleTopicEvents.length }} / {{ filteredTopicEvents.length }}</span>
        </button>
      </section>

      <section
        v-if="eventSlug !== 'worlds-2026' && eventSlug !== 'aichi-nagoya-2026'"
        :id="isLolEvent ? `${eventSlug}-news` : undefined"
        class="event-panel news-panel"
      >
        <header class="panel-head">
          <div>
            <span class="panel-kicker">{{ eventUi.newsKicker || copy.officialUpdates }}</span>
            <h2>{{ eventUi.newsTitle || copy.news }}</h2>
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
        <div v-else-if="filteredNewsItems.length" class="news-timeline">
          <a
            v-for="item in filteredNewsItems"
            :key="item.url"
            :title="item.title"
            :href="item.url"
            target="_blank"
            rel="noopener noreferrer"
            class="news-timeline__item"
          >
            <div class="news-timeline__rail">
              <time>{{ formatNewsDate(item.publishedAt) }}</time>
              <span class="news-timeline__dot" aria-hidden="true"></span>
            </div>
            <div class="news-timeline__content">
              <div class="news-timeline__meta">
                <span>{{ item.author || copy.officialSite }}</span>
                <span v-if="item.categories?.length">{{ localizedNewsCategory(item) }}</span>
              </div>
              <h3>{{ localizedNewsTitle(item) }}</h3>
              <p v-if="item.summary">{{ localizedNewsSummary(item) }}</p>
              <span class="news-card__open">{{ copy.readOfficial }} →</span>
            </div>
          </a>
        </div>
        <n-empty v-else :description="copy.noNews" />
      </section>

      <footer class="event-source-note">
        <strong>{{ copy.dataSource }}</strong>
        <span>{{ eventUi.sourceNote || copy.dataSourceNote }}</span>
        <small
          v-if="isLolEvent"
          class="lol-riot-disclaimer"
        >
          Wuai Hot isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.
        </small>
      </footer>
    </template>
  </section>
</template>

<script setup>
import { scopedLolFallbackSchedule } from '@/utils/lolFallbackSchedule.mjs';
import LolLiveStandings from '@/components/LolLiveStandings.vue';
import Worlds2026Primer from '@/components/Worlds2026Primer.vue';
import Worlds2026Guide from '@/components/Worlds2026Guide.vue';
import Worlds2026Bracket from '@/components/Worlds2026Bracket.vue';
import Worlds2026Watch from '@/components/Worlds2026Watch.vue';
import EventHotRankList from '@/components/EventHotRankList.vue';
import { WORLDS_2026_NEWS_ZH } from '@/data/events/worlds-2026-primer.mjs';
import { mergeWorldsOfficialStories, worldsOfficialUrlIdentity } from '@/utils/worldsOfficialNews.mjs';
import EventWatchLinks from "@/components/EventWatchLinks.vue";
import { isSameResultsPage } from "@/utils/eventResults.js";
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Fire, Refresh } from "@icon-park/vue-next";
import { useRoute, useRouter } from "vue-router";
import {
  getEventBriefs,
  getEventRegionalNews,
  getEventDisciplineCatalog,
  getEventOverview,
  getEventSchedule,
  getEventScheduleRange,
  getTopicFeed,
  getTopicArchive,
} from "@/api";
import {
  EVENT_REGISTRY,
  EVENT_SERIES,
  buildEventPath,
  getEventLabel,
  getEventTitle,
} from "@/config/events";
import { DATA_REFRESH_EVENT } from "@/utils/dataRefresh";
import {
  isEventNocAlias,
  localizeEventDiscipline,
  localizeEventNoc,
  localizeEventStatus,
  localizeKnownScheduleText,
  normalizeEventTranslatedText,
  shouldTranslateEventFreeText,
} from "@/utils/eventHubLocalization";
import { getLocaleFromRoute, normalizeLocale } from "@/utils/locale";
import {
  COVER_REFERRER_POLICY,
  getCoverDisplaySrc,
  getCoverFullSrc,
} from "@/utils/imageProxy";
import { getSourceLabel } from "@/utils/sourceLabels";
import { getSourceLogo, getSourceLogoFallback } from "@/utils/sourceLogos";
import { formatCompactMetric } from "@/utils/compactMetric";
import { translateReadableTitles } from "@/utils/readableTitles";
import EventCompetitionGuide from "@/components/EventCompetitionGuide.vue";
import LolEventHero from "@/components/LolEventHero.vue";
import { mainStore } from "@/store";

const route = useRoute();
const store = mainStore();
const router = useRouter();
const DotLottieVue = defineAsyncComponent(() =>
  import("@lottiefiles/dotlottie-vue").then((module) => module.DotLottieVue),
);
const prefersReducedMotion = ref(false);
let reducedMotionMediaQuery = null;
const syncReducedMotionPreference = (mediaQuery) => {
  prefersReducedMotion.value = Boolean(mediaQuery?.matches);
};

const eventSlug = computed(() => String(route.params.eventSlug || ""));
const locale = computed(() => normalizeLocale(getLocaleFromRoute(route)));
const eventConfig = computed(
  () => EVENT_REGISTRY.find((item) => item.id === eventSlug.value) || null,
);
const eventSeries = computed(
  () => EVENT_SERIES[eventConfig.value?.seriesId] || null,
);
const isLolEvent = computed(
  () => eventConfig.value?.seriesId === "league-of-legends",
);
const eventSeriesEvents = computed(() => {
  const seriesId = eventConfig.value?.seriesId;
  if (!seriesId) return [];
  return EVENT_REGISTRY.filter((item) => item.seriesId === seriesId && !item.archived)
    .slice()
    .sort((left, right) => Number(left.seriesOrder || 999) - Number(right.seriesOrder || 999));
});
const eventSeriesLabel = computed(() => {
  const labels = eventSeries.value?.labels || {};
  return labels[locale.value] || labels["zh-CN"] || eventSeries.value?.id || "";
});
const lolHeroEditionMark = computed(
  () => eventConfig.value?.hero?.editionMark || "",
);
const lolHeroMeta = computed(() => {
  const data = eventData.value;
  if (!data) return [];
  return [
    formatDateRange(data.startDate,data.endDate),
    [eventUi.value.host || data.host,eventUi.value.country || data.country].filter(Boolean).join(" · "),
    standingsData.value?.total ? standingsData.value.total+" "+(eventUi.value.qualifiedTeamsShort || eventUi.value.qualifiedLabel || copy.value.qualified) : "",
    standingsData.value?.pendingCount ? standingsData.value.pendingCount+" "+(eventUi.value.pendingSlotsShort || eventUi.value.pendingLabel || copy.value.pending) : "",
    data.stages?.length ? data.stages.length+" "+copy.value.stages : "",
  ];
});
const demaciaResultsUrl = ref('');
const lolHeroLinks = computed(() => {
  const data = eventData.value;
  if (!data) return [];
  if (eventSlug.value === 'worlds-2026') {
    const officialPage = 'https://lolesports.com/en-US/tournament/115660540725177488/overview';
    const officialSchedule = 'https://lolesports.com/en-US/schedule?leagues=worlds';
    return [
      {url:officialPage,label:'LoL Esports',children:[
        {url:officialPage,label:copy.value.officialSite},
        {url:officialSchedule,label:eventUi.value.resultsLabel || copy.value.officialResults},
        {url:eventConfig.value?.rulesUrl,label:eventUi.value.rulesLabel || copy.value.officialSite},
        ...(data.status !== 'completed' ? [{url:eventConfig.value?.ticketsUrl,label:eventUi.value.ticketsLabel || copy.value.officialSite}] : []),
      ].filter(item=>item.url)},
      {url:'https://lpl.qq.com/',label:locale.value==='zh-TW'?'LPL 賽事官網':locale.value==='zh-CN'?'LPL 赛事官网':'LPL Official'},
    ];
  }
  const links = [
    {url:data.officialUrl,label:copy.value.officialSite},
    {url:eventSlug.value === 'demacia-cup-2026' && demaciaResultsUrl.value || data.resultsUrl,label:eventUi.value.resultsLabel || copy.value.officialResults},
    {url:eventConfig.value?.rulesUrl,label:eventUi.value.rulesLabel || copy.value.officialSite},
    ...(data.status !== "completed" ? [{url:eventConfig.value?.ticketsUrl,label:eventUi.value.ticketsLabel || copy.value.officialSite}] : []),
    ...localizedWatchPlatforms.value.filter(item=>!["live","live-replay"].includes(item.kind)).map(item=>({url:item.url,label:item.displayLabel})),
  ];
  return links.filter((link,index)=>link.url && links.findIndex(other=>isSameResultsPage(other.url,link.url))===index);
});
const lolHeroWatchPlatforms = computed(() => localizedWatchPlatforms.value.filter(item=>eventData.value?.status === "completed" ? item.kind === "live-replay" : ["live","live-replay"].includes(item.kind)));


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
    officialEmblem: "官方会徽与视觉",
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
    trendingIntel: "全网趋势情报",
    hotTopics: "亚运热门话题",
    topicDescription: "聚合公开热榜中的亚运相关热议，按榜位、热度与来源证据持续更新；与官方赛事资讯分开呈现。",
    topicSummary: "摘要",
    topics: "条话题",
    sources: "个平台",
    bestRank: "最高榜位",
    heat: "热度",
    noTopics: "暂未发现可展示的亚运热门话题",
    showMoreTopics: "查看更多话题",
    trendNew: "新上榜",
    trendRising: "上升",
    trendFalling: "回落",
    trendReentry: "重返",
    trendStable: "持续",
    officialData: "官方奖牌数据",
    medalTable: "奖牌榜",
    delegations: "代表团",
    medalDelegations: "获牌代表团",
    rank: "排名",
    delegation: "代表团",
    gold: "金",
    silver: "银",
    bronze: "铜",
    total: "总计",
    noMedals: "暂无奖牌数据",
    officialSchedule: "官方赛程",
    schedule: "赛程与比赛结果",
    date: "日期",
    dateScope: "赛程日期范围",
    dayScope: "单日",
    rangeScope: "日期范围",
    allDatesScope: "全部赛程",
    rangeStart: "开始",
    rangeEnd: "结束",
    today: "今日",
    yesterday: "昨日",
    statusFilter: "赛程状态",
    allStatuses: "全部",
    allSports: "全部项目",
    searchSchedule: "搜索项目 / 比赛 / 场馆",
    searchEvent: "搜索赛事、代表团、话题…",
    scheduleSummary: "赛程统计",
    totalEvents: "场 / 单元",
    live: "进行中",
    results: "成绩",
    noSchedule: "当前筛选暂无赛程",
    showMore: "显示更多",
    liveBriefs: "快报",
    briefHeadline: "刚刚发生",
    briefSource: "央视网",
    officialUpdates: "官方动态",
    news: "赛事资讯",
    readOfficial: "查看官方原文",
    readSource: "查看原文",
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
    officialEmblem: "Official emblem & identity",
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
    trendingIntel: "Open-web trend intelligence",
    hotTopics: "Trending Asian Games topics",
    topicDescription: "Tracks Asian Games conversations across public ranking surfaces using rank, heat and source evidence, separately from official event news.",
    topicSummary: "Summary",
    topics: "topics",
    sources: "platforms",
    bestRank: "Best rank",
    heat: "Heat",
    noTopics: "No trending Asian Games topics are available right now",
    showMoreTopics: "Show more topics",
    trendNew: "New",
    trendRising: "Rising",
    trendFalling: "Falling",
    trendReentry: "Re-entry",
    trendStable: "Ongoing",
    officialData: "Official medal data",
    medalTable: "Medal table",
    delegations: "delegations",
    medalDelegations: "medal-winning delegations",
    rank: "Rank",
    delegation: "Delegation",
    gold: "Gold",
    silver: "Silver",
    bronze: "Bronze",
    total: "Total",
    noMedals: "No medal data",
    officialSchedule: "Official schedule",
    schedule: "Schedule & results",
    date: "Date",
    dateScope: "Schedule date range",
    dayScope: "Day",
    rangeScope: "Range",
    allDatesScope: "All dates",
    rangeStart: "From",
    rangeEnd: "To",
    today: "Today",
    yesterday: "Yesterday",
    statusFilter: "Match status",
    allStatuses: "All",
    allSports: "All sports",
    searchSchedule: "Search sport / event / venue",
    searchEvent: "Search event, delegation or topic…",
    scheduleSummary: "Schedule summary",
    totalEvents: "events / units",
    live: "live",
    results: "Results",
    noSchedule: "No schedule matches this filter",
    showMore: "Show more schedule",
    liveBriefs: "Live brief",
    briefHeadline: "What just happened",
    briefSource: "CCTV live bulletin",
    officialUpdates: "Official updates",
    news: "Event news",
    readOfficial: "Read official",
    readSource: "View source",
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
    officialEmblem: "官方會徽與視覺",
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
    trendingIntel: "全網趨勢情報",
    hotTopics: "亞運熱門話題",
    topicDescription: "彙整公開熱榜中的亞運相關熱議，依榜位、熱度與來源證據持續更新；與官方賽事資訊分開呈現。",
    topicSummary: "摘要",
    topics: "則話題",
    sources: "個平台",
    bestRank: "最高榜位",
    heat: "熱度",
    noTopics: "目前沒有可顯示的亞運熱門話題",
    showMoreTopics: "查看更多話題",
    trendNew: "新上榜",
    trendRising: "上升",
    trendFalling: "回落",
    trendReentry: "重返",
    trendStable: "持續",
    officialData: "官方獎牌資料",
    medalTable: "獎牌榜",
    delegations: "代表團",
    medalDelegations: "獲牌代表團",
    rank: "排名",
    delegation: "代表團",
    gold: "金",
    silver: "銀",
    bronze: "銅",
    total: "總計",
    noMedals: "暫無獎牌資料",
    officialSchedule: "官方賽程",
    schedule: "賽程與比賽結果",
    date: "日期",
    dateScope: "賽程日期範圍",
    dayScope: "單日",
    rangeScope: "日期範圍",
    allDatesScope: "全部賽程",
    rangeStart: "開始",
    rangeEnd: "結束",
    today: "今日",
    yesterday: "昨日",
    statusFilter: "賽程狀態",
    allStatuses: "全部",
    allSports: "全部項目",
    searchSchedule: "搜尋項目 / 比賽 / 場館",
    searchEvent: "搜尋賽事、代表團或話題…",
    scheduleSummary: "賽程統計",
    totalEvents: "場 / 單元",
    live: "進行中",
    results: "成績",
    noSchedule: "目前篩選暫無賽程",
    showMore: "顯示更多",
    liveBriefs: "賽事快報",
    briefHeadline: "剛剛發生",
    briefSource: "央視網即時播報",
    officialUpdates: "官方動態",
    news: "賽事資訊",
    readOfficial: "查看官方原文",
    readSource: "查看原文",
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
    officialEmblem: "公式エンブレム",
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
    trendingIntel: "公開トレンド情報",
    hotTopics: "アジア大会の注目トピック",
    topicDescription: "公開ランキング上のアジア大会関連トピックを、順位・熱度・情報源の証拠とともに追跡し、公式ニュースとは分けて表示します。",
    topicSummary: "要約",
    topics: "件",
    sources: "プラットフォーム",
    bestRank: "最高順位",
    heat: "熱度",
    noTopics: "現在表示できる注目トピックはありません",
    showMoreTopics: "トピックをさらに表示",
    trendNew: "新着",
    trendRising: "上昇",
    trendFalling: "下降",
    trendReentry: "再登場",
    trendStable: "継続",
    officialData: "公式メダルデータ",
    medalTable: "メダル順位",
    delegations: "代表団",
    medalDelegations: "メダル獲得代表団",
    rank: "順位",
    delegation: "代表団",
    gold: "金",
    silver: "銀",
    bronze: "銅",
    total: "合計",
    noMedals: "メダルデータはありません",
    officialSchedule: "公式日程",
    schedule: "競技日程と結果",
    date: "日付",
    dateScope: "日程範囲",
    dayScope: "1日",
    rangeScope: "期間",
    allDatesScope: "全日程",
    rangeStart: "開始",
    rangeEnd: "終了",
    today: "今日",
    yesterday: "昨日",
    statusFilter: "試合状況",
    allStatuses: "すべて",
    allSports: "全競技",
    searchSchedule: "競技 / 試合 / 会場を検索",
    searchEvent: "大会・代表団・話題を検索…",
    scheduleSummary: "日程集計",
    totalEvents: "試合 / ユニット",
    live: "進行中",
    results: "結果",
    noSchedule: "該当する日程はありません",
    showMore: "日程をさらに表示",
    liveBriefs: "速報",
    briefHeadline: "最新動向",
    briefSource: "CCTV速報",
    officialUpdates: "公式情報",
    news: "大会ニュース",
    readOfficial: "公式記事を見る",
    readSource: "原文を見る",
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
    officialEmblem: "공식 엠블럼",
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
    trendingIntel: "공개 웹 트렌드 정보",
    hotTopics: "아시안게임 인기 화제",
    topicDescription: "공개 순위에서 아시안게임 관련 화제를 순위, 열기, 출처 근거와 함께 추적하며 공식 대회 뉴스와 분리해 표시합니다.",
    topicSummary: "요약",
    topics: "개 화제",
    sources: "개 플랫폼",
    bestRank: "최고 순위",
    heat: "열기",
    noTopics: "현재 표시할 아시안게임 인기 화제가 없습니다",
    showMoreTopics: "화제 더 보기",
    trendNew: "신규",
    trendRising: "상승",
    trendFalling: "하락",
    trendReentry: "재진입",
    trendStable: "지속",
    officialData: "공식 메달 데이터",
    medalTable: "메달 순위",
    delegations: "대표단",
    medalDelegations: "메달 획득 대표단",
    rank: "순위",
    delegation: "대표단",
    gold: "금",
    silver: "은",
    bronze: "동",
    total: "합계",
    noMedals: "메달 데이터가 없습니다",
    officialSchedule: "공식 일정",
    schedule: "경기 일정 및 결과",
    date: "날짜",
    dateScope: "일정 날짜 범위",
    dayScope: "하루",
    rangeScope: "기간",
    allDatesScope: "전체 일정",
    rangeStart: "시작",
    rangeEnd: "종료",
    today: "오늘",
    yesterday: "어제",
    statusFilter: "경기 상태",
    allStatuses: "전체",
    allSports: "전체 종목",
    searchSchedule: "종목 / 경기 / 경기장 검색",
    searchEvent: "대회·대표단·화제 검색…",
    scheduleSummary: "일정 요약",
    totalEvents: "경기 / 단위",
    live: "진행 중",
    results: "결과",
    noSchedule: "조건에 맞는 일정이 없습니다",
    showMore: "일정 더 보기",
    officialUpdates: "공식 업데이트",
    news: "대회 뉴스",
    readOfficial: "공식 원문 보기",
    readSource: "원문 보기",
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

const NOC_FLAG_ISO2 = {
  AFG: "AF", BAN: "BD", BHU: "BT", BRN: "BH", BRU: "BN", CAM: "KH",
  CHN: "CN", HKG: "HK", INA: "ID", IND: "IN", IRI: "IR", IRQ: "IQ",
  JOR: "JO", JPN: "JP", KAZ: "KZ", KGZ: "KG", KOR: "KR", KSA: "SA",
  KUW: "KW", LAO: "LA", LBN: "LB", MAC: "MO", MAS: "MY", MDV: "MV",
  MGL: "MN", MYA: "MM", NEP: "NP", OMA: "OM", PAK: "PK", PHI: "PH",
  PLE: "PS", PRK: "KP", QAT: "QA", SGP: "SG", SRI: "LK", SYR: "SY",
  THA: "TH", TJK: "TJ", TKM: "TM", TLS: "TL", TPE: "TW", UAE: "AE",
  UZB: "UZ", VIE: "VN", YEM: "YE",
};
const NOC_SPECIAL_FLAG_URLS = {
  TPE: "https://results.asiangames2026.org/assets/png/TPE.aW91im8V.png",
};
const COMPLETED_SCHEDULE_STATUSES = new Set(["OFFICIAL", "UNOFFICIAL"]);
const SCHEDULE_WINDOW_SIZE = 6;
const UPCOMING_SCHEDULE_STATUSES = new Set([
  "SCHEDULED",
  "START_LIST",
  "RESCHEDULED",
  "GETTING_READY",
  "DELAYED",
]);

const overview = ref(null);
const medalData = ref(null);
const standingsData = ref(null);
const scheduleData = ref(null);
const newsData = ref(null);
const briefData = ref(null);
const regionalNewsData = ref(null);
const newBriefUrls = ref(new Set());
const topicData = ref(null);
const archiveTopicData = ref(null);
const archiveTopicLoading = ref(false);
const archiveTopicError = ref('');
const translatedEventText = ref({});
let eventTranslationVersion = 0;
const loading = ref(false);
const scheduleLoading = ref(false);
const topicLoading = ref(false);
const scheduleVisibleCount = ref(SCHEDULE_WINDOW_SIZE);
const topicVisibleCount = ref(8);
const scheduleStatusFilter = ref("all");
const scheduleSortDirection = ref(
  String(route.query.sort || "") === "desc" ? "desc" : "asc",
);
const scheduleBrowseSnapshot = ref(null);
const fatalError = ref("");
const refreshError = ref("");
const disciplineCatalog = ref([]);
const hydratedScheduleResultDates = new Set();
let scheduleResultHydrationVersion = 0;
const initialScheduleScope = ["range", "all"].includes(String(route.query.scope || ""))
  ? String(route.query.scope)
  : "day";
const scheduleScope = ref(initialScheduleScope);
const selectedDate = ref(
  typeof route.query.date === "string" ? route.query.date : "",
);
const selectedRangeStart = ref(
  typeof route.query.from === "string" ? route.query.from : "",
);
const selectedRangeEnd = ref(
  typeof route.query.to === "string" ? route.query.to : "",
);
const selectedDiscipline = ref(
  typeof route.query.discipline === "string" ? route.query.discipline : "",
);
const eventSearchQuery = computed(() =>
  String(Array.isArray(route.query.q) ? route.query.q[0] || "" : route.query.q || "").trim(),
);

const eventData = computed(() => overview.value?.event || null);
const worldsSection = ref('bracket');
const selectWorldsSection = (key) => {
  worldsSection.value = key;
  if (key === 'schedule' && scheduleScope.value === 'day') {
    scheduleScope.value = 'all';
    if (eventData.value) void loadSchedule(false);
  }
};
const worldsNavigationCopy = computed(() => {
 const labels={
  'zh-CN':{label:'赛事导航',sections:[['bracket','赛事对阵'],['guide','观赛指南']],teamAction:'参赛队伍与赛区种子'},
  'zh-TW':{label:'賽事導覽',sections:[['bracket','賽事對陣'],['guide','觀賽指南']],teamAction:'參賽隊伍與種子'},
  en:{label:'Tournament navigation',sections:[['bracket','Brackets & matches'],['guide','Viewing guide']],teamAction:'Teams and regional seeds'},
  ja:{label:'大会ナビ',sections:[['bracket','対戦・日程'],['guide','観戦ガイド']],teamAction:'出場チームとシード'},
  ko:{label:'경기 탐색',sections:[['bracket','대진 및 일정'],['guide','관전 가이드']],teamAction:'출전 팀과 시드'}
 };
 const copy=labels[locale.value]||labels.en;
 return {...copy,sections:copy.sections.map(([key,label])=>({key,label}))};
});
const LIVE_DASHBOARD_COPY = {
  "zh-CN": {
    eventUpdates: "赛事更新",
    autoRefresh: "独立自动",
    globalRefresh: "全局自动",
    refreshPaused: "全局已暂停",
    refreshDelayed: "更新暂缓",
    refreshNow: "刷新",
    refreshOff: "关闭自动",
    refresh30s: "30 秒",
    refresh60s: "60 秒",
    refresh2m: "2 分钟",
    eventServices: "赛事导航",
    serviceTip: "官方信息与观看入口",
    official: "官网",
    results: "成绩",
    identity: "视觉",
    watch: "观看",
    findLive: "查找直播",
    findReplay: "查找回看",
    briefPaging: "快报翻页",
    previous: "上一页",
    next: "下一页",
    newBrief: "新",
    orderMode: "赛程排序",
    timeAscending: "正序",
    timeDescending: "倒序",
    locateCurrent: "定位当前",
    restoreFilters: "恢复筛选",
  },
  en: {
    eventUpdates: "Event updates",
    autoRefresh: "Independent",
    globalRefresh: "Global auto",
    refreshPaused: "Global paused",
    refreshDelayed: "Update delayed",
    refreshNow: "Refresh",
    refreshOff: "Auto off",
    refresh30s: "30 sec",
    refresh60s: "60 sec",
    refresh2m: "2 min",
    eventServices: "Event links",
    serviceTip: "Official info and viewing",
    official: "Official",
    results: "Results",
    identity: "Identity",
    watch: "Watch",
    findLive: "Find live",
    findReplay: "Find replay",
    briefPaging: "Brief paging",
    previous: "Previous",
    next: "Next",
    newBrief: "New",
    orderMode: "Schedule order",
    timeAscending: "Ascending",
    timeDescending: "Descending",
    locateCurrent: "Locate current",
    restoreFilters: "Restore filters",
  },
  "zh-TW": {
    eventUpdates: "賽事更新",
    autoRefresh: "獨立自動",
    globalRefresh: "全域自動",
    refreshPaused: "全域已暫停",
    refreshDelayed: "更新暫緩",
    refreshNow: "重新整理",
    refreshOff: "關閉自動",
    refresh30s: "30 秒",
    refresh60s: "60 秒",
    refresh2m: "2 分鐘",
    eventServices: "賽事導航",
    serviceTip: "官方資訊與觀看入口",
    official: "官網",
    results: "成績",
    identity: "視覺",
    watch: "觀看",
    findLive: "查找直播",
    findReplay: "查找回看",
    briefPaging: "快報翻頁",
    previous: "上一頁",
    next: "下一頁",
    newBrief: "新",
    orderMode: "賽程排序",
    timeAscending: "正序",
    timeDescending: "倒序",
    locateCurrent: "定位目前",
    restoreFilters: "恢復篩選",
  },
  ja: {
    eventUpdates: "大会更新",
    autoRefresh: "個別自動",
    globalRefresh: "全体自動",
    refreshPaused: "全体更新停止",
    refreshDelayed: "更新保留中",
    refreshNow: "更新",
    refreshOff: "自動更新オフ",
    refresh30s: "30 秒",
    refresh60s: "60 秒",
    refresh2m: "2 分",
    eventServices: "大会ナビ",
    serviceTip: "公式情報と視聴入口",
    official: "公式",
    results: "結果",
    identity: "デザイン",
    watch: "視聴",
    findLive: "配信を探す",
    findReplay: "見逃しを探す",
    briefPaging: "速報ページ",
    previous: "前へ",
    next: "次へ",
    newBrief: "新着",
    orderMode: "日程順",
    timeAscending: "昇順",
    timeDescending: "降順",
    locateCurrent: "現在へ",
    restoreFilters: "絞り込み復元",
  },
  ko: {
    eventUpdates: "대회 업데이트",
    autoRefresh: "개별 자동",
    globalRefresh: "전체 자동",
    refreshPaused: "전체 일시정지",
    refreshDelayed: "업데이트 지연",
    refreshNow: "새로고침",
    refreshOff: "자동 끄기",
    refresh30s: "30초",
    refresh60s: "60초",
    refresh2m: "2분",
    eventServices: "대회 바로가기",
    serviceTip: "공식 정보와 시청 바로가기",
    official: "공식",
    results: "결과",
    identity: "디자인",
    watch: "시청",
    findLive: "라이브 찾기",
    findReplay: "다시보기 찾기",
    briefPaging: "속보 페이지",
    previous: "이전",
    next: "다음",
    newBrief: "신규",
    orderMode: "일정 정렬",
    timeAscending: "오름차순",
    timeDescending: "내림차순",
    locateCurrent: "현재 위치",
    restoreFilters: "필터 복원",
  },
};
const liveDashboardCopy = computed(
  () => LIVE_DASHBOARD_COPY[locale.value] || LIVE_DASHBOARD_COPY["zh-CN"],
);
const localizedWatchPlatforms = computed(() =>
  (eventConfig.value?.watchPlatforms || [])
    .filter(
      (platform) =>
        !Array.isArray(platform.locales) ||
        platform.locales.length === 0 ||
        platform.locales.includes(locale.value),
    )
    .map((platform) => ({
      ...platform,
      displayLabel:
        platform.label?.[locale.value] ||
        platform.label?.["zh-CN"] ||
        platform.id,
      replayDisplayLabel:
        platform.replayLabel?.[locale.value] ||
        platform.replayLabel?.["zh-CN"] ||
        platform.label?.[locale.value] ||
        platform.label?.["zh-CN"] ||
        platform.id,
    })),
);
const hasDistinctScheduleResult = (item) =>
  Boolean(item.resultUrl && item.showResults && scheduleBucket(item) === "completed") &&
  (!isLolEvent.value || !isSameResultsPage(item.resultUrl, eventData.value?.resultsUrl));
const scheduleLiveLinks = (item) => {
  if (!["live", "upcoming"].includes(scheduleBucket(item))) return [];
  const configured =
    eventConfig.value?.matchLive?.[String(item?.id || "")] || [];
  const precise = (Array.isArray(configured) ? configured : [])
    .filter((platform) => String(platform?.url || "").trim())
    .map((platform) => ({
      ...platform,
      displayLabel:
        platform?.label?.[locale.value] ||
        platform?.label?.["zh-CN"] ||
        platform?.label ||
        platform?.id ||
        liveDashboardCopy.value.findLive,
    }));
  if (precise.length) return precise;
  return localizedWatchPlatforms.value.filter((platform) =>
    ["live", "live-replay"].includes(platform.kind),
  );
};
const replayWatchPlatform = computed(
  () =>
    localizedWatchPlatforms.value.find((platform) =>
      ["replay", "live-replay"].includes(platform.kind),
    ) || null,
);
const normalizeScheduleTeamKey = (value) =>
  String(value || "").trim().toUpperCase();
const scheduleTeamLookup = computed(() => {
  const lookup = new Map();
  for (const entry of standingsData.value?.entries || []) {
    for (const value of [entry?.id, entry?.code, entry?.name, entry?.summary]) {
      const key = normalizeScheduleTeamKey(value);
      if (key) lookup.set(key, entry);
    }
  }
  return lookup;
});
const scheduleSideTeam = (side) => {
  if (!isLolEvent.value || !side) return null;
  for (const value of [side?.id, side?.code, side?.name]) {
    const key = normalizeScheduleTeamKey(value);
    if (key && scheduleTeamLookup.value.has(key)) {
      return scheduleTeamLookup.value.get(key);
    }
  }
  return null;
};
const scheduleSideImage = (side) =>
  String(scheduleSideTeam(side)?.image || "").trim();
const scheduleReplayLinks = (item) => {
  if (scheduleBucket(item) !== "completed") return [];
  const configured =
    eventConfig.value?.matchReplays?.[String(item?.id || "")] || [];
  const precise = (Array.isArray(configured) ? configured : [])
    .filter((replay) => String(replay?.url || "").trim())
    .map((replay) => ({
      ...replay,
      fallback: false,
      displayLabel:
        replay?.label?.[locale.value] ||
        replay?.label?.["zh-CN"] ||
        replay?.label ||
        replay?.id ||
        liveDashboardCopy.value.findReplay,
    }));
  if (precise.length) return precise;
  const fallback = replayWatchPlatform.value;
  return fallback
    ? [
        {
          ...fallback,
          fallback: true,
          displayLabel:
            fallback.replayDisplayLabel ||
            fallback.displayLabel ||
            liveDashboardCopy.value.findReplay,
        },
      ]
    : [];
};
const lolAuxiliaryWatchPlatforms = computed(() =>
  isLolEvent.value
    ? localizedWatchPlatforms.value.filter((platform) =>
        ["bilibili-lol", "bilibili-match"].includes(platform.id),
      )
    : [],
);
const degradedModules = computed(() =>
  Array.isArray(overview.value?.degradedModules)
    ? overview.value.degradedModules
    : [],
);
const primaryModule = computed(
  () => eventData.value?.primaryModule || (standingsData.value ? "standings" : "medals"),
);

// These are confirmed regional qualification seeds for completed paths.
// HLE is LCK's No. 2 seed and also holds the MSI champion direct berth.
// CBLOL final on Oct 10 confirmed LOS No. 1 (Swiss) and FUR No. 2 (Play-In).
// LCS 2026 Oct 3–4 official schedule confirms LYON beat C9 then TLAW beat LYON; ranked TLAW / LYON / C9.
const WORLDS_2026_REGIONAL_SEEDS = Object.freeze({
  LCK: Object.freeze({ GEN: 1, HLE: 2, T1: 3, DK: 4 }),
  LPL: Object.freeze({ AL: 1, BLG: 2, TES: 3, IG: 4 }),
  LCS: Object.freeze({ TLAW: 1, LYON: 2, C9: 3 }),
  LEC: Object.freeze({ G2: 1, MKOI: 2, KC: 3 }),
  LCP: Object.freeze({ TSW: 1, CFO: 2, MVK: 3 }),
  CBLOL: Object.freeze({ LOS: 1, FUR: 2 }),
});
const WORLDS_2026_DIRECT_QUALIFIERS = Object.freeze({
  LCK: Object.freeze({ HLE: "msi-champion" }),
});
const worldsSeedKey = (entry) => {
  const group = String(entry?.group || entry?.groupName || "").toUpperCase();
  const code = String(entry?.code || entry?.name || "").toUpperCase();
  return { group, code };
};
const worldsSeedNumber = (entry) => {
  if (eventSlug.value !== "worlds-2026") return null;
  const { group, code } = worldsSeedKey(entry);
  const seed = WORLDS_2026_REGIONAL_SEEDS[group]?.[code];
  return Number.isFinite(Number(seed)) ? Number(seed) : null;
};
const worldsDirectQualifier = (entry) => {
  if (eventSlug.value !== "worlds-2026") return "";
  const { group, code } = worldsSeedKey(entry);
  return WORLDS_2026_DIRECT_QUALIFIERS[group]?.[code] || "";
};
const worldsSeedNumberLabel = (seed) => {
  if (!seed) return eventUi.value.seedPendingLabel || "order TBD";
  if (locale.value === "zh-CN") return `${seed}号种子`;
  if (locale.value === "zh-TW") return `${seed}號種子`;
  if (locale.value === "ja") return `第${seed}シード`;
  if (locale.value === "ko") return `${seed}번 시드`;
  return `Seed ${seed}`;
};
const worldsSeedLabel = (entry) =>
  worldsSeedNumberLabel(worldsSeedNumber(entry));
const worldsSeedTitle = (entry) => {
  const seed = worldsSeedNumber(entry);
  return [
    worldsSeedNumberLabel(seed),
    worldsDirectQualifier(entry)
      ? eventUi.value.directQualifierLabel || "MSI champion berth"
      : "",
    eventUi.value.worldsSeedPendingNote || "",
  ]
    .filter(Boolean)
    .join(" · ");
};
const worldsSeedSortValue = (entry) =>
  worldsSeedNumber(entry) ?? Number.POSITIVE_INFINITY;

const standingsGroups = computed(() => {
  const groups = new Map();
  for (const entry of standingsData.value?.entries || []) {
    const key = entry.group || entry.groupName || copy.value.qualifiedTeams;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  }
  return [...groups.entries()].map(([name, entries]) => ({
    name,
    entries:
      eventSlug.value === "worlds-2026"
        ? entries.slice().sort((a, b) => {
            const aSeed = worldsSeedSortValue(a);
            const bSeed = worldsSeedSortValue(b);
            return aSeed - bSeed;
          })
        : entries,
  }));
});
const scheduleBucket = (item) => {
  const status = String(item?.status || "").toUpperCase();
  if (item?.isLive) return "live";
  if (COMPLETED_SCHEDULE_STATUSES.has(status)) return "completed";
  // The Display API exposes an explicit effective isLive contract. A raw
  // RUNNING status can still be future-dated and is therefore upcoming when
  // the backend has deliberately normalized isLive=false.
  if (UPCOMING_SCHEDULE_STATUSES.has(status) || status === "RUNNING") {
    return "upcoming";
  }
  return "other";
};
const scheduleScopeOptions = computed(() => [
  { value: "day", label: copy.value.dayScope },
  { value: "range", label: copy.value.rangeScope },
  { value: "all", label: copy.value.allDatesScope },
]);
const scheduleStatusOptions = computed(() => [
  { value: "all", label: copy.value.allStatuses },
  { value: "live", label: copy.value.live },
  { value: "completed", label: copy.value.completed },
  { value: "upcoming", label: copy.value.upcoming },
]);
const scheduleStartTime = (item) => {
  const value = Date.parse(String(item?.startAt || ""));
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
};
const scheduleEndTime = (item) => {
  const value = Date.parse(String(item?.endAt || item?.startAt || ""));
  return Number.isFinite(value) ? value : Number.MIN_SAFE_INTEGER;
};
const eventSearchNeedle = computed(() =>
  eventSearchQuery.value.trim().toLocaleLowerCase(),
);
const matchesEventSearch = (...values) => {
  const query = eventSearchNeedle.value;
  if (!query) return true;
  return values
    .flat()
    .filter(Boolean)
    .some((value) => String(value).toLocaleLowerCase().includes(query));
};
const scheduleSearchMatchedItems = computed(() => {
  const items = Array.isArray(scheduleData.value?.items)
    ? scheduleData.value.items
    : [];
  if (!eventSearchNeedle.value) return items;
  return items.filter((item) =>
    matchesEventSearch(
      localizedDisciplineName(item),
      localizedScheduleTitle(item),
      localizedScheduleSubtitle(item),
      item?.venue,
      item?.venueName,
      item?.location,
      item?.locationName,
    ),
  );
});
const scheduleStatusCounts = computed(() => {
  const counts = {
    all: scheduleSearchMatchedItems.value.length,
    live: 0,
    completed: 0,
    upcoming: 0,
  };
  for (const item of scheduleSearchMatchedItems.value) {
    const bucket = scheduleBucket(item);
    if (Object.prototype.hasOwnProperty.call(counts, bucket)) {
      counts[bucket] += 1;
    }
  }
  return counts;
});
const scheduleStatusCount = (value) =>
  scheduleStatusCounts.value[value] ?? 0;
const filteredScheduleItems = computed(() =>
  scheduleStatusFilter.value === "all"
    ? scheduleSearchMatchedItems.value
    : scheduleSearchMatchedItems.value.filter(
        (item) => scheduleBucket(item) === scheduleStatusFilter.value,
      ),
);
const orderedScheduleItems = computed(() => {
  const items = filteredScheduleItems.value;
  if (!items.length) return [];
  return [...items].sort((left, right) => {
    const delta = scheduleStartTime(left) - scheduleStartTime(right);
    if (delta !== 0) {
      return scheduleSortDirection.value === "desc" ? -delta : delta;
    }
    const endDelta = scheduleEndTime(left) - scheduleEndTime(right);
    return scheduleSortDirection.value === "desc" ? -endDelta : endDelta;
  });
});
watch(eventSearchQuery, () => {
  scheduleVisibleCount.value = SCHEDULE_WINDOW_SIZE;
  topicVisibleCount.value = 8;
});

const visibleScheduleItems = computed(() =>
  orderedScheduleItems.value.slice(0, scheduleVisibleCount.value),
);
const hasMoreSchedule = computed(
  () => visibleScheduleItems.value.length < orderedScheduleItems.value.length,
);
const filteredTopicEvents = computed(() => {
  const items = Array.isArray(topicData.value?.events) ? topicData.value.events : [];
  if (!eventSearchNeedle.value) return items;
  return items.filter((item) =>
    matchesEventSearch(
      localizedTopicTitle(item),
      localizedTopicSummary(item),
      item?.title,
      item?.summary,
      item?.sources?.map?.((source) => source?.label || source?.sourceLabel || source?.source),
    ),
  );
});
const visibleTopicEvents = computed(() =>
  filteredTopicEvents.value.slice(0, topicVisibleCount.value),
);
const hasMoreTopics = computed(
  () => visibleTopicEvents.value.length < filteredTopicEvents.value.length,
);
const filteredBriefItems = computed(() => {
  const items = Array.isArray(briefData.value?.items) ? briefData.value.items : [];
  if (!eventSearchNeedle.value) return items;
  return items.filter((item) =>
    matchesEventSearch(item?.title, item?.summary, item?.author, item?.categories),
  );
});
const tickerBriefItems = computed(() => {
  const items = filteredBriefItems.value;
  if (items.length <= 1) return items;
  return [...items, ...items];
});
const filteredNewsItems = computed(() => {
  const items = Array.isArray(newsData.value?.items) ? newsData.value.items : [];
  if (!eventSearchNeedle.value) return items;
  return items.filter((item) =>
    matchesEventSearch(
      localizedNewsTitle(item),
      localizedNewsSummary(item),
      item?.title,
      item?.summary,
      item?.author,
      item?.categories,
    ),
  );
});
const aichiArchiveCopy = computed(() => ({
  'zh-CN': { newsTitle: '赛事资讯', ended: '赛后归档 · 本届赛事已于 10 月 4 日结束', noHistory: '赛期历史快照已保存，但目前没有符合归档筛选条件的可展示话题。', officialTag: '官方', topicTag: '热议' },
  'zh-TW': { newsTitle: '賽事資訊', ended: '賽後歸檔 · 本屆賽事已於 10 月 4 日結束', noHistory: '已保存賽期歷史快照，目前沒有符合歸檔條件的話題。', officialTag: '官方', topicTag: '熱議' },
  en: { newsTitle: 'Event Updates', ended: 'Event archive · concluded October 4', noHistory: 'Historical snapshots exist, but no eligible archived topic is available for this filter.', officialTag: 'Official', topicTag: 'Trending' },
  ja: { newsTitle: '大会ニュース', ended: '大会アーカイブ · 10月4日終了', noHistory: '大会期間の履歴は保存されていますが、表示対象の話題はありません。', officialTag: '公式', topicTag: '話題' },
  ko: { newsTitle: '대회 소식', ended: '대회 기록 · 10월 4일 종료', noHistory: '대회 기간 기록은 저장되어 있으나 표시할 대상 화제가 없습니다.', officialTag: '공식', topicTag: '화제' },
})[locale.value] || {
  newsTitle: '赛事资讯', ended: '赛后归档 · 本届赛事已于 10 月 4 日结束',
  noHistory: '赛期热点历史记录尚不可审计。', officialTag: '官方', topicTag: '热议',
});
const aichiArchiveSupplement = computed(() => ({
  'zh-CN': { windowLabel: '赛期热点总榜 · 9月19日—10月4日（日本时间）', coverageTag: '来源覆盖', platformTag: '平台', hourTag: '小时样本', loadFailed: '赛期历史榜暂时无法加载，请稍后重试；不会以当前榜单冒充赛时排名。' },
  'zh-TW': { windowLabel: '賽期話題總榜 · 9月19日—10月4日（日本時間）', coverageTag: '來源覆蓋', platformTag: '平台', hourTag: '小時樣本', loadFailed: '賽期歷史榜暫時無法載入，不會以即時榜單代替歷史。' },
  en: { windowLabel: 'Event-period topics · Sep 19–Oct 4 (JST)', coverageTag: 'sources covered', platformTag: 'platforms', hourTag: 'sampled hours', loadFailed: 'Archived ranking is temporarily unavailable. Live charts are not historical evidence.' },
  ja: { windowLabel: '大会期間の話題総合榜 · 9月19日〜10月4日（JST）', coverageTag: '対象データ源', platformTag: '媒体', hourTag: '観測時間', loadFailed: '過去のランキングを取得できません。現在の順位で代用しません。' },
  ko: { windowLabel: '대회 기간 화제 종합 · 9월 19일–10월 4일 (JST)', coverageTag: '출처 범위', platformTag: '플랫폼', hourTag: '관측 시간', loadFailed: '대회 기간 순위를 불러올 수 없습니다. 현재 순위로 대체하지 않습니다.' },
})[locale.value] || { windowLabel: '赛期热点总榜 · 9月19日—10月4日', coverageTag: '来源覆盖', platformTag: '平台', hourTag: '小时样本', loadFailed: '赛期历史榜暂时不可用。' });
const aichiUpdateFilter = ref('topic');
const aichiUpdatesVisible = ref(8);
const aichiUnifiedUpdates = computed(() => {
  const byUrl = new Map();
  const official = [
    ...(Array.isArray(briefData.value?.items) ? briefData.value.items : []).map(item => ({
      item, title: String(item?.title || '').trim(), summary: String(item?.summary || '').trim(),
      source: String(item?.author || copy.value.briefSource || 'CCTV'),
    })),
    ...filteredNewsItems.value.map(item => ({
      item, title: localizedNewsTitle(item), summary: localizedNewsSummary(item) || '',
      source: String(item?.author || eventUi.value.newsKicker || copy.value.officialUpdates),
    })),
  ];
  for (const {item,title,summary,source} of official) {
    const identity = worldsOfficialUrlIdentity(item?.url);
    if (!identity || !title) continue;
    const row = {key:'official:'+identity,kind:'official',url:item.url,title,summary,
      source,publishedAt:String(item.publishedAt || '')};
    if (!byUrl.has(identity) || Date.parse(row.publishedAt) > Date.parse(byUrl.get(identity).publishedAt)) byUrl.set(identity,row);
  }
  const topics = isAichiArchived.value
    ? (Array.isArray(archiveTopicData.value?.events) ? archiveTopicData.value.events : []).map((item, index) => ({
      key: 'archive-topic:' + item.eventKey, kind: 'topic',
      url: item.sources?.find(source => /^https?:\/\//.test(source.url))?.url || '',
      title: item.title, summary: '',
      publishedAt: item.firstSeenAt || '',
      source: (item.sourceCount || 1) + ' ' + aichiArchiveSupplement.value.platformTag,
      sourceCount: item.sourceCount || 0, bestRank: item.bestRank || null,
      archiveRank: index + 1, observedHours: item.observedHours || 0,
      score: Number.isFinite(Number(item.score)) ? Number(item.score) : null,
      scoreMethod: item.scoreMethod || '', evidenceSources: item.sources || [],
    })).filter(item => item.url && item.title)
    : filteredTopicEvents.value.map(item => ({
    key:'topic:'+String(item.eventKey || topicEventUrl(item)),kind:'topic',url:topicEventUrl(item),
    title:localizedTopicTitle(item),summary:localizedTopicSummary(item)||'',
    source:topicPrimarySource(item)?.sourceName || aichiArchiveCopy.value.topicTag,
    publishedAt:'',sourceCount:item.sourceCount||0,bestRank:item.bestRank||null,
  })).filter(item => item.url && item.title);
  return [...byUrl.values()].sort((a,b) =>
    (Date.parse(b.publishedAt)||0)-(Date.parse(a.publishedAt)||0) || a.title.localeCompare(b.title)
  ).concat(topics);
});
const filteredAichiUpdates = computed(() => aichiUnifiedUpdates.value.filter(item =>
  (aichiUpdateFilter.value === 'all' || item.kind === aichiUpdateFilter.value)
  && (!eventSearchNeedle.value || matchesEventSearch(item.title,item.summary,item.source))
));
const visibleAichiUpdates = computed(() => filteredAichiUpdates.value.slice(0,aichiUpdatesVisible.value));
const aichiUpdatesCanExpand = computed(() => filteredAichiUpdates.value.length > aichiUpdatesVisible.value);
const loadAichiUpdatesOnScroll = (event) => {
  const box=event.target;
  if (box && aichiUpdatesCanExpand.value && box.scrollTop+box.clientHeight >= box.scrollHeight-100) aichiUpdatesVisible.value+=8;
};
const worldsUpdateFilter = ref("topic");
const worldsUpdatesVisible = ref(8);
const worldsUpdateTabs = computed(() => {
  const labels = {
    "zh-CN": ["全部", "官方动态", "热议榜"],
    "zh-TW": ["全部", "官方動態", "熱議榜"],
    en: ["All", "Official updates", "Trending ranking"],
    ja: ["すべて", "公式情報", "話題ランキング"],
    ko: ["전체", "공식 소식", "화제 순위"],
  };
  const [, official, topic] = labels[locale.value] || labels["zh-CN"];
  return [{ key: "topic", label: topic }, { key: "official", label: official }];
});
const worldsUpdateUrlIdentity = worldsOfficialUrlIdentity;
const worldsUnifiedUpdates = computed(() => {
  const officialCandidates = [];
  for (const item of [
    ...(locale.value === 'zh-CN' && Array.isArray(regionalNewsData.value?.items) ? regionalNewsData.value.items : []),
    ...(Array.isArray(briefData.value?.items) ? briefData.value.items : []),
    ...(Array.isArray(newsData.value?.items) ? newsData.value.items : []),
  ]) {
    const identity = worldsUpdateUrlIdentity(item?.url);
    const originalTitle = String(item?.title || "").trim();
    if (!identity || !originalTitle) continue;
    const title = locale.value === "zh-CN" && WORLDS_2026_NEWS_ZH[originalTitle]
      ? WORLDS_2026_NEWS_ZH[originalTitle] : originalTitle;
    const rawSummary = String(item?.summary || "").trim();
    const summary = locale.value === "zh-CN" && WORLDS_2026_NEWS_ZH[rawSummary]
      ? WORLDS_2026_NEWS_ZH[rawSummary] : rawSummary;
    officialCandidates.push({
      key: identity, kind: "official", url: String(item.url), title,
      summary: summary || "",
      publishedAt: String(item?.publishedAt || ""),
      source: String(item?.author || "LoL Esports"),
    });
  }
  const official = mergeWorldsOfficialStories(officialCandidates,locale.value);
  const officialIds = new Set(officialCandidates.map(item => worldsUpdateUrlIdentity(item.url)));
  const topics = [];
  for (const item of Array.isArray(topicData.value?.events) ? topicData.value.events : []) {
    const url = topicEventUrl(item);
    const title = localizedTopicTitle(item);
    const identity = worldsUpdateUrlIdentity(url);
    if (!identity || !title || officialIds.has(identity)) continue;
    topics.push({
      key: "topic:" + String(item.eventKey || identity), kind: "topic", url,
      title, summary: localizedTopicSummary(item) || "",
      publishedAt: "", source: topicPrimarySource(item)?.sourceName || (eventUi.value.worldsTopicTag || "热议"),
      sourceCount: item.sourceCount || 0, bestRank: item.bestRank || null,
      score: item.score != null && Number.isFinite(Number(item.score)) ? Number(item.score) : null,
      scoreMethod: item.scoreMethod || '', evidenceSources: item.sources || [],
    });
  }
  return [...official, ...topics].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "topic" ? 1 : -1;
    const when = (v) => Number.isFinite(Date.parse(v.publishedAt)) ? Date.parse(v.publishedAt) : 0;
    return when(b) - when(a) || a.title.localeCompare(b.title);
  });
});
const filteredWorldsUpdates = computed(() => {
  const filtered = worldsUnifiedUpdates.value.filter((item) => {
    if (worldsUpdateFilter.value !== "all" && item.kind !== worldsUpdateFilter.value) return false;
    return !eventSearchNeedle.value || matchesEventSearch(item.title, item.summary, item.source);
  });
  return filtered;
});
const visibleWorldsUpdates = computed(() => filteredWorldsUpdates.value.slice(0, worldsUpdatesVisible.value));
const loadWorldsUpdatesOnScroll = (event) => {
  const element=event.target;
  if (!element || !worldsUpdatesCanExpand.value) return;
  if (element.scrollTop + element.clientHeight >= element.scrollHeight - 100) worldsUpdatesVisible.value += 8;
};
const worldsUpdatesCanExpand = computed(() => filteredWorldsUpdates.value.length > worldsUpdatesVisible.value);
const worldsDisplayTimeZone = computed(() => ({
  'zh-CN':'Asia/Shanghai','zh-TW':'Asia/Taipei',ja:'Asia/Tokyo',ko:'Asia/Seoul',
})[locale.value] || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
const formatWorldsUpdateDate = (value) => {
  const raw = String(value || "");
  if (!raw) return "";
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(raw + "T12:00:00Z") : new Date(raw);
  if (!Number.isFinite(parsed.getTime())) return "";
  const opts = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? { month: "short", day: "numeric", timeZone: "UTC" }
    : { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: worldsDisplayTimeZone.value };
  return new Intl.DateTimeFormat(localeTag.value, opts).format(parsed);
};
const isAichiArchived = computed(() =>
  eventSlug.value === "aichi-nagoya-2026" && Date.now() >= Date.parse("2026-10-05T00:00:00+09:00")
);
const isNewBrief = (item) => newBriefUrls.value.has(String(item?.url || ""));
const currentScheduleDate = computed(() => {
  const fallback = String(overview.value?.today || "").slice(0, 10);
  try {
    const eventDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: eventData.value?.timezone || "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const start = String(eventData.value?.startDate || "").slice(0, 10);
    const end = String(eventData.value?.endDate || "").slice(0, 10);
    if ((!start || eventDate >= start) && (!end || eventDate <= end)) {
      return eventDate;
    }
  } catch {
    // Fall through to the backend-provided event date.
  }
  return fallback;
});
const isCurrentScheduleContext = computed(() => {
  const today = currentScheduleDate.value;
  return (
    scheduleScope.value === "day" &&
    Boolean(today) &&
    selectedDate.value === today &&
    !selectedDiscipline.value &&
    scheduleStatusFilter.value === "all"
  );
});
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
const stageDescription = (stage) =>
  eventUi.value.stageDescriptions?.[stage?.key] ||
  (locale.value === "en" ? stage?.description || "" : "");
const stageBroadcastTime = (stage) =>
  eventUi.value.stageBroadcastTimes?.[stage?.key] || "";
const stageDateLabel = (stage) =>
  eventUi.value.stageDateLabels?.[stage?.key] || stage?.dateLabel || "";
const stageVenueLabel = (stage) =>
  eventUi.value.stageVenueLabels?.[stage?.key] ||
  [stage?.venue, stage?.location].filter(Boolean).join(" · ");

const localizedNocName = (row) =>
  localizeEventNoc(
    eventSlug.value,
    row?.noc,
    row?.name || row?.noc,
    locale.value,
  );
const filteredMedalStandings = computed(() => {
  const rows = Array.isArray(medalData.value?.standings)
    ? medalData.value.standings
    : [];
  if (!eventSearchNeedle.value) return rows;
  return rows.filter((row) =>
    matchesEventSearch(localizedNocName(row), row?.name, row?.noc),
  );
});

const nocFlag = (noc) => {
  const normalizedNoc = String(noc || "").toUpperCase();
  if (NOC_SPECIAL_FLAG_URLS[normalizedNoc]) return "";
  const iso2 = NOC_FLAG_ISO2[normalizedNoc];
  if (!iso2) return "";
  return [...iso2]
    .map((letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)))
    .join("");
};
const nocFlagImage = (noc) =>
  NOC_SPECIAL_FLAG_URLS[String(noc || "").toUpperCase()] || "";
const isNocCodeFallback = (noc) =>
  !nocFlag(noc) && !nocFlagImage(noc);

const scheduleSideName = (side) => {
  if (!side) return "";
  if (side.noc) {
    return localizeEventNoc(
      eventSlug.value,
      side.noc,
      side.name || side.noc,
      locale.value,
    );
  }
  return String(side.name || "").trim();
};

const scheduleSideScore = (side) => {
  const value = String(side?.result ?? "").trim();
  return value || "–";
};

const hasHeadToHeadSides = (item) =>
  Boolean(
    String(item?.home?.name || item?.home?.noc || "").trim() &&
      String(item?.away?.name || item?.away?.noc || "").trim(),
  );

const hasHeadToHeadResult = (item) =>
  Boolean(
    hasHeadToHeadSides(item) &&
      (String(item.home.result ?? "").trim() ||
        String(item.away.result ?? "").trim()),
  );

const schedulePlacements = (item) =>
  (Array.isArray(item?.placements) ? item.placements : [])
    .filter((placement) => Number(placement?.rank) > 0)
    .slice(0, 3);

const hasPlacementResults = (item) => schedulePlacements(item).length > 0;

const placementRankLabel = (placement) => {
  const medalLabel = ({
    ME_GOLD: "🥇",
    ME_SILVER: "🥈",
    ME_BRONZE: "🥉",
  })[String(placement?.medal || "").toUpperCase()];
  if (medalLabel) return medalLabel;

  const rank = Number(placement?.rank);
  // The official live feed can expose high-900 sentinel ranks while a
  // placement is still unresolved. Never turn those internal sort values
  // into user-visible "#998 / #999" pseudo-rankings.
  if (!Number.isInteger(rank) || rank <= 0 || rank >= 900) return "";
  return `#${rank}`;
};

const placementName = (placement) => {
  const noc = String(placement?.noc || "").trim();
  const country = noc
    ? localizeEventNoc(eventSlug.value, noc, noc, locale.value)
    : "";
  const name = String(placement?.name || "").trim();
  const displayName = isEventNocAlias(
    eventSlug.value,
    noc,
    name,
    locale.value,
  )
    ? ""
    : name;
  return [country, displayName].filter(Boolean).join(" · ") || "—";
};

const scheduleStatusIcon = (item) => {
  const status = String(item?.status || "").toUpperCase();
  if (item?.isLive) return "●";
  if (COMPLETED_SCHEDULE_STATUSES.has(status)) return "✓";
  if (status === "CANCELLED" || status === "CANCELED") return "×";
  if (status === "INTERRUPTED") return "‖";
  if (status === "RESCHEDULED") return "↻";
  if (status === "DELAYED") return "!";
  if (UPCOMING_SCHEDULE_STATUSES.has(status) || status === "RUNNING") {
    return "○";
  }
  return "•";
};

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
  if (String(item?.status || "").toUpperCase() === "RUNNING") {
    return copy.value.upcoming;
  }
  return localizeEventStatus(
    eventSlug.value,
    item?.status,
    item?.statusLabel || statusLabel(item?.status),
    locale.value,
  );
};

const scheduleTextKey = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[\s·・:：,，.。()（）\[\]【】\-–—~～〜]/g, "");

const scheduleTextInformationScore = (value) => {
  const text = String(value || "").trim();
  if (!text) return Number.NEGATIVE_INFINITY;
  const key = scheduleTextKey(text);
  const generic =
    /^(?:决赛|半决赛|四分之一决赛|预赛|资格赛|第\d+(?:场|轮|组)|比赛\d*|男子|女子|混合)$/.test(
      key,
    );
  return key.length - (generic ? 100 : 0);
};

const localizedScheduleTitle = (item) => {
  // Team codes and BO format are official competition identities, not text to translate.
  if (eventSlug.value === "worlds-2026" && item?.unitName) return String(item.unitName);
  const candidates = [
    translatedFreeText(item?.unitName),
    translatedFreeText(item?.phaseName),
    translatedFreeText(item?.eventName),
  ].filter(Boolean);
  return candidates.reduce(
    (best, candidate) =>
      scheduleTextInformationScore(candidate) > scheduleTextInformationScore(best)
        ? candidate
        : best,
    "",
  );
};

const isScheduleTextCovered = (candidate, title) => {
  const candidateKey = scheduleTextKey(candidate);
  const titleKey = scheduleTextKey(title);
  if (!candidateKey || !titleKey) return false;
  return candidateKey === titleKey || (candidateKey.length >= 4 && titleKey.includes(candidateKey));
};

const localizedScheduleSubtitle = (item) => {
  const title = localizedScheduleTitle(item);
  const phase = translatedFreeText(item?.phaseName || item?.eventName);
  const venue = translatedFreeText(item?.venueName);
  return [phase && !isScheduleTextCovered(phase, title) ? phase : "", venue]
    .filter(Boolean)
    .join(" · ");
};

const localizedNewsTitle = (item) => locale.value === "zh-CN" && WORLDS_2026_NEWS_ZH[item?.title] || translatedFreeText(item?.title);
const localizedNewsSummary = (item) => locale.value === "zh-CN" && WORLDS_2026_NEWS_ZH[item?.summary] || translatedFreeText(item?.summary);
const localizedNewsCategory = (item) =>
  translatedFreeText(Array.isArray(item?.categories) ? item.categories[0] : "");

const topicPrimarySource = (item) =>
  (Array.isArray(item?.sources)
    ? item.sources.find((source) => source?.role === "primary") || item.sources[0]
    : null) || null;

const topicEvidenceSources = (item) => {
  const seen = new Set();
  const evidence = [];
  for (const source of item?.sources || []) {
    const key = String(source?.sourceKey || "").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    evidence.push(source);
    if (evidence.length >= 3) break;
  }
  return evidence;
};

const topicEventUrl = (item) => {
  const source = topicPrimarySource(item);
  return source?.url || source?.mobileUrl || "#";
};

const topicSourceLabel = (source) =>
  getSourceLabel(
    source?.sourceKey,
    locale.value,
    source?.sourceName || source?.sourceKey || "",
  );

const localizedTopicTitle = (item) => translatedFreeText(item?.title);
const localizedTopicSummary = (item) =>
  translatedFreeText(topicPrimarySource(item)?.summary);

const topicTrendLabel = (item) =>
  ({
    new: copy.value.trendNew,
    rising: copy.value.trendRising,
    falling: copy.value.trendFalling,
    reentry: copy.value.trendReentry,
    stable: copy.value.trendStable,
  })[String(item?.trend?.signal || "").toLowerCase()] || copy.value.trendStable;

const topicTrendSymbol = (item) =>
  ({
    new: "●",
    rising: "↑",
    falling: "↓",
    reentry: "↻",
    stable: "•",
  })[String(item?.trend?.signal || "").toLowerCase()] || "•";

const handleTopicSourceLogoError = (event) => {
  const target = event?.currentTarget;
  if (!target || target.dataset.fallbackApplied === "1") return;
  target.dataset.fallbackApplied = "1";
  target.src = getSourceLogoFallback();
};

const handleTopicCoverError = (event) => {
  const target = event?.currentTarget;
  if (!target) return;
  const container = target.closest(".topic-card__media");
  if (container) container.hidden = true;
};

const handleTopicCoverPreviewKeydown = (event) => {
  if (!["Enter", " "].includes(event?.key)) return;
  event.preventDefault();
  event.currentTarget?.click?.();
};

const translateVisibleEventText = async ({
  includeNews = true,
  includeTopics = true,
} = {}) => {
  if (!shouldTranslateEventFreeText(eventSlug.value, locale.value) && !(isLolEvent.value && locale.value !== "en")) return;
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

  if (includeTopics) {
    for (const item of visibleTopicEvents.value) {
      for (const value of [
        item?.title,
        topicPrimarySource(item)?.summary,
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
    {
      priority: 900,
      allowClientFallback: true,
      allowRawFallback: true,
    },
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

const scheduleResultDate = (item) => String(item?.startAt || "").slice(0, 10);

const mergeHydratedScheduleResults = (result) => {
  const rows = Array.isArray(result?.items) ? result.items : [];
  if (!rows.length || !Array.isArray(scheduleData.value?.items)) return;
  const byId = new Map(rows.map((item) => [item.id, item]));
  scheduleData.value = {
    ...scheduleData.value,
    items: scheduleData.value.items.map((item) =>
      byId.has(item.id) ? { ...item, ...byId.get(item.id) } : item,
    ),
  };
};

const hydrateVisibleScheduleResults = async (force = false) => {
  if (scheduleScope.value === "day" || !eventSlug.value) return;
  const version = scheduleResultHydrationVersion;
  const dates = [...new Set(
    visibleScheduleItems.value
      .filter(
        (item) =>
          scheduleBucket(item) === "completed" &&
          item?.showResults &&
          !hasHeadToHeadResult(item) &&
          !hasPlacementResults(item),
      )
      .map(scheduleResultDate)
      .filter(Boolean),
  )]
    .filter((date) => force || !hydratedScheduleResultDates.has(date))
    .slice(0, 2);

  if (!dates.length) return;
  const settled = await Promise.allSettled(
    dates.map((date) =>
      getEventSchedule(eventSlug.value, {
        date,
        discipline: selectedDiscipline.value || undefined,
        locale: locale.value,
        limit: 800,
        force,
      }),
    ),
  );
  if (version !== scheduleResultHydrationVersion) return;
  settled.forEach((result, index) => {
    if (result.status !== "fulfilled") return;
    hydratedScheduleResultDates.add(dates[index]);
    mergeHydratedScheduleResults(result.value);
  });
};

const showMoreSchedule = () => {
  scheduleVisibleCount.value += SCHEDULE_WINDOW_SIZE;
  void translateVisibleEventText({ includeNews: false });
  void hydrateVisibleScheduleResults(false);
};

const showMoreTopics = () => {
  topicVisibleCount.value += 8;
  void translateVisibleEventText({ includeNews: false, includeTopics: true });
};

const offsetCalendarDate = (value, days) => {
  const raw = String(value || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "";
  const date = new Date(`${raw}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return "";
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const loadRecentCompletedSchedule = async () => {
  const currentDate = String(
    selectedDate.value || overview.value?.today || eventData.value?.endDate || "",
  ).slice(0, 10);
  const eventStart = String(eventData.value?.startDate || "").slice(0, 10);
  if (!currentDate) return false;

  scheduleLoading.value = true;
  try {
    for (let step = 1; step <= 7; step += 1) {
      const candidate = offsetCalendarDate(currentDate, -step);
      if (!candidate || (eventStart && candidate < eventStart)) break;
      const result = await getEventSchedule(eventSlug.value, {
        date: candidate,
        discipline: selectedDiscipline.value || undefined,
        locale: locale.value,
        limit: 800,
      });
      if (Number(result?.completedCount || 0) <= 0) continue;

      selectedDate.value = candidate;
      scheduleData.value = result;
      scheduleVisibleCount.value = SCHEDULE_WINDOW_SIZE;
      updateRouteQuery();
      void translateVisibleEventText({ includeNews: false });
      return true;
    }
  } catch (error) {
    console.warn("recent completed event schedule request failed", error);
  } finally {
    scheduleLoading.value = false;
  }
  return false;
};

const setScheduleStatusFilter = async (value) => {
  scheduleStatusFilter.value = value;
  scheduleVisibleCount.value = SCHEDULE_WINDOW_SIZE;
  if (
    value === "completed" &&
    scheduleScope.value === "day" &&
    !scheduleLoading.value &&
    Number(scheduleData.value?.completedCount || 0) <= 0
  ) {
    await loadRecentCompletedSchedule();
  }
  void translateVisibleEventText({ includeNews: false });
  void hydrateVisibleScheduleResults(false);
};

const setScheduleSortDirection = (direction) => {
  scheduleSortDirection.value = direction === "desc" ? "desc" : "asc";
  scheduleVisibleCount.value = SCHEDULE_WINDOW_SIZE;
  updateRouteQuery();
};

const ensureScheduleRangeDefaults = () => {
  const eventStart = String(eventData.value?.startDate || "").slice(0, 10);
  const eventEnd = String(eventData.value?.endDate || "").slice(0, 10);
  const today = String(overview.value?.today || eventStart || "").slice(0, 10);
  if (!selectedRangeEnd.value) {
    selectedRangeEnd.value =
      eventEnd && today > eventEnd ? eventEnd : today || eventEnd;
  }
  if (!selectedRangeStart.value) {
    const candidate = offsetCalendarDate(selectedRangeEnd.value, -2);
    selectedRangeStart.value =
      eventStart && candidate < eventStart ? eventStart : candidate || eventStart;
  }
  if (eventStart && selectedRangeStart.value < eventStart) {
    selectedRangeStart.value = eventStart;
  }
  if (eventEnd && selectedRangeEnd.value > eventEnd) {
    selectedRangeEnd.value = eventEnd;
  }
  if (selectedRangeStart.value > selectedRangeEnd.value) {
    selectedRangeStart.value = selectedRangeEnd.value;
  }
};

const setScheduleScope = async (value) => {
  const next = ["day", "range", "all"].includes(String(value)) ? String(value) : "day";
  if (scheduleScope.value === next) return;
  scheduleScope.value = next;
  scheduleStatusFilter.value = "all";
  if (next === "day" && !selectedDate.value) {
    selectedDate.value =
      String(currentScheduleDate.value || eventData.value?.startDate || "").slice(0, 10);
  }
  if (next === "range") ensureScheduleRangeDefaults();
  await applyScheduleFilters();
};

const showToday = async () => {
  const today = String(currentScheduleDate.value || "").trim();
  if (!today) return;
  scheduleScope.value = "day";
  selectedDate.value = today;
  scheduleStatusFilter.value = "all";
  await applyScheduleFilters();
};

const returnToCurrentSchedule = async () => {
  const today = String(currentScheduleDate.value || "").trim();
  if (!today) return;
  if (!isCurrentScheduleContext.value) {
    scheduleBrowseSnapshot.value = {
      scope: scheduleScope.value,
      date: selectedDate.value,
      rangeStart: selectedRangeStart.value,
      rangeEnd: selectedRangeEnd.value,
      discipline: selectedDiscipline.value,
      status: scheduleStatusFilter.value,
      sortDirection: scheduleSortDirection.value,
      visibleCount: scheduleVisibleCount.value,
    };
  }
  scheduleScope.value = "day";
  selectedDate.value = today;
  selectedDiscipline.value = "";
  scheduleStatusFilter.value = "all";
  scheduleSortDirection.value = "asc";
  scheduleVisibleCount.value = SCHEDULE_WINDOW_SIZE;
  await applyScheduleFilters();
};

const restoreScheduleBrowse = async () => {
  const snapshot = scheduleBrowseSnapshot.value;
  if (!snapshot) return;
  scheduleScope.value = snapshot.scope || "day";
  selectedDate.value = snapshot.date || selectedDate.value;
  selectedRangeStart.value = snapshot.rangeStart || "";
  selectedRangeEnd.value = snapshot.rangeEnd || "";
  selectedDiscipline.value = snapshot.discipline || "";
  scheduleStatusFilter.value = snapshot.status || "all";
  scheduleSortDirection.value =
    snapshot.sortDirection === "desc" ? "desc" : "asc";
  await applyScheduleFilters();
  scheduleVisibleCount.value = Math.max(
    SCHEDULE_WINDOW_SIZE,
    Number(snapshot.visibleCount || SCHEDULE_WINDOW_SIZE),
  );
};

const showYesterday = async () => {
  const today = String(currentScheduleDate.value || "").trim();
  if (!today) return;
  const eventStart = String(eventData.value?.startDate || "").slice(0, 10);
  const yesterday = offsetCalendarDate(today, -1);
  scheduleScope.value = "day";
  selectedDate.value =
    eventStart && yesterday < eventStart ? eventStart : yesterday;
  await applyScheduleFilters();
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
  if (eventSlug.value === "worlds-2026" && locale.value.startsWith("zh")) {
    // A Worlds day is indexed by the venue's local date, but China/Taiwan readers
    // need the explicit next-day 02:00/07:00 start, not an unlabeled US clock.
    return new Intl.DateTimeFormat(localeTag.value, {
      timeZone: locale.value === "zh-TW" ? "Asia/Taipei" : "Asia/Shanghai",
      month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(date);
  }
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
const formatBriefTime = (value) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) {
    const dateOnly = new Date(`${value}T12:00:00Z`);
    return new Intl.DateTimeFormat(localeTag.value, { month: "numeric", day: "numeric", timeZone: "UTC" }).format(dateOnly);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(localeTag.value, {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: eventData.value?.timezone || "Asia/Tokyo",
  }).format(date);
};

const updateRouteQuery = () => {
  const query = { ...route.query };
  query.scope = scheduleScope.value;
  if (scheduleScope.value === "day" && selectedDate.value) {
    query.date = selectedDate.value;
  } else {
    delete query.date;
  }
  if (scheduleScope.value === "range") {
    if (selectedRangeStart.value) query.from = selectedRangeStart.value;
    else delete query.from;
    if (selectedRangeEnd.value) query.to = selectedRangeEnd.value;
    else delete query.to;
  } else {
    delete query.from;
    delete query.to;
  }
  if (selectedDiscipline.value) query.discipline = selectedDiscipline.value;
  else delete query.discipline;
  if (scheduleSortDirection.value === "desc") query.sort = "desc";
  else delete query.sort;
  router.replace({ path: route.path, query, hash: route.hash });
};

const applyScheduleFilters = async () => {
  updateRouteQuery();
  await loadSchedule(false);
};

const loadSchedule = async (force = false) => {
  if (!eventSlug.value) return;
  if (scheduleScope.value === "day" && !selectedDate.value) return;
  if (scheduleScope.value === "range") ensureScheduleRangeDefaults();

  scheduleResultHydrationVersion += 1;
  hydratedScheduleResultDates.clear();
  scheduleVisibleCount.value = SCHEDULE_WINDOW_SIZE;
  scheduleLoading.value = true;
  try {
    if (scheduleScope.value === "day") {
      scheduleData.value = await getEventSchedule(eventSlug.value, {
        date: selectedDate.value,
        discipline: selectedDiscipline.value || undefined,
        locale: locale.value,
        limit: 800,
        force,
      });
    } else {
      const from =
        scheduleScope.value === "all"
          ? eventData.value?.startDate
          : selectedRangeStart.value;
      const to =
        scheduleScope.value === "all"
          ? eventData.value?.endDate
          : selectedRangeEnd.value;
      scheduleData.value = await getEventScheduleRange(eventSlug.value, {
        from,
        to,
        discipline: selectedDiscipline.value || undefined,
        locale: locale.value,
        limitPerDay: 0,
        force,
        concurrency: 3,
      });
    }
    void translateVisibleEventText({ includeNews: false });
    void hydrateVisibleScheduleResults(force);
  } catch (error) {
    console.warn("event schedule request failed", error);
    const message = error?.message || error?.code || copy.value.loadFailed;
    if (force && scheduleData.value) {
      refreshError.value = message;
    } else {
      scheduleData.value = {
        date:
          scheduleScope.value === "day"
            ? selectedDate.value
            : [selectedRangeStart.value, selectedRangeEnd.value]
                .filter(Boolean)
                .join(".."),
        total: 0,
        liveCount: 0,
        completedCount: 0,
        upcomingCount: 0,
        disciplines: [],
        items: [],
      };
    }
  } finally {
    scheduleLoading.value = false;
  }
};

const loadRegionalNews = async (force = false) => {
  if (eventSlug.value !== 'worlds-2026' || locale.value !== 'zh-CN') {
    regionalNewsData.value = null;
    return;
  }
  try {
    const next=await getEventRegionalNews('worlds-2026',{region:'lpl',locale:locale.value,limit:20,force});
    if (Array.isArray(next?.items)) regionalNewsData.value=next;
  } catch(error) {
    // Optional upstream source. Riot's primary official stories remain available.
    console.warn('Worlds LPL official news unavailable',error?.message||error);
    if (!regionalNewsData.value) regionalNewsData.value=null;
  }
};

const loadBriefs = async (force = false) => {
  if (
    (eventSlug.value !== "aichi-nagoya-2026" || locale.value !== "zh-CN") &&
    eventSlug.value !== "worlds-2026"
  ) {
    briefData.value = null;
    newBriefUrls.value = new Set();
    return;
  }
  try {
    const previousUrls = new Set(
      (briefData.value?.items || [])
        .map((item) => String(item?.url || ""))
        .filter(Boolean),
    );
    const nextBriefData = await getEventBriefs(eventSlug.value, {
      locale: locale.value,
      limit: 8,
      force,
    });
    const nextItems = Array.isArray(nextBriefData?.items)
      ? nextBriefData.items
      : [];
    newBriefUrls.value =
      force && previousUrls.size
        ? new Set(
            nextItems
              .map((item) => String(item?.url || ""))
              .filter((url) => url && !previousUrls.has(url)),
          )
        : new Set();
    briefData.value = nextBriefData;
  } catch (error) {
    console.warn("event brief request failed", error);
    if (!force || !briefData.value) {
      briefData.value = null;
    }
  }
};

const loadDisciplineCatalog = async (force = false) => {
  const from = String(eventData.value?.startDate || "").slice(0, 10);
  const to = String(eventData.value?.endDate || "").slice(0, 10);
  if (!eventSlug.value || !from || !to) return;
  try {
    const catalog = await getEventDisciplineCatalog(eventSlug.value, {
      from,
      to,
      locale: locale.value,
      force,
    });
    if (Array.isArray(catalog) && catalog.length) {
      disciplineCatalog.value = catalog;
    }
  } catch (error) {
    console.warn("event discipline catalog request failed", error);
  }
};

const loadAichiArchive = async (force = false) => {
  if (!isAichiArchived.value) return;
  archiveTopicLoading.value = true;
  archiveTopicError.value = '';
  try {
    const data = await getTopicArchive('aichi-nagoya-2026', { limit: 100, force });
    if (eventSlug.value !== 'aichi-nagoya-2026') return;
    archiveTopicData.value = data;
  } catch (error) {
    archiveTopicError.value = String(error?.message || 'archive_query_failed');
    console.warn('historical Aichi topics unavailable', archiveTopicError.value);
    // Never backfill the archive with current topic snapshots.
  } finally {
    archiveTopicLoading.value = false;
  }
};

const loadTopic = async (force = false) => {
  if (isAichiArchived.value) { topicData.value = null; void loadAichiArchive(force); return; }
  const topicKey = String(eventConfig.value?.topicKey || "").trim();
  topicVisibleCount.value = 8;
  if (!topicKey) {
    topicData.value = null;
    return;
  }

  topicLoading.value = true;
  try {
    topicData.value = await getTopicFeed(topicKey, {
      limit: 24,
      maxRank: 80,
      minSources: 1,
      force,
    });
    void translateVisibleEventText({
      includeNews: false,
      includeTopics: true,
    });
  } catch (error) {
    console.warn("event topic feed request failed", error);
    if (!topicData.value) {
      topicData.value = {
        schema: "topic-feed-v1",
        topic: { key: topicKey },
        events: [],
      };
    }
  } finally {
    topicLoading.value = false;
  }
};

const cloneEventFallbackOverview = () => {
  const source = eventConfig.value?.fallbackOverview;
  if (!source) return null;
  return JSON.parse(JSON.stringify(source));
};

const applyEventFallback = ({ seedDate = false } = {}) => {
  const data = cloneEventFallbackOverview();
  if (!data) return false;
  overview.value = data;
  medalData.value = data.modules?.medals || null;
  standingsData.value = data.modules?.standings || null;
  scheduleData.value = data.modules?.schedule || null;
  if (isLolEvent.value) {
    scheduleData.value = scopedLolFallbackSchedule(scheduleData.value, scheduleScope.value, selectedDate.value || scheduleData.value?.date, selectedRangeStart.value, selectedRangeEnd.value);
  }
  newsData.value = data.modules?.news || null;
  if (seedDate && !selectedDate.value) {
    selectedDate.value =
      data.modules?.schedule?.date || data.today || data.event?.startDate || "";
  }
  if (
    !disciplineCatalog.value.length &&
    Array.isArray(data.modules?.schedule?.disciplines)
  ) {
    disciplineCatalog.value = data.modules.schedule.disciplines;
  }
  if (!selectedRangeStart.value || !selectedRangeEnd.value) {
    ensureScheduleRangeDefaults();
  }
  return true;
};

const loadAll = async (force = false, { preserveView = false } = {}) => {
  if (!eventSlug.value) return;
  if (!preserveView) {
    scheduleVisibleCount.value = SCHEDULE_WINDOW_SIZE;
    topicVisibleCount.value = 8;
  }
  void loadTopic(force);
  void loadBriefs(force);
  void loadRegionalNews(force);
  loading.value = true;
  fatalError.value = "";
  try {
    const data = await getEventOverview(eventSlug.value, {
      date: selectedDate.value || undefined,
      locale: locale.value,
      medalLimit: 100,
      scheduleLimit: 60,
      newsLimit: 10,
      force,
    });
    overview.value = data;
    refreshError.value = "";
    medalData.value = data.modules?.medals || null;
    standingsData.value = data.modules?.standings || null;
    scheduleData.value = data.modules?.schedule || null;
    newsData.value = data.modules?.news || null;
    if (!selectedDate.value) {
      selectedDate.value =
        data.modules?.schedule?.date || data.today || eventData.value?.startDate || "";
    }
    if (
      !disciplineCatalog.value.length &&
      Array.isArray(data.modules?.schedule?.disciplines)
    ) {
      disciplineCatalog.value = data.modules.schedule.disciplines;
    }
    if (!selectedRangeStart.value || !selectedRangeEnd.value) {
      ensureScheduleRangeDefaults();
    }
    void loadDisciplineCatalog(force);
    const initialScheduleItems = Array.isArray(data.modules?.schedule?.items)
      ? data.modules.schedule.items.length
      : 0;
    const initialScheduleTotal = Number(data.modules?.schedule?.total || 0);
    if (
      selectedDiscipline.value ||
      scheduleScope.value !== "day" ||
      selectedDate.value !== data.modules?.schedule?.date ||
      initialScheduleTotal > initialScheduleItems
    ) {
      await loadSchedule(force);
    }
    void translateVisibleEventText({ includeNews: true });
  } catch (error) {
    const message = error?.message || error?.code || copy.value.loadFailed;
    if (eventConfig.value?.fallbackOverview) {
      applyEventFallback({ seedDate: true });
      fatalError.value = "";
      refreshError.value = "";
    } else if (overview.value) {
      refreshError.value = message;
    } else {
      fatalError.value = message;
    }
  } finally {
    loading.value = false;
  }
};

const handleRefresh = () => loadAll(true, { preserveView: true });
const refreshEventHubNow = () => loadAll(true, { preserveView: true });

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
  () => [route.query.scope, route.query.from, route.query.to],
  ([scope, from, to]) => {
    const nextScope = ["range", "all"].includes(String(scope || ""))
      ? String(scope)
      : "day";
    const nextFrom = typeof from === "string" ? from : "";
    const nextTo = typeof to === "string" ? to : "";
    if (
      nextScope === scheduleScope.value &&
      (nextScope !== "range" ||
        (nextFrom === selectedRangeStart.value &&
          nextTo === selectedRangeEnd.value))
    ) {
      return;
    }
    scheduleScope.value = nextScope;
    selectedRangeStart.value = nextFrom;
    selectedRangeEnd.value = nextTo;
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
watch(
  () => route.query.sort,
  (value) => {
    const next = String(value || "") === "desc" ? "desc" : "asc";
    if (next === scheduleSortDirection.value) return;
    scheduleSortDirection.value = next;
    scheduleVisibleCount.value = SCHEDULE_WINDOW_SIZE;
  },
);
watch(eventSlug, () => {
  eventTranslationVersion += 1;
  translatedEventText.value = {};
  overview.value = null;
  refreshError.value = "";
  medalData.value = null;
  standingsData.value = null;
  scheduleData.value = null;
  newsData.value = null;
  topicData.value = null;
  archiveTopicData.value = null;
  archiveTopicError.value = '';
  aichiUpdateFilter.value = 'topic';
  aichiUpdatesVisible.value = 8;
  briefData.value = null;
  newBriefUrls.value = new Set();
  disciplineCatalog.value = [];
  scheduleStatusFilter.value = "all";
  scheduleSortDirection.value =
    String(route.query.sort || "") === "desc" ? "desc" : "asc";
  scheduleVisibleCount.value = SCHEDULE_WINDOW_SIZE;
  topicVisibleCount.value = 8;
  scheduleScope.value = ["range", "all"].includes(String(route.query.scope || ""))
    ? String(route.query.scope)
    : "day";
  selectedDate.value = typeof route.query.date === "string" ? route.query.date : "";
  selectedRangeStart.value =
    typeof route.query.from === "string" ? route.query.from : "";
  selectedRangeEnd.value =
    typeof route.query.to === "string" ? route.query.to : "";
  selectedDiscipline.value =
    typeof route.query.discipline === "string" ? route.query.discipline : "";
  applyEventFallback();
  loadAll(false);
});

watch(locale, () => {
  eventTranslationVersion += 1;
  translatedEventText.value = {};
  void loadBriefs(false);
  void loadRegionalNews(false);
  void loadDisciplineCatalog(false);
  if (overview.value) {
    void translateVisibleEventText({ includeNews: true });
  }
});

onMounted(() => {
  applyEventFallback();
  loadAll(false);
  if (typeof window !== "undefined") {
    reducedMotionMediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    syncReducedMotionPreference(reducedMotionMediaQuery);
    reducedMotionMediaQuery.addEventListener?.(
      "change",
      syncReducedMotionPreference,
    );
    window.addEventListener(DATA_REFRESH_EVENT, handleRefresh);
  }
});
onBeforeUnmount(() => {
  if (typeof window !== "undefined") {
    reducedMotionMediaQuery?.removeEventListener?.(
      "change",
      syncReducedMotionPreference,
    );
    reducedMotionMediaQuery = null;
    window.removeEventListener(DATA_REFRESH_EVENT, handleRefresh);
  }
});
</script>

<style scoped>
.schedule-fallback-note{font-size:12px;line-height:1.6;color:var(--event-muted);margin:8px 0}

.event-hub {
  --event-border: color-mix(
    in srgb,
    var(--n-border-color, rgba(127, 127, 127, 0.16)) 92%,
    transparent
  );
  --event-border-strong: color-mix(
    in srgb,
    var(--n-text-color-3, #8a8f98) 28%,
    var(--n-border-color, rgba(127, 127, 127, 0.16))
  );
  --event-surface: var(--n-color);
  --event-surface-soft: color-mix(
    in srgb,
    var(--n-action-color) 72%,
    var(--event-surface)
  );
  --event-hover: color-mix(
    in srgb,
    var(--n-action-color) 88%,
    var(--event-surface)
  );
  --event-accent-soft: color-mix(
    in srgb,
    var(--n-primary-color, #d03050) 8%,
    var(--event-surface)
  );
  --event-muted: var(--n-text-color-3, #8a8f98);
  --event-gold: #a97912;
  --event-silver: #77818b;
  --event-bronze: #9b5c2a;
  --event-font-body: 15px;
  --event-font-title: 16px;
  --event-font-reading: 14px;
  --event-font-meta: 13px;
  --event-font-caption: 12px;
  --event-font-micro: 12px;
  --event-control-height: 32px;
  --event-control-height-sm: 28px;
  --event-control-radius: 6px;
  --event-panel-pad-x: 14px;
  --event-panel-pad-y: 14px;
  --event-panel-title-size: 18px;
  --event-table-head-size: 13px;
  /* Current official emblem PNG: red #e83220, purple #4e3a93,
     green #079a3e, gold #d5b100. Dento Ocher #c18e46 comes from the
     official Core Graphics asset and is not part of the emblem itself. */
  --aichi-jonetsu-red: #e83220;
  --aichi-kakitsubata-purple: #4e3a93;
  --aichi-shinrin-green: #079a3e;
  --aichi-kinshachi-gold: #d5b100;
  --aichi-dento-ocher: #c18e46;
  display: grid;
  gap: 16px;
  padding-bottom: 32px;
  color-scheme: light;
}

.event-hub.is-aichi-event {
  /* UI color tokens derive from the official named Core Graphics palette.
     No emblem, mascot or licensed Core Graphics artwork is embedded here. */
  --n-primary-color: var(--aichi-jonetsu-red);
  --n-primary-color-hover: color-mix(
    in srgb,
    var(--aichi-jonetsu-red) 84%,
    white
  );
}

.event-hub.is-dark {
  --event-surface-soft: color-mix(
    in srgb,
    var(--n-action-color) 82%,
    var(--event-surface)
  );
  --event-hover: color-mix(
    in srgb,
    var(--n-action-color) 92%,
    var(--event-surface)
  );
  --event-accent-soft: color-mix(
    in srgb,
    var(--n-primary-color, #d03050) 13%,
    var(--event-surface)
  );
  --event-gold: #d4b34f;
  --event-silver: #aab2ba;
  --event-bronze: #c38758;
  color-scheme: dark;
}

.event-hub__error {
  min-height: 420px;
  display: grid;
  place-items: center;
}

.event-hero,
.event-panel {
  min-width: 0;
  border: 1px solid var(--event-border);
  border-radius: 12px;
  background: var(--event-surface);
}

.event-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(330px, 420px);
  gap: clamp(24px, 3vw, 38px);
  padding: clamp(22px, 2.7vw, 30px);
  overflow: visible;
  border-top: 3px solid var(--n-primary-color, #d03050);
  z-index: 2;
}

.event-hub.is-aichi-event .event-hero {
  border-top: 0;
  background:
    radial-gradient(
      circle at 92% 20%,
      color-mix(in srgb, var(--aichi-kakitsubata-purple) 12%, transparent) 0,
      transparent 28%
    ),
    radial-gradient(
      circle at 82% 82%,
      color-mix(in srgb, var(--aichi-shinrin-green) 9%, transparent) 0,
      transparent 30%
    ),
    radial-gradient(
      circle at 58% 112%,
      color-mix(in srgb, var(--aichi-kinshachi-gold) 10%, transparent) 0,
      transparent 36%
    ),
    var(--event-surface);
}

.event-hero__palette {
  position: absolute;
  inset: 0 0 auto;
  z-index: 2;
  display: grid;
  grid-template-columns: 24fr 19fr 19fr 20fr 18fr;
  height: 4px;
  overflow: hidden;
  border-radius: 11px 11px 0 0;
  pointer-events: none;
}

.event-hero__palette i {
  display: block;
}

.event-hero__palette .is-red { background: var(--aichi-jonetsu-red); }
.event-hero__palette .is-purple { background: var(--aichi-kakitsubata-purple); }
.event-hero__palette .is-green { background: var(--aichi-shinrin-green); }
.event-hero__palette .is-gold { background: var(--aichi-kinshachi-gold); }
.event-hero__palette .is-ocher { background: var(--aichi-dento-ocher); }

.event-hero__main,
.event-hero__snapshot,
.event-brief-strip {
  position: relative;
  z-index: 1;
}

.event-hero__main {
  min-width: 0;
}

.event-hero__eyebrow {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  color: var(--n-primary-color, #d03050);
  font-size: 12px;
  font-weight: 720;
  letter-spacing: 0.02em;
}

.event-hero__edition-label {
  color: color-mix(
    in srgb,
    var(--aichi-kakitsubata-purple) 72%,
    var(--n-text-color)
  );
  font-size: var(--event-font-meta);
  font-weight: 760;
  letter-spacing: 0.055em;
  line-height: 1.35;
  white-space: nowrap;
}

.event-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding-inline-start: 10px;
  border-inline-start: 1px solid color-mix(in srgb, currentColor 38%, transparent);
  color: var(--n-primary-color, #d03050);
  font-size: 12px;
  letter-spacing: 0;
}

.event-status::before {
  content: "";
  width: 6px;
  height: 6px;
  flex: 0 0 6px;
  border-radius: 50%;
  background: currentColor;
}

.event-status.is-completed {
  color: var(--n-text-color-3, #999);
}

.event-status.is-upcoming {
  color: var(--n-info-color, #2080f0);
}

.event-hero h1 {
  max-width: 820px;
  margin: 10px 0 10px;
  color: var(--n-text-color);
  font-size: clamp(30px, 3vw, 40px);
  font-weight: 780;
  line-height: 1.14;
  letter-spacing: -0.028em;
}

.event-hero__description {
  max-width: 760px;
  margin: 0;
  color: var(--n-text-color-2);
  font-size: 14px;
  line-height: 1.7;
}

.event-hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 20px;
  margin-top: 16px;
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
  inset-inline-start: -11px;
  color: var(--event-muted);
}

.event-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 20px;
}

.event-link,
.result-link,
.panel-more {
  color: var(--n-primary-color, #d03050);
  text-decoration: none;
  font-weight: 680;
}

.event-link {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid var(--n-primary-color, #d03050);
  border-radius: 7px;
  color: var(--n-base-color, #fff);
  background: var(--n-primary-color, #d03050);
}

.event-link.is-secondary {
  color: var(--n-text-color);
  border-color: var(--event-border);
  background: var(--event-surface-soft);
}

.event-link:hover,
.event-link:focus-visible {
  border-color: var(--n-primary-color-hover, var(--n-primary-color, #d03050));
}

.event-link.is-secondary:hover,
.event-link.is-secondary:focus-visible {
  color: var(--n-primary-color, #d03050);
  border-color: color-mix(
    in srgb,
    var(--n-primary-color, #d03050) 48%,
    var(--event-border)
  );
}

.event-brief-strip {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: minmax(155px, 0.34fr) minmax(0, 1.66fr);
  gap: clamp(18px, 2.6vw, 30px);
  margin-top: -4px;
  padding: 15px 0 0;
  border-top: 1px solid var(--event-border);
}

.event-brief-strip__head {
  align-self: start;
  display: grid;
  gap: 4px;
  padding-top: 3px;
}

.event-brief-strip__head h2 {
  margin: 0;
  color: var(--n-text-color);
  font-size: 19px;
  line-height: 1.25;
}

.event-brief-strip__source {
  color: var(--event-muted);
  font-size: var(--event-font-caption);
}

.event-brief-timeline {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  min-width: 0;
  column-gap: 18px;
  row-gap: 1px;
}

.event-brief-item {
  position: relative;
  display: grid;
  grid-template-columns: 62px 12px minmax(0, 1fr);
  gap: 8px;
  align-items: start;
  min-width: 0;
  padding: 7px 0;
  color: inherit;
  text-decoration: none;
}

.event-brief-item::before {
  content: "";
  position: absolute;
  left: 67px;
  top: 18px;
  bottom: -7px;
  width: 1px;
  background: var(--event-border);
}

.event-brief-item time {
  padding-top: 1px;
  color: var(--event-muted);
  font-size: var(--event-font-caption);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.event-brief-item__dot {
  z-index: 1;
  width: 8px;
  height: 8px;
  margin-top: 5px;
  border: 2px solid color-mix(
    in srgb,
    var(--n-primary-color, #d03050) 28%,
    var(--event-surface)
  );
  border-radius: 50%;
  background: var(--n-primary-color, #d03050);
}

.event-brief-item__content {
  position: relative;
  display: grid;
  min-width: 0;
  gap: 3px;
}

.event-brief-item__content strong {
  overflow: hidden;
  color: var(--n-text-color);
  font-size: var(--event-font-meta);
  font-weight: 700;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-brief-item__content small {
  color: var(--event-muted);
  font-size: var(--event-font-micro);
}

.event-brief-item__detail {
  position: absolute;
  inset-inline: 0;
  top: calc(100% + 6px);
  z-index: 8;
  display: -webkit-box;
  max-width: 360px;
  padding: 10px 12px;
  overflow: hidden;
  border: 1px solid var(--event-border);
  border-radius: 8px;
  color: var(--n-text-color-2);
  background: color-mix(
    in srgb,
    var(--event-surface) 96%,
    var(--n-primary-color, #d03050)
  );
  font-size: var(--event-font-caption);
  line-height: 1.55;
  opacity: 0;
  pointer-events: none;
  transform: translateY(-4px);
  visibility: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  transition:
    opacity 0.14s ease,
    transform 0.14s ease,
    visibility 0.14s ease;
}

.event-brief-item:hover strong,
.event-brief-item:focus-visible strong {
  color: var(--n-primary-color, #d03050);
}

.event-brief-item:hover .event-brief-item__detail,
.event-brief-item:focus-visible .event-brief-item__detail {
  opacity: 1;
  transform: translateY(0);
  visibility: visible;
}

.event-hero__snapshot {
  align-self: stretch;
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  padding-inline-start: clamp(22px, 2.6vw, 30px);
  border-inline-start: 1px solid var(--event-border);
}

.snapshot-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 11px;
  border-bottom: 1px solid var(--event-border);
  color: var(--n-text-color-2);
  font-size: 11px;
  font-weight: 650;
}

.snapshot-head time {
  color: var(--event-muted);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.snapshot-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 13px;
}

.snapshot-stat {
  min-width: 0;
  padding: 7px 12px;
}

.snapshot-stat + .snapshot-stat {
  border-inline-start: 1px solid var(--event-border);
}

.snapshot-stat:first-child {
  padding-inline-start: 0;
}

.snapshot-stat:last-child {
  padding-inline-end: 0;
}

.snapshot-stat > strong,
.snapshot-stat > span,
.snapshot-stat > small {
  display: block;
}

.snapshot-stat > strong {
  color: var(--n-text-color);
  font-size: 23px;
  font-weight: 780;
  line-height: 1.08;
  font-variant-numeric: tabular-nums;
}

.snapshot-stat > span {
  margin-top: 5px;
  color: var(--n-text-color-2);
  font-size: 11px;
}

.snapshot-stat > small {
  margin-top: 3px;
  color: var(--event-muted);
  font-size: 10px;
}

.snapshot-leader {
  display: flex !important;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.snapshot-leader .noc-flag {
  flex: 0 0 auto;
  font-size: 22px;
  line-height: 1;
}

.snapshot-leader span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.snapshot-medals {
  display: flex !important;
  flex-wrap: wrap;
  gap: 3px 8px;
  font-variant-numeric: tabular-nums;
}

.snapshot-medals span {
  white-space: nowrap;
}

.event-degraded {
  padding: 9px 12px;
  border: 1px solid color-mix(
    in srgb,
    var(--n-warning-color, #f0a020) 62%,
    var(--event-border)
  );
  border-radius: 9px;
  color: var(--n-warning-color, #f0a020);
  background: color-mix(
    in srgb,
    var(--n-warning-color, #f0a020) 7%,
    var(--event-surface)
  );
  font-size: 12px;
}

.event-dashboard {
  display: grid;
  grid-template-columns: minmax(410px, 0.92fr) minmax(0, 1.36fr);
  gap: 16px;
  align-items: stretch;
}

.event-panel {
  padding: 18px 20px;
}

.panel-head {
  min-height: 45px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin: -2px 0 0;
  padding-bottom: 13px;
  border-bottom: 1px solid var(--event-border);
}

.panel-kicker {
  display: block;
  margin-bottom: 4px;
  color: var(--event-muted);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.025em;
}

.panel-head h2 {
  margin: 0;
  color: var(--n-text-color);
  font-size: 19px;
  font-weight: 760;
  line-height: 1.25;
  letter-spacing: -0.012em;
}

.panel-count,
.panel-more {
  flex: 0 0 auto;
  margin-top: 4px;
  color: var(--event-muted);
  font-size: 11px;
}

.panel-more:hover,
.panel-more:focus-visible {
  color: var(--n-primary-color, #d03050);
}

.panel-loading {
  padding: 16px 2px 2px;
}

.standings-groups {
  display: grid;
  gap: 0;
}

.standings-group {
  padding: 14px 0 12px;
  border-bottom: 1px solid var(--event-border);
}

.standings-group:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.standings-group > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.standings-group > header strong {
  color: var(--n-text-color-1);
  font-size: 12px;
  font-weight: 720;
}

.standings-group > header span {
  color: var(--event-muted);
  font-size: 10px;
}

.standings-team-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 16px;
}

.standings-team {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 9px;
  padding: 9px 0;
  border-top: 1px solid color-mix(in srgb, var(--event-border) 76%, transparent);
}

.standings-team__logo {
  display: inline-grid;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  place-items: center;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, #0a142b 24%, var(--event-border));
  border-radius: 8px;
  background: linear-gradient(145deg, #18263a, #314158);
}

.standings-team__logo img {
  width: 30px;
  height: 30px;
  object-fit: contain;
}

.standings-team__fallback {
  display: inline-flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  color: #f0e6d2;
  background: transparent;
  font-size: 9px;
  font-weight: 780;
}

.event-hub.is-dark .standings-team__logo {
  border-color: color-mix(in srgb, var(--event-border-strong) 72%, transparent);
  background: color-mix(in srgb, var(--event-surface-soft) 68%, #0a142b);
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
  font-weight: 680;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.standings-team small {
  color: var(--event-muted);
  font-size: 10px;
}

.standings-pending {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 6px;
  padding: 11px 0 0;
  border-top: 1px dashed var(--event-border);
  color: var(--event-muted);
}

.standings-pending strong {
  color: var(--n-text-color-1);
  font-size: 15px;
}

.medal-table-wrap {
  overflow-x: auto;
  margin-top: 2px;
}

.medal-table {
  width: 100%;
  min-width: 450px;
  border-collapse: collapse;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.medal-table th,
.medal-table td {
  padding: 10px 8px;
  border-bottom: 1px solid var(--event-border);
  text-align: center;
}

.medal-table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  color: var(--event-muted);
  background: var(--event-surface-soft);
  font-size: 10px;
  font-weight: 720;
  letter-spacing: 0.02em;
}

.medal-table th:nth-child(2),
.medal-table td:nth-child(2) {
  text-align: start;
}

.medal-table tbody tr {
  transition: background-color 0.14s ease;
}

.medal-table tbody tr:hover {
  background: var(--event-hover);
}

.medal-table tbody tr:last-child td {
  border-bottom: 0;
}

.medal-table tbody tr:nth-child(1) .rank-cell {
  color: var(--event-gold);
}

.medal-table tbody tr:nth-child(2) .rank-cell {
  color: var(--event-silver);
}

.medal-table tbody tr:nth-child(3) .rank-cell {
  color: var(--event-bronze);
}

.rank-cell {
  width: 42px;
  color: var(--n-text-color-2);
  font-size: 14px;
  font-weight: 780;
}

.delegation-cell {
  max-width: 210px;
}

.delegation-identity {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.delegation-identity .noc-flag {
  display: inline-block;
  flex: 0 0 auto;
  margin-top: 0;
  font-size: 20px;
  line-height: 1;
}

.delegation-copy {
  display: block;
  min-width: 0;
}

.delegation-cell strong,
.delegation-copy > span {
  display: block;
}

.delegation-cell strong {
  color: var(--n-text-color);
  font-size: 12px;
  font-weight: 760;
  letter-spacing: 0.015em;
}

.delegation-copy > span {
  margin-top: 2px;
  overflow: hidden;
  color: var(--n-text-color-2);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.medal-head {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  white-space: nowrap;
}

.medal-head > span {
  font-size: 13px;
  line-height: 1;
}

.medal-number {
  font-weight: 760;
}

.medal-number.gold,
.medal-col.gold {
  color: var(--event-gold);
}

.medal-number.silver,
.medal-col.silver {
  color: var(--event-silver);
}

.medal-number.bronze,
.medal-col.bronze {
  color: var(--event-bronze);
}

.total-number {
  color: var(--n-text-color);
  font-weight: 800;
}

.schedule-head {
  align-items: center;
}

.schedule-controls {
  display: grid;
  justify-items: end;
  gap: 7px;
  min-width: min(100%, 470px);
}

.schedule-scope {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 3px;
  width: min(100%, 310px);
  padding: 3px;
  border: 1px solid var(--event-border);
  border-radius: 9px;
  background: var(--event-surface-soft);
}

.schedule-scope button {
  min-height: 29px;
  padding: 0 9px;
  border: 0;
  border-radius: 6px;
  color: var(--n-text-color-2);
  background: transparent;
  font: inherit;
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
}

.schedule-scope button.is-active {
  color: var(--n-base-color, #fff);
  background: var(--n-primary-color, #d03050);
}

.schedule-control-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 7px;
}

.schedule-range-field {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--event-muted);
  font-size: 11px;
}

.schedule-range-separator {
  color: var(--event-muted);
}

.schedule-range-all {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 10px;
  border: 1px solid var(--event-border);
  border-radius: 7px;
  color: var(--n-text-color-2);
  background: var(--event-surface-soft);
  font-size: 12px;
}

.schedule-controls input,
.schedule-today {
  box-sizing: border-box;
  height: 34px;
  padding: 0 10px;
  border: 1px solid var(--event-border);
  border-radius: 7px;
  color: var(--n-text-color);
  background: var(--n-input-color, var(--event-surface));
  font: inherit;
  font-size: 12px;
}

.schedule-today {
  cursor: pointer;
  font-weight: 650;
}

.schedule-today:hover,
.schedule-today:focus-visible,
.schedule-today.is-active {
  color: var(--n-primary-color, #d03050);
  border-color: color-mix(
    in srgb,
    var(--n-primary-color, #d03050) 44%,
    var(--event-border)
  );
  background: var(--event-accent-soft);
}

.discipline-select {
  width: 190px;
}

.schedule-summary {
  display: flex;
  flex-wrap: wrap;
  margin: 0;
  border-bottom: 1px solid var(--event-border);
}

.schedule-summary span {
  padding: 9px 12px;
  color: var(--n-text-color-2);
  font-size: 11px;
}

.schedule-summary span:first-child {
  padding-inline-start: 0;
}

.schedule-summary span + span {
  border-inline-start: 1px solid var(--event-border);
}

.schedule-summary strong {
  color: var(--n-text-color);
  font-size: 12px;
  font-weight: 760;
  font-variant-numeric: tabular-nums;
}

.schedule-summary span.is-live {
  color: var(--n-primary-color, #d03050);
}

.schedule-status-filter {
  display: flex;
  align-items: stretch;
  flex: 0 0 auto;
  gap: 3px;
  min-height: 46px;
  margin: 10px 0 12px;
  padding: 3px;
  overflow-x: auto;
  overflow-y: hidden;
  box-sizing: border-box;
  border: 1px solid var(--event-border);
  border-radius: 9px;
  background: var(--event-surface-soft);
  scrollbar-width: none;
}

.schedule-status-filter::-webkit-scrollbar {
  display: none;
}

.schedule-status-filter button {
  position: relative;
  flex: 1 0 auto;
  min-width: 86px;
  min-height: 38px;
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--n-text-color-2);
  background: transparent;
  cursor: pointer;
  font: inherit;
  font-size: var(--event-font-meta);
  font-weight: 680;
  line-height: 1.2;
  white-space: nowrap;
  transition:
    color 0.14s ease,
    background-color 0.14s ease,
    border-color 0.14s ease;
}

.schedule-status-filter button:hover,
.schedule-status-filter button:focus-visible {
  color: var(--n-text-color);
  background: var(--event-hover);
}

.schedule-status-filter button.is-active {
  color: var(--n-base-color, #fff);
  border-color: color-mix(
    in srgb,
    var(--n-primary-color, #d03050) 84%,
    var(--event-border)
  );
  background: var(--n-primary-color, #d03050);
}

.schedule-list {
  display: grid;
  gap: 0;
  align-content: start;
}

.schedule-row {
  display: grid;
  grid-template-columns: 68px minmax(0, 1fr) auto;
  gap: 13px;
  align-items: center;
  padding: 12px 4px;
  border-bottom: 1px solid var(--event-border);
  transition: background-color 0.14s ease;
}

.schedule-row:hover {
  background: var(--event-hover);
}

.schedule-row.is-live {
  padding-inline-start: 10px;
  border-inline-start: 3px solid var(--n-primary-color, #d03050);
  background: var(--event-accent-soft);
}

.schedule-time strong,
.schedule-time span {
  display: block;
}

.schedule-time strong {
  color: var(--n-text-color);
  font-size: 14px;
  font-weight: 780;
  font-variant-numeric: tabular-nums;
}

.schedule-time span {
  margin-top: 2px;
  color: var(--event-muted);
  font-size: 10px;
}

.schedule-title-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.schedule-discipline,
.schedule-state {
  color: var(--event-muted);
  font-size: 10px;
  font-weight: 700;
}

.schedule-state {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding-inline-start: 8px;
  border-inline-start: 1px solid var(--event-border);
}

.schedule-state__icon {
  display: inline-block;
  min-width: 9px;
  text-align: center;
  font-size: 9px;
  line-height: 1;
}

.schedule-state.is-live {
  color: var(--n-primary-color, #d03050);
}

.schedule-main h3 {
  margin: 4px 0 0;
  color: var(--n-text-color);
  font-size: 13px;
  font-weight: 720;
  line-height: 1.45;
}

.schedule-main p {
  margin: 3px 0 0;
  color: var(--event-muted);
  font-size: 10px;
  line-height: 1.5;
}

.schedule-result {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  max-width: 520px;
  margin-top: 8px;
  padding-top: 7px;
  border-top: 1px dashed var(--event-border);
}

.schedule-result__side {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  color: var(--n-text-color-2);
  font-size: 11px;
}

.schedule-result__side > span:not(.noc-flag) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.schedule-result__side.is-away {
  justify-content: flex-end;
  text-align: end;
}

.schedule-result__side.is-winner {
  color: var(--n-text-color);
  font-weight: 720;
}

.schedule-team-logo {
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  object-fit: contain;
  border-radius: 5px;
  background: var(--event-surface-soft);
}

.schedule-result .noc-flag {
  flex: 0 0 auto;
  font-size: 15px;
  line-height: 1;
}

.schedule-result__score {
  color: var(--n-text-color);
  font-size: 15px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.schedule-result__score span {
  padding-inline: 2px;
  color: var(--event-muted);
  font-weight: 500;
}

.schedule-result__versus {
  color: var(--event-muted);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.schedule-placements {
  display: flex;
  max-width: 620px;
  flex-wrap: wrap;
  gap: 5px 14px;
  margin-top: 8px;
  padding-top: 7px;
  border-top: 1px dashed var(--event-border);
}

.schedule-placement {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  gap: 5px;
  color: var(--n-text-color-2);
  font-size: 10px;
}

.schedule-placement__rank {
  flex: 0 0 auto;
  color: var(--n-text-color);
  font-size: 12px;
  font-weight: 760;
  line-height: 1;
}

.schedule-placement .noc-flag {
  flex: 0 0 auto;
  font-size: 14px;
  line-height: 1;
}

.noc-flag.is-code-fallback {
  display: inline-flex;
  min-width: 26px;
  height: 18px;
  align-items: center;
  justify-content: center;
  padding-inline: 4px;
  border: 1px solid var(--event-border);
  border-radius: 4px;
  color: var(--n-text-color-2);
  background: var(--event-surface-soft);
  font-family: inherit;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.055em;
  line-height: 1;
}

.schedule-placement__identity {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.schedule-placement__result {
  flex: 0 0 auto;
  color: var(--n-text-color);
  font-size: 11px;
  font-weight: 760;
  font-variant-numeric: tabular-nums;
}

.result-link {
  padding: 5px 0 5px 10px;
  border-inline-start: 1px solid var(--event-border);
  font-size: 11px;
  white-space: nowrap;
}

.schedule-more,
.topic-more {
  width: 100%;
  margin-top: 8px;
  padding: 9px 12px;
  border: 1px solid var(--event-border);
  border-radius: 7px;
  color: var(--n-text-color-2);
  background: transparent;
  cursor: pointer;
  font: inherit;
  font-size: 11px;
  font-weight: 680;
}

.schedule-more span,
.topic-more span {
  margin-inline-start: 6px;
  color: var(--event-muted);
  font-weight: 500;
}

.schedule-more:hover,
.schedule-more:focus-visible,
.topic-more:hover,
.topic-more:focus-visible {
  color: var(--n-primary-color, #d03050);
  border-color: color-mix(
    in srgb,
    var(--n-primary-color, #d03050) 48%,
    var(--event-border)
  );
  background: var(--event-hover);
}

.stages-panel {
  padding-bottom: 16px;
}

.stage-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0;
}

.stage-card {
  min-width: 0;
  padding: 14px 14px 4px;
  border-top: 1px solid var(--event-border);
}

.stage-card__head {
  display: grid;
  gap: 3px;
  margin-bottom: 8px;
}

.stage-card__head strong {
  color: var(--n-text-color-1);
  font-size: 13px;
  font-weight: 720;
}

.stage-card__head span {
  color: var(--n-primary-color, #d03050);
  font-size: 10px;
  font-weight: 680;
}

.stage-card p {
  margin: 0;
  color: var(--n-text-color-2);
  font-size: 11px;
  line-height: 1.5;
}

.stage-card small {
  display: block;
  margin-top: 6px;
  color: var(--event-muted);
  font-size: 10px;
  line-height: 1.45;
}

.topic-panel {
  padding-bottom: 16px;
}

.topic-panel__status {
  display: flex;
  align-items: flex-end;
  flex-direction: column;
  gap: 2px;
  color: var(--event-muted);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

.topic-panel__lead {
  max-width: 880px;
  margin: -2px 0 12px;
  color: var(--n-text-color-2);
  font-size: 11px;
  line-height: 1.65;
}

.topic-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  column-gap: 20px;
}

.topic-card {
  min-width: 0;
  padding: 14px 2px 13px;
  border-top: 1px solid var(--event-border);
}

.topic-card__main {
  display: block;
  min-width: 0;
  color: inherit;
  text-decoration: none;
}

.topic-card__main.has-media {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 12px;
}

.topic-card__media {
  width: 96px;
  height: 72px;
  overflow: hidden;
  border-radius: 7px;
  background: var(--event-surface-soft);
}

.topic-card__media img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.topic-card__body {
  min-width: 0;
}

.topic-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 5px 10px;
  color: var(--event-muted);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

.topic-trend {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--n-text-color-2);
  font-weight: 680;
}

.topic-trend.is-new,
.topic-trend.is-rising,
.topic-trend.is-reentry {
  color: var(--n-primary-color, #d03050);
}

.topic-trend.is-falling {
  color: var(--event-muted);
}

.topic-card h3 {
  margin: 7px 0 0;
  color: var(--n-text-color);
  font-size: 14px;
  font-weight: 720;
  line-height: 1.48;
  letter-spacing: -0.008em;
}

.topic-card__main:hover h3,
.topic-card__main:focus-visible h3 {
  color: var(--n-primary-color, #d03050);
}

.topic-card p {
  display: -webkit-box;
  margin: 6px 0 0;
  overflow: hidden;
  color: var(--n-text-color-2);
  font-size: 11px;
  line-height: 1.58;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.topic-card__evidence {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 9px;
}

.topic-source-list {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 5px;
}

.topic-source-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  max-width: 180px;
  padding: 3px 6px;
  border: 1px solid var(--event-border);
  border-radius: 999px;
  color: var(--n-text-color-2);
  background: var(--event-surface-soft);
  font-size: 9px;
  line-height: 1.2;
}

.topic-source-chip img {
  width: 13px;
  height: 13px;
  flex: 0 0 13px;
  border-radius: 3px;
  object-fit: contain;
}

.topic-source-chip > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.topic-source-chip small {
  color: var(--event-muted);
  font-size: 9px;
  font-variant-numeric: tabular-nums;
}

.topic-heat {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 3px;
  color: var(--event-muted);
  font-size: 9px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.topic-heat__icon {
  width: 12px;
  height: 12px;
  flex: 0 0 12px;
  color: var(--n-primary-color, #d03050);
  font-size: 12px;
}

.news-panel {
  padding-bottom: 18px;
}

.news-timeline {
  position: relative;
  display: grid;
  gap: 0;
  padding-top: 4px;
}

.news-timeline__item {
  position: relative;
  display: grid;
  grid-template-columns: 132px minmax(0, 1fr);
  gap: 18px;
  min-width: 0;
  padding: 15px 2px 16px;
  color: inherit;
  text-decoration: none;
  border-top: 1px solid var(--event-border);
}

.news-timeline__rail {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  min-width: 0;
  padding: 2px 18px 0 0;
  color: var(--event-muted);
  font-size: var(--event-font-caption);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.news-timeline__rail::after {
  content: "";
  position: absolute;
  top: 19px;
  right: 4px;
  bottom: -18px;
  width: 1px;
  background: var(--event-border);
}

.news-timeline__item:last-child .news-timeline__rail::after {
  display: none;
}

.news-timeline__dot {
  position: absolute;
  top: 7px;
  right: 0;
  width: 9px;
  height: 9px;
  border: 2px solid var(--event-surface);
  border-radius: 50%;
  background: var(--n-primary-color, #d03050);
}

.news-timeline__content {
  min-width: 0;
}

.news-timeline__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 5px 12px;
  color: var(--event-muted);
  font-size: var(--event-font-caption);
}

.news-timeline__content h3 {
  margin: 6px 0 0;
  color: var(--n-text-color);
  font-size: 16px;
  font-weight: 730;
  line-height: 1.5;
  letter-spacing: -0.008em;
}

.news-timeline__content p {
  display: -webkit-box;
  margin: 6px 0 0;
  overflow: hidden;
  color: var(--n-text-color-2);
  font-size: var(--event-font-meta);
  line-height: 1.65;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.news-timeline__item:hover h3,
.news-timeline__item:focus-visible h3 {
  color: var(--n-primary-color, #d03050);
}

.news-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 24px;
}

.news-card {
  min-width: 0;
  padding: 15px 2px 16px;
  border-top: 1px solid var(--event-border);
  color: inherit;
  background: transparent;
  text-decoration: none;
  transition:
    border-color 0.14s ease,
    color 0.14s ease;
}

.news-card:hover,
.news-card:focus-visible {
  border-color: color-mix(
    in srgb,
    var(--n-primary-color, #d03050) 54%,
    var(--event-border)
  );
}

.news-card__meta {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: var(--event-muted);
  font-size: 10px;
}

.news-card h3 {
  margin: 8px 0 0;
  color: var(--n-text-color);
  font-size: 15px;
  font-weight: 720;
  line-height: 1.48;
  letter-spacing: -0.008em;
}

.news-card:hover h3,
.news-card:focus-visible h3 {
  color: var(--n-primary-color, #d03050);
}

.news-card p {
  display: -webkit-box;
  margin: 7px 0 0;
  overflow: hidden;
  color: var(--n-text-color-2);
  font-size: 11px;
  line-height: 1.62;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.news-card__open {
  display: inline-block;
  margin-top: 8px;
  color: var(--n-primary-color, #d03050);
  font-size: 10px;
  font-weight: 680;
}

.event-source-note {
  display: flex;
  gap: 10px;
  padding: 12px 4px 0;
  border-top: 1px solid var(--event-border);
  color: var(--event-muted);
  font-size: 10px;
  line-height: 1.65;
}

.event-source-note strong {
  flex: 0 0 auto;
  color: var(--n-text-color-2);
}

/* Event Hub readability scale: keep auxiliary metadata compact without
   dropping core content into 9–11px micro type. */
.event-hero__eyebrow,
.event-status,
.event-hero__meta,
.event-degraded,
.panel-count,
.panel-more,
.snapshot-stat > span,
.standings-group > header strong,
.standings-team strong,
.medal-table,
.delegation-cell strong,
.schedule-controls,
.schedule-summary span,
.schedule-result__side,
.schedule-placement,
.schedule-placement__result,
.result-link,
.schedule-more,
.topic-more,
.stage-card p,
.topic-panel__lead,
.topic-card p,
.news-card p,
.event-source-note {
  font-size: var(--event-font-meta);
}

.panel-kicker,
.snapshot-head,
.snapshot-stat > small,
.standings-group > header span,
.standings-team__fallback,
.standings-team small,
.medal-table thead th,
.delegation-copy > span,
.schedule-time span,
.schedule-discipline,
.schedule-state,
.stage-card__head span,
.stage-card small,
.topic-panel__status,
.topic-card__meta,
.news-card__meta,
.news-card__open {
  font-size: var(--event-font-caption);
}

.schedule-state__icon,
.topic-source-chip,
.topic-source-chip small,
.topic-heat {
  font-size: var(--event-font-micro);
}

.event-hero__description,
.schedule-time strong,
.schedule-main h3,
.schedule-main p,
.schedule-placements,
.topic-card h3,
.news-card h3 {
  font-size: var(--event-font-body);
}

.topic-card h3,
.news-card h3 {
  font-size: var(--event-font-title);
}

.event-link:focus-visible,
.result-link:focus-visible,
.panel-more:focus-visible,
.schedule-more:focus-visible,
.topic-more:focus-visible,
.topic-card__main:focus-visible,
.schedule-today:focus-visible,
.schedule-scope button:focus-visible,
.schedule-status-filter button:focus-visible,
.event-brief-item:focus-visible,
.news-card:focus-visible,
.news-timeline__item:focus-visible,
.schedule-controls input:focus-visible {
  outline: 2px solid var(--n-primary-color, #d03050);
  outline-offset: 2px;
}

.event-hub.is-aichi-event .panel-head {
  position: relative;
  padding-inline-start: 13px;
}

.event-hub.is-aichi-event .panel-head::before {
  content: "";
  position: absolute;
  inset-inline-start: 0;
  top: 1px;
  bottom: 12px;
  width: 3px;
  border-radius: 999px;
  background: var(--aichi-kakitsubata-purple);
}

.event-hub.is-aichi-event .panel-kicker {
  color: color-mix(
    in srgb,
    var(--aichi-kakitsubata-purple) 72%,
    var(--n-text-color-2)
  );
}

/* Event Hub typography floor: legacy 9–11px labels are too small for a dense live-event surface. */
.event-hub {
  font-size: var(--event-font-body);
}

.event-hero__eyebrow,
.event-status,
.event-hero__meta,
.snapshot-head,
.snapshot-stat > span,
.standings-group > header strong,
.standings-team strong,
.medal-table,
.delegation-cell strong,
.medal-head > span,
.schedule-scope button,
.schedule-range-field,
.schedule-range-all,
.schedule-summary strong,
.schedule-status-filter button,
.schedule-placement__rank,
.stage-card__head strong {
  font-size: var(--event-font-meta);
}

.panel-kicker,
.panel-more,
.event-hub small,
.snapshot-stat > small,
.standings-group > header span,
.standings-team__fallback,
.standings-team small,
.medal-table thead th,
.delegation-copy > span,
.schedule-summary span,
.schedule-time span,
.schedule-discipline,
.schedule-state,
.schedule-state__icon,
.schedule-main p,
.schedule-result__side,
.schedule-placement,
.schedule-placement__result,
.result-link,
.schedule-more,
.topic-more,
.topic-panel__status,
.topic-panel__lead,
.topic-card__meta,
.topic-card p,
.stage-card__head span,
.stage-card p,
.stage-card small,
.topic-source-chip,
.topic-source-chip small,
.topic-heat,
.news-card__meta,
.news-card p,
.news-card__open,
.event-source-note {
  font-size: var(--event-font-caption);
}

.event-hero__description,
.schedule-main p {
  font-size: var(--event-font-body);
}

.event-brief-item__content strong,
.event-brief-item__detail,
.schedule-result__side,
.schedule-placement,
.schedule-placement__result,
.stage-card p,
.topic-panel__lead,
.topic-card p,
.news-card p {
  font-size: var(--event-font-reading);
}

.schedule-main h3,
.topic-card h3 {
  font-size: var(--event-font-title);
}

@media (min-width: 1081px) {
  .event-dashboard > .primary-panel,
  .event-dashboard > .schedule-panel {
    display: flex;
    min-height: 0;
    height: clamp(560px, 68vh, 720px);
    flex-direction: column;
  }

  .primary-panel .medal-table-wrap,
  .primary-panel .standings-groups,
  .schedule-panel .schedule-list {
    min-height: 0;
    flex: 1 1 auto;
    overflow-y: auto;
    scrollbar-gutter: stable;
  }

  .schedule-panel .panel-loading {
    flex: 1 1 auto;
  }
}

@media (max-width: 1360px) and (min-width: 721px) {
  .topic-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1080px) {
  .event-hero {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .event-hero__snapshot {
    padding-inline-start: 0;
    padding-top: 18px;
    border-inline-start: 0;
    border-top: 1px solid var(--event-border);
  }

  .event-dashboard {
    grid-template-columns: 1fr;
  }

  .stage-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .topic-grid,
  .event-brief-timeline {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .event-hub {
    gap: 12px;
  }

  .event-hero,
  .event-panel {
    border-radius: 10px;
  }

  .event-hero {
    gap: 17px;
    padding: 18px;
  }

  .event-hero h1 {
    font-size: 28px;
    line-height: 1.16;
  }

  .event-hero__description {
    font-size: var(--event-font-body);
  }

  .event-hero__meta {
    display: grid;
    gap: 4px;
    margin-top: 14px;
  }

  .event-hero__meta span + span::before {
    display: none;
  }

  .snapshot-stat {
    padding: 8px;
  }

  .snapshot-stat strong {
    font-size: 19px;
  }

  .event-panel {
    padding: 14px 16px;
  }

  .panel-head {
    padding-bottom: 11px;
  }

  .panel-head h2 {
    font-size: 18px;
  }

  .schedule-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .event-brief-strip {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 14px 0 0;
  }

  .event-brief-timeline {
    grid-template-columns: 1fr;
  }

  .event-brief-item:nth-child(n + 4) {
    display: none;
  }

  .event-brief-item__detail {
    display: none;
  }

  .event-brief-strip__head {
    grid-template-columns: auto 1fr;
    align-items: baseline;
    gap: 3px 10px;
  }

  .event-brief-strip__source {
    grid-column: 1 / -1;
  }

  .event-brief-item__content strong {
    white-space: normal;
  }

  .schedule-controls {
    width: 100%;
    justify-items: stretch;
  }

  .schedule-scope {
    width: 100%;
  }

  .schedule-control-row {
    width: 100%;
    justify-content: flex-start;
  }

  .schedule-controls label {
    flex: 1 1 45%;
  }

  .schedule-controls input,
  .discipline-select {
    width: 100%;
  }

  .schedule-row {
    grid-template-columns: 56px minmax(0, 1fr);
    gap: 8px;
    padding-block: 11px;
  }

  .result-link {
    grid-column: 2;
    justify-self: start;
    padding-inline-start: 0;
    border-inline-start: 0;
  }

  .stage-grid,
  .topic-grid,
  .news-grid {
    grid-template-columns: 1fr;
  }

  .news-timeline__item {
    grid-template-columns: 92px minmax(0, 1fr);
    gap: 12px;
  }

  .news-timeline__rail {
    padding-inline-end: 15px;
  }

  .news-timeline__rail::after {
    right: 3px;
  }

  .news-timeline__dot {
    right: -1px;
  }

  .stage-card {
    padding-inline: 2px;
  }

  .topic-card__main.has-media {
    grid-template-columns: 78px minmax(0, 1fr);
    gap: 10px;
  }

  .topic-card__media {
    width: 78px;
    height: 58px;
  }

  .topic-card__evidence {
    align-items: flex-start;
    flex-direction: column;
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
  .schedule-status-filter button {
    flex: 1 1 0;
    min-width: 0;
    min-height: 38px;
    padding-inline: 6px;
  }

  .standings-team-grid {
    grid-template-columns: 1fr;
  }

  .snapshot-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .snapshot-stat,
  .snapshot-stat:first-child,
  .snapshot-stat:last-child {
    display: block;
    min-width: 0;
    padding: 8px 7px;
  }

  .snapshot-stat:first-child {
    padding-inline-start: 0;
  }

  .snapshot-stat:last-child {
    padding-inline-end: 0;
  }

  .snapshot-stat > strong {
    font-size: 18px;
  }

  .snapshot-stat > span {
    margin-top: 4px;
  }

  .snapshot-stat > small {
    margin-top: 2px;
  }

  .snapshot-leader {
    gap: 4px;
  }

  .snapshot-leader .noc-flag {
    font-size: 17px;
  }

  .snapshot-stat + .snapshot-stat {
    border-top: 1px solid var(--event-border);
    border-inline-start: 0;
  }

  .snapshot-stat small {
    grid-column: 2;
    margin-top: 0;
  }

  .schedule-summary span {
    flex: 1 1 50%;
    border-inline-start: 0 !important;
    padding-inline: 0 8px;
  }
}


/* Event Hub live-dashboard v4: current information first, compact header, three live columns. */
.event-refresh-state,
.schedule-focus-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--aichi-shinrin-green);
  font-size: var(--event-font-caption);
  font-weight: 700;
}

.event-refresh-state.is-stale {
  color: var(--n-warning-color, #f0a020);
}

.event-refresh-state i,
.schedule-focus-indicator i {
  width: 6px;
  height: 6px;
  flex: 0 0 6px;
  border-radius: 50%;
  background: currentColor;
}

.event-hub.is-aichi-event .event-hero {
  grid-template-columns: minmax(0, 1fr) minmax(300px, 370px);
  gap: 12px 18px;
  padding: 14px 18px 12px;
}

.event-hub.is-aichi-event .event-hero h1 {
  margin: 5px 0 4px;
  font-size: clamp(26px, 2.4vw, 32px);
  line-height: 1.12;
}

.event-hub.is-aichi-event .event-hero__meta {
  gap: 4px 16px;
  margin-top: 7px;
}

.event-hub.is-aichi-event .event-hero__actions {
  gap: 6px;
  margin-top: 8px;
}

.event-hub.is-aichi-event .event-link {
  min-height: 28px;
  padding-inline: 9px;
  border-radius: 6px;
  font-size: var(--event-font-caption);
}

.event-hub.is-aichi-event .event-hero__snapshot {
  justify-content: flex-start;
  padding-inline-start: 16px;
}

.event-hub.is-aichi-event .snapshot-head {
  padding-bottom: 6px;
}

.event-hub.is-aichi-event .snapshot-grid {
  margin-top: 6px;
}

.event-hub.is-aichi-event .snapshot-stat {
  padding: 4px 8px;
}

.event-hub.is-aichi-event .snapshot-stat > strong {
  font-size: 18px;
}

.event-hub.is-aichi-event .event-brief-strip {
  grid-template-columns: 116px minmax(0, 1fr);
  gap: 12px;
  margin-top: 0;
  padding-top: 9px;
}

.event-hub.is-aichi-event .event-brief-strip__head {
  gap: 2px;
  padding-top: 2px;
}

.event-hub.is-aichi-event .event-brief-strip__head h2 {
  font-size: 16px;
}

.event-hub.is-aichi-event .event-brief-timeline {
  grid-template-columns: 1fr;
  gap: 0;
}

.event-hub.is-aichi-event .event-brief-item {
  grid-template-columns: 52px 12px minmax(0, 1fr);
  gap: 7px;
  padding: 3px 0 4px;
}

.event-hub.is-aichi-event .event-brief-item::before {
  left: 57px;
  top: 13px;
  bottom: -4px;
}

.event-hub.is-aichi-event .event-brief-item:last-child::before {
  display: none;
}

.event-hub.is-aichi-event .event-brief-item time {
  padding-top: 0;
}

.event-hub.is-aichi-event .event-brief-item__content {
  gap: 1px;
}

.event-hub.is-aichi-event .event-brief-item__content strong {
  overflow: visible;
  font-size: var(--event-font-meta);
  line-height: 1.38;
  text-overflow: clip;
  white-space: normal;
}

.event-hub.is-aichi-event .event-brief-item__content small,
.event-hub.is-aichi-event .event-brief-item__detail {
  display: none;
}

.schedule-status-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.schedule-status-row .schedule-status-filter {
  min-width: 0;
  flex: 1 1 auto;
}

.schedule-focus-now {
  min-height: 34px;
  flex: 0 0 auto;
  padding: 0 9px;
  border: 1px solid var(--event-border);
  border-radius: 7px;
  color: var(--n-primary-color, #d03050);
  background: var(--event-surface);
  cursor: pointer;
  font: inherit;
  font-size: var(--event-font-caption);
  font-weight: 700;
}

.schedule-focus-now:hover,
.schedule-focus-now:focus-visible {
  border-color: var(--n-primary-color, #d03050);
  background: var(--event-accent-soft);
}

.schedule-focus-indicator {
  min-height: 34px;
  flex: 0 0 auto;
  padding-inline: 4px;
  white-space: nowrap;
}

@media (min-width: 1081px) {
  .event-hub.is-aichi-event {
    grid-template-columns:
      minmax(260px, 0.9fr)
      minmax(400px, 1.35fr)
      minmax(260px, 0.95fr);
    gap: 12px;
  }

  .event-hub.is-aichi-event > .event-hero,
  .event-hub.is-aichi-event > .event-degraded,
  .event-hub.is-aichi-event > .stages-panel,
  .event-hub.is-aichi-event > .news-panel,
  .event-hub.is-aichi-event > .event-source-note {
    grid-column: 1 / -1;
  }

  .event-hub.is-aichi-event > .event-hero {
    order: 0;
  }

  .event-hub.is-aichi-event > .event-degraded {
    order: 1;
  }

  .event-hub.is-aichi-event > .event-dashboard {
    display: contents;
  }

  .event-hub.is-aichi-event .event-dashboard > .primary-panel,
  .event-hub.is-aichi-event .event-dashboard > .schedule-panel,
  .event-hub.is-aichi-event > .topic-panel {
    display: flex;
    min-height: 0;
    height: clamp(500px, calc(100vh - 310px), 590px);
    flex-direction: column;
    order: 2;
  }

  .event-hub.is-aichi-event .event-dashboard > .primary-panel {
    grid-column: 1;
  }

  .event-hub.is-aichi-event .event-dashboard > .schedule-panel {
    grid-column: 2;
  }

  .event-hub.is-aichi-event > .topic-panel {
    grid-column: 3;
  }

  .event-hub.is-aichi-event > .stages-panel {
    order: 3;
  }

  .event-hub.is-aichi-event > .news-panel {
    order: 4;
  }

  .event-hub.is-aichi-event > .event-source-note {
    order: 5;
  }

  .event-hub.is-aichi-event .primary-panel .medal-table-wrap,
  .event-hub.is-aichi-event .primary-panel .standings-groups,
  .event-hub.is-aichi-event .schedule-panel .schedule-list,
  .event-hub.is-aichi-event .topic-panel .topic-grid {
    min-height: 0;
    flex: 1 1 auto;
    overflow-y: auto;
    scrollbar-gutter: stable;
  }

  .event-hub.is-aichi-event .schedule-head {
    align-items: stretch;
    flex-direction: column;
    gap: 8px;
  }

  .event-hub.is-aichi-event .schedule-controls {
    width: 100%;
    min-width: 0;
    justify-items: stretch;
  }

  .event-hub.is-aichi-event .schedule-scope {
    width: 100%;
  }

  .event-hub.is-aichi-event .schedule-control-row {
    justify-content: flex-start;
  }

  .event-hub.is-aichi-event .discipline-select {
    min-width: 0;
    flex: 1 1 150px;
  }

  .event-hub.is-aichi-event .topic-panel__lead {
    margin-bottom: 6px;
  }

  .event-hub.is-aichi-event .topic-panel .topic-grid {
    grid-template-columns: 1fr;
    column-gap: 0;
  }

  .event-hub.is-aichi-event .topic-card {
    padding-block: 10px;
  }

  .event-hub.is-aichi-event .topic-card__main.has-media {
    grid-template-columns: 72px minmax(0, 1fr);
    gap: 9px;
  }

  .event-hub.is-aichi-event .topic-card__media {
    width: 72px;
    height: 54px;
  }

  .event-hub.is-aichi-event .topic-card p {
    -webkit-line-clamp: 2;
  }
}

@media (max-width: 1080px) and (min-width: 721px) {
  .event-hub.is-aichi-event {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .event-hub.is-aichi-event > .event-hero,
  .event-hub.is-aichi-event > .event-degraded,
  .event-hub.is-aichi-event > .stages-panel,
  .event-hub.is-aichi-event > .news-panel,
  .event-hub.is-aichi-event > .event-source-note {
    grid-column: 1 / -1;
  }

  .event-hub.is-aichi-event > .event-dashboard {
    display: contents;
  }

  .event-hub.is-aichi-event .event-dashboard > .schedule-panel {
    grid-column: 1 / -1;
    order: 2;
  }

  .event-hub.is-aichi-event .event-dashboard > .primary-panel {
    grid-column: 1;
    order: 3;
  }

  .event-hub.is-aichi-event > .topic-panel {
    grid-column: 2;
    order: 3;
  }

  .event-hub.is-aichi-event > .stages-panel {
    order: 4;
  }

  .event-hub.is-aichi-event > .news-panel {
    order: 5;
  }

  .event-hub.is-aichi-event > .event-source-note {
    order: 6;
  }

  .event-hub.is-aichi-event .schedule-panel {
    display: flex;
    height: 500px;
    flex-direction: column;
  }

  .event-hub.is-aichi-event .schedule-panel .schedule-list {
    min-height: 0;
    flex: 1 1 auto;
    overflow-y: auto;
  }

  .event-hub.is-aichi-event .topic-panel .topic-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .event-hub.is-aichi-event {
    grid-template-columns: 1fr;
  }

  .event-hub.is-aichi-event > .event-dashboard {
    display: contents;
  }

  .event-hub.is-aichi-event .event-dashboard > .schedule-panel {
    grid-column: 1;
    order: 2;
  }

  .event-hub.is-aichi-event .event-dashboard > .primary-panel {
    grid-column: 1;
    order: 3;
  }

  .event-hub.is-aichi-event > .topic-panel {
    grid-column: 1;
    order: 4;
  }

  .event-hub.is-aichi-event > .stages-panel {
    order: 5;
  }

  .event-hub.is-aichi-event > .news-panel {
    order: 6;
  }

  .event-hub.is-aichi-event > .event-source-note {
    order: 7;
  }

  .event-hub.is-aichi-event .event-hero {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 14px;
  }

  .event-hub.is-aichi-event .event-hero h1 {
    font-size: 25px;
  }

  .event-hub.is-aichi-event .event-hero__snapshot {
    padding: 9px 0 0;
  }

  .event-hub.is-aichi-event .event-brief-strip {
    grid-template-columns: 1fr;
    gap: 5px;
    padding-top: 8px;
  }

  .event-hub.is-aichi-event .event-brief-strip__head {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 4px 9px;
  }

  .event-hub.is-aichi-event .event-brief-strip__source {
    margin-inline-start: auto;
  }

  .event-hub.is-aichi-event .event-brief-item:nth-child(n + 4) {
    display: none;
  }

  .schedule-status-row {
    align-items: stretch;
    flex-direction: column;
    gap: 6px;
  }

  .schedule-focus-now,
  .schedule-focus-indicator {
    align-self: flex-start;
  }
}


@media (max-width: 720px) {
  .event-hub.is-aichi-event .event-hero {
    gap: 7px;
    padding: 11px 12px 10px;
  }

  .event-hub.is-aichi-event .event-hero h1 {
    margin-block: 3px;
    font-size: 22px;
  }

  .event-hub.is-aichi-event .event-hero__meta {
    gap: 2px 10px;
    margin-top: 5px;
  }

  .event-hub.is-aichi-event .event-hero__actions {
    flex-wrap: nowrap;
    gap: 5px;
    margin-top: 5px;
    overflow-x: auto;
    padding-bottom: 1px;
  }

  .event-hub.is-aichi-event .event-link {
    min-height: 26px;
    flex: 0 0 auto;
    white-space: nowrap;
  }

  .event-hub.is-aichi-event .event-hero__snapshot {
    display: none;
  }

  .event-hub.is-aichi-event .snapshot-head {
    display: none;
  }

  .event-hub.is-aichi-event .snapshot-grid {
    margin-top: 0;
  }

  .event-hub.is-aichi-event .snapshot-stat {
    padding: 4px 5px;
  }

  .event-hub.is-aichi-event .snapshot-stat > strong {
    font-size: 17px;
  }

  .event-hub.is-aichi-event .event-brief-strip {
    gap: 3px;
    padding-top: 5px;
  }

  .event-hub.is-aichi-event .event-brief-strip__head h2 {
    font-size: 15px;
  }

  .event-hub.is-aichi-event .event-brief-item {
    padding-block: 2px 3px;
  }
}


/* Event Hub dashboard polish v5: dense sports information, restrained status color. */
@media (min-width: 1081px) {
  .event-hub.is-aichi-event .event-dashboard > .primary-panel,
  .event-hub.is-aichi-event .event-dashboard > .schedule-panel,
  .event-hub.is-aichi-event > .topic-panel {
    padding: 14px 14px 12px;
  }

  .event-hub.is-aichi-event .panel-head {
    min-height: 0;
    gap: 10px;
    padding-bottom: 10px;
  }

  .event-hub.is-aichi-event .panel-kicker {
    margin-bottom: 3px;
    font-size: 11px;
  }

  .event-hub.is-aichi-event .panel-head h2 {
    font-size: 18px;
  }

  /* Medal table must fit the real left-column width without horizontal scrolling. */
  .event-hub.is-aichi-event .primary-panel .medal-table-wrap {
    overflow-x: hidden;
  }

  .event-hub.is-aichi-event .primary-panel .medal-table {
    width: 100%;
    min-width: 0;
    table-layout: fixed;
    font-size: 13px;
  }

  .event-hub.is-aichi-event .primary-panel .medal-table th,
  .event-hub.is-aichi-event .primary-panel .medal-table td {
    padding: 9px 4px;
  }

  .event-hub.is-aichi-event .primary-panel .medal-table th:nth-child(1),
  .event-hub.is-aichi-event .primary-panel .medal-table td:nth-child(1) {
    width: 34px;
  }

  .event-hub.is-aichi-event .primary-panel .medal-table th:nth-child(3),
  .event-hub.is-aichi-event .primary-panel .medal-table td:nth-child(3),
  .event-hub.is-aichi-event .primary-panel .medal-table th:nth-child(4),
  .event-hub.is-aichi-event .primary-panel .medal-table td:nth-child(4),
  .event-hub.is-aichi-event .primary-panel .medal-table th:nth-child(5),
  .event-hub.is-aichi-event .primary-panel .medal-table td:nth-child(5),
  .event-hub.is-aichi-event .primary-panel .medal-table th:nth-child(6),
  .event-hub.is-aichi-event .primary-panel .medal-table td:nth-child(6) {
    width: 39px;
  }

  .event-hub.is-aichi-event .primary-panel .medal-table thead th {
    font-size: 11px;
  }

  .event-hub.is-aichi-event .primary-panel .medal-head {
    gap: 2px;
  }

  .event-hub.is-aichi-event .primary-panel .medal-head > span {
    font-size: 12px;
  }

  .event-hub.is-aichi-event .primary-panel .delegation-identity {
    gap: 6px;
  }

  .event-hub.is-aichi-event .primary-panel .delegation-identity .noc-flag {
    font-size: 17px;
  }

  .event-hub.is-aichi-event .primary-panel .delegation-copy {
    overflow: hidden;
  }

  .event-hub.is-aichi-event .primary-panel .delegation-cell strong {
    overflow: hidden;
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .event-hub.is-aichi-event .primary-panel .delegation-copy > span {
    margin-top: 1px;
    font-size: 10px;
  }

  .event-hub.is-aichi-event .primary-panel .medal-number,
  .event-hub.is-aichi-event .primary-panel .total-number {
    font-size: 13px;
  }

  /* One compact schedule toolbar instead of three visually heavy control bands. */
  .event-hub.is-aichi-event .schedule-head {
    display: block;
    flex: 0 0 auto;
    padding-bottom: 8px;
  }

  .event-hub.is-aichi-event .schedule-summary,
  .event-hub.is-aichi-event .schedule-status-row {
    flex: 0 0 auto;
  }

  .event-hub.is-aichi-event .schedule-head > div:first-child {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }

  .event-hub.is-aichi-event .schedule-heading-copy {
    min-width: 0;
  }

  .event-hub.is-aichi-event .schedule-watch-nav {
    display: inline-flex;
    min-width: 0;
    align-items: center;
    justify-content: flex-end;
    gap: 5px;
    color: var(--event-muted);
    font-size: 10px;
    white-space: nowrap;
  }

  .event-hub.is-aichi-event .schedule-watch-nav > span {
    color: var(--event-muted);
    font-weight: 650;
  }

  .event-hub.is-aichi-event .schedule-watch-nav a {
    display: inline-flex;
    min-height: 24px;
    align-items: center;
    gap: 3px;
    padding: 0 7px;
    border: 1px solid var(--event-border);
    border-radius: 999px;
    color: var(--n-text-color-2);
    background: var(--event-surface);
    text-decoration: none;
    font-weight: 680;
  }

  .event-hub.is-aichi-event .schedule-watch-nav a:hover,
  .event-hub.is-aichi-event .schedule-watch-nav a:focus-visible {
    color: var(--n-primary-color, #d03050);
    border-color: color-mix(
      in srgb,
      var(--n-primary-color, #d03050) 32%,
      var(--event-border)
    );
    background: var(--event-hover);
  }

  .event-hub.is-aichi-event .schedule-controls {
    display: grid;
    grid-template-columns: 190px minmax(0, 1fr);
    align-items: center;
    gap: 6px;
    width: 100%;
    margin-top: 8px;
  }

  .event-hub.is-aichi-event .schedule-scope {
    width: 190px;
    gap: 2px;
    padding: 2px;
    border-radius: 7px;
  }

  .event-hub.is-aichi-event .schedule-scope button {
    min-height: 27px;
    padding: 0 6px;
    border-radius: 5px;
    font-size: 11px;
  }

  .event-hub.is-aichi-event .schedule-scope button.is-active {
    color: var(--n-primary-color, #d03050);
    border: 1px solid
      color-mix(in srgb, var(--n-primary-color, #d03050) 32%, var(--event-border));
    background: color-mix(
      in srgb,
      var(--n-primary-color, #d03050) 10%,
      var(--event-surface)
    );
  }

  .event-hub.is-aichi-event .schedule-control-row {
    min-width: 0;
    flex-wrap: nowrap;
    justify-content: flex-end;
    gap: 5px;
  }

  .event-hub.is-aichi-event .schedule-controls input,
  .event-hub.is-aichi-event .schedule-today,
  .event-hub.is-aichi-event .schedule-range-all {
    height: 31px;
    min-height: 31px;
    padding-inline: 8px;
    border-radius: 6px;
    font-size: 11px;
  }

  .event-hub.is-aichi-event .schedule-today {
    flex: 0 0 auto;
  }

  .event-hub.is-aichi-event .schedule-today.is-active {
    color: var(--n-primary-color, #d03050);
    border-color: color-mix(
      in srgb,
      var(--n-primary-color, #d03050) 30%,
      var(--event-border)
    );
    background: color-mix(
      in srgb,
      var(--n-primary-color, #d03050) 7%,
      var(--event-surface)
    );
  }

  .event-hub.is-aichi-event .discipline-select {
    width: auto;
    min-width: 112px;
    flex: 1 1 112px;
  }

  .event-hub.is-aichi-event .schedule-summary {
    gap: 12px;
    padding: 6px 0 5px;
    border-bottom: 0;
  }

  .event-hub.is-aichi-event .schedule-summary span {
    padding: 0;
    border-inline-start: 0 !important;
    font-size: 11px;
  }

  .event-hub.is-aichi-event .schedule-summary strong {
    font-size: 12px;
  }

  .event-hub.is-aichi-event .schedule-status-row {
    gap: 7px;
    margin-bottom: 7px;
    padding-bottom: 7px;
    border-bottom: 1px solid var(--event-border);
  }

  .event-hub.is-aichi-event .schedule-status-filter {
    min-height: 34px;
    margin: 0;
    padding: 2px;
    gap: 2px;
    border-radius: 7px;
  }

  .event-hub.is-aichi-event .schedule-status-filter button {
    min-width: 0;
    min-height: 28px;
    padding: 0 9px;
    border-radius: 5px;
    font-size: 11px;
  }

  .event-hub.is-aichi-event .schedule-status-filter button.is-active {
    color: var(--n-primary-color, #d03050);
    border-color: transparent;
    background: color-mix(
      in srgb,
      var(--n-primary-color, #d03050) 9%,
      var(--event-surface)
    );
  }

  .event-hub.is-aichi-event .schedule-focus-indicator {
    min-height: 30px;
    padding-inline: 2px;
    font-size: 11px;
  }

  .event-hub.is-aichi-event .schedule-focus-now {
    min-height: 30px;
    padding-inline: 8px;
    border-radius: 6px;
    font-size: 11px;
  }

  .event-hub.is-aichi-event .schedule-list {
    border-top: 0;
  }

  .event-hub.is-aichi-event .schedule-row {
    grid-template-columns: 58px minmax(0, 1fr) auto;
    gap: 10px;
    padding: 10px 4px;
    align-items: start;
  }

  .event-hub.is-aichi-event .schedule-row.is-live {
    padding-inline-start: 8px;
    border-inline-start-width: 2px;
    background: transparent;
  }

  .event-hub.is-aichi-event .schedule-row.is-live:hover {
    background: var(--event-hover);
  }

  .event-hub.is-aichi-event .schedule-time strong {
    font-size: 15px;
  }

  .event-hub.is-aichi-event .schedule-time span {
    margin-top: 1px;
    font-size: 11px;
  }

  .event-hub.is-aichi-event .schedule-title-line {
    gap: 6px;
  }

  .event-hub.is-aichi-event .schedule-discipline,
  .event-hub.is-aichi-event .schedule-state {
    font-size: 11px;
  }

  .event-hub.is-aichi-event .schedule-state {
    gap: 3px;
    padding-inline-start: 6px;
  }

  .event-hub.is-aichi-event .schedule-main h3 {
    margin-top: 3px;
    font-size: 14px;
    line-height: 1.38;
  }

  .event-hub.is-aichi-event .schedule-main p {
    margin-top: 2px;
    font-size: 11px;
    line-height: 1.42;
  }

  .event-hub.is-aichi-event .schedule-result {
    gap: 7px;
    margin-top: 6px;
    padding-top: 6px;
  }

  .event-hub.is-aichi-event .schedule-result__side {
    font-size: 12px;
  }

  .event-hub.is-aichi-event .schedule-result__score {
    font-size: 16px;
  }

  .event-hub.is-aichi-event .schedule-placements {
    display: grid;
    grid-template-columns: 1fr;
    gap: 3px;
    margin-top: 6px;
    padding-top: 6px;
  }

  .event-hub.is-aichi-event .schedule-placement {
    display: grid;
    grid-template-columns: 32px auto minmax(0, 1fr) auto;
    gap: 5px;
    font-size: 11px;
  }

  .event-hub.is-aichi-event .schedule-placement__identity {
    min-width: 0;
  }

  .event-hub.is-aichi-event .schedule-placement__result {
    font-size: 12px;
  }

  .event-hub.is-aichi-event .schedule-actions {
    display: flex;
    align-self: center;
    align-items: center;
    justify-content: flex-end;
    min-width: 0;
    gap: 7px;
    padding-inline-start: 8px;
    border-inline-start: 1px solid var(--event-border);
  }

  .event-hub.is-aichi-event .result-link,
  .event-hub.is-aichi-event .schedule-watch-link {
    display: inline-flex;
    min-height: 26px;
    align-items: center;
    padding: 0 2px;
    border: 0;
    color: var(--n-text-color-2);
    background: transparent;
    text-decoration: none;
    font-size: 11px;
    font-weight: 680;
    white-space: nowrap;
  }

  .event-hub.is-aichi-event .result-link:hover,
  .event-hub.is-aichi-event .result-link:focus-visible,
  .event-hub.is-aichi-event .schedule-watch-link:hover,
  .event-hub.is-aichi-event .schedule-watch-link:focus-visible {
    color: var(--n-primary-color, #d03050);
  }

  .event-hub.is-aichi-event .schedule-watch-link {
    color: var(--aichi-shinrin-green);
  }

  /* Trending intelligence: remove redundant prose and make evidence secondary. */
  .event-hub.is-aichi-event > .topic-panel .topic-panel__lead {
    display: none;
  }

  .event-hub.is-aichi-event > .topic-panel .topic-card {
    padding-block: 9px;
  }

  .event-hub.is-aichi-event > .topic-panel .topic-card__meta {
    gap: 4px 8px;
    font-size: 11px;
  }

  .event-hub.is-aichi-event > .topic-panel .topic-source-count {
    display: none;
  }

  .event-hub.is-aichi-event > .topic-panel .topic-card h3 {
    margin-top: 5px;
    font-size: 14px;
    line-height: 1.42;
  }

  .event-hub.is-aichi-event > .topic-panel .topic-card p {
    margin-top: 5px;
    line-height: 1.45;
  }

  .event-hub.is-aichi-event > .topic-panel .topic-card__evidence {
    margin-top: 7px;
    padding-top: 7px;
  }

  .event-hub.is-aichi-event > .topic-panel .topic-source-chip {
    min-height: 24px;
  }

  .event-hub.is-aichi-event > .topic-panel .topic-source-chip:nth-child(n + 3) {
    display: none;
  }
}

@media (max-width: 1080px) {
  .event-hub.is-aichi-event .primary-panel .medal-table {
    min-width: 0;
    table-layout: fixed;
  }

  .event-hub.is-aichi-event .primary-panel .medal-table th,
  .event-hub.is-aichi-event .primary-panel .medal-table td {
    padding-inline: 5px;
  }

  .event-hub.is-aichi-event .schedule-row.is-live {
    background: transparent;
  }
}


/* Event Hub dashboard polish v5 mobile: compact controls without form-page stacking. */
@media (max-width: 720px) {
  .event-hub.is-aichi-event .schedule-heading-row {
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 4px 8px;
  }

  .event-hub.is-aichi-event .schedule-watch-nav {
    width: 100%;
    justify-content: flex-start;
    margin-top: 2px;
  }

  .event-hub.is-aichi-event .schedule-controls {
    display: grid;
    grid-template-columns: 1fr;
    gap: 5px;
    width: 100%;
    margin-top: 7px;
  }

  .event-hub.is-aichi-event .schedule-scope {
    width: 100%;
  }

  .event-hub.is-aichi-event .schedule-control-row {
    display: grid;
    grid-template-columns: auto auto minmax(0, 1fr);
    gap: 5px;
    width: 100%;
  }

  .event-hub.is-aichi-event .schedule-control-row > label {
    min-width: 0;
  }

  .event-hub.is-aichi-event .schedule-control-row input {
    width: 100%;
    min-width: 0;
  }

  .event-hub.is-aichi-event .schedule-control-row .discipline-select {
    grid-column: 1 / -1;
    width: 100%;
    min-width: 0;
  }

  .event-hub.is-aichi-event .schedule-summary {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0;
    padding: 5px 0;
  }

  .event-hub.is-aichi-event .schedule-summary span {
    display: grid;
    min-width: 0;
    place-items: center;
    gap: 1px;
    padding: 3px 2px !important;
    border-inline-start: 0 !important;
    text-align: center;
    font-size: 10px;
    line-height: 1.2;
  }

  .event-hub.is-aichi-event .schedule-summary strong {
    display: block;
    font-size: 12px;
  }

  .event-hub.is-aichi-event .schedule-status-row {
    display: block;
    margin-bottom: 5px;
    padding-bottom: 5px;
  }

  .event-hub.is-aichi-event .schedule-status-filter {
    width: 100%;
  }

  .event-hub.is-aichi-event .schedule-status-filter button {
    min-width: 0;
    padding-inline: 4px;
    font-size: 10.5px;
  }

  .event-hub.is-aichi-event .schedule-focus-indicator {
    display: none;
  }

  .event-hub.is-aichi-event .schedule-focus-now {
    margin-top: 5px;
  }

  .event-hub.is-aichi-event .schedule-actions {
    grid-column: 2;
    justify-self: start;
    margin-top: 4px;
    padding-inline-start: 0;
    border-inline-start: 0;
  }

  .event-hub.is-aichi-event .schedule-watch-link,
  .event-hub.is-aichi-event .result-link {
    min-height: 24px;
    font-size: 10.5px;
  }

  .event-hub.is-aichi-event > .topic-panel .topic-panel__lead {
    display: none;
  }
}

@media (max-width: 480px) {
  .event-hub.is-aichi-event .primary-panel .medal-table-wrap {
    overflow-x: hidden;
  }

  .event-hub.is-aichi-event .primary-panel .medal-table {
    width: 100%;
    min-width: 0;
    table-layout: fixed;
  }

  .event-hub.is-aichi-event .primary-panel .medal-table th,
  .event-hub.is-aichi-event .primary-panel .medal-table td {
    padding-inline: 3px;
  }

  .event-hub.is-aichi-event .primary-panel .medal-table th:nth-child(1),
  .event-hub.is-aichi-event .primary-panel .medal-table td:nth-child(1) {
    width: 28px;
  }

  .event-hub.is-aichi-event .primary-panel .medal-table th:nth-child(2),
  .event-hub.is-aichi-event .primary-panel .medal-table td:nth-child(2) {
    width: 100px;
  }

  .event-hub.is-aichi-event .primary-panel .medal-table th:nth-child(3),
  .event-hub.is-aichi-event .primary-panel .medal-table td:nth-child(3),
  .event-hub.is-aichi-event .primary-panel .medal-table th:nth-child(4),
  .event-hub.is-aichi-event .primary-panel .medal-table td:nth-child(4),
  .event-hub.is-aichi-event .primary-panel .medal-table th:nth-child(5),
  .event-hub.is-aichi-event .primary-panel .medal-table td:nth-child(5),
  .event-hub.is-aichi-event .primary-panel .medal-table th:nth-child(6),
  .event-hub.is-aichi-event .primary-panel .medal-table td:nth-child(6) {
    width: 42px;
  }

  .event-hub.is-aichi-event .primary-panel .delegation-copy > span {
    display: none;
  }

  .event-hub.is-aichi-event .primary-panel .delegation-cell strong {
    font-size: 12px;
  }

  .event-hub.is-aichi-event .primary-panel .delegation-identity .noc-flag {
    font-size: 15px;
  }
}


/* Event Hub hero brief compact: reclaim left-side whitespace without adding a full-width row. */
.event-hub.is-aichi-event .event-hero__main {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.event-hub.is-aichi-event .event-brief-compact {
  position: relative;
  min-width: 0;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--event-border);
}

.event-hub.is-aichi-event .event-brief-compact__head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 3px;
}

.event-hub.is-aichi-event .event-brief-compact__head strong {
  color: var(--n-text-color);
  font-size: 12px;
  font-weight: 720;
}

.event-hub.is-aichi-event .event-brief-compact__head span {
  color: var(--event-muted);
  font-size: 10px;
}

.event-hub.is-aichi-event .event-brief-compact__list {
  display: grid;
  gap: 0;
}

.event-hub.is-aichi-event .event-brief-compact__item {
  position: relative;
  min-width: 0;
}

.event-hub.is-aichi-event .event-brief-compact__item + .event-brief-compact__item {
  border-top: 1px solid
    color-mix(in srgb, var(--event-border) 68%, transparent);
}

.event-hub.is-aichi-event .event-brief-compact__item summary {
  display: grid;
  min-width: 0;
  grid-template-columns: 62px minmax(0, 1fr);
  gap: 7px;
  align-items: baseline;
  padding: 3px 1px;
  cursor: pointer;
  list-style: none;
  border-radius: 5px;
}

.event-hub.is-aichi-event .event-brief-compact__item summary::-webkit-details-marker {
  display: none;
}

.event-hub.is-aichi-event .event-brief-compact__item summary::marker {
  content: "";
}

.event-hub.is-aichi-event .event-brief-compact__item summary:hover {
  background: var(--event-hover);
}

.event-hub.is-aichi-event .event-brief-compact__item summary:focus-visible {
  outline: 2px solid var(--n-primary-color, #d03050);
  outline-offset: 1px;
  background: var(--event-hover);
}

.event-hub.is-aichi-event .event-brief-compact__item summary time {
  color: var(--event-muted);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.event-hub.is-aichi-event .event-brief-compact__item summary > span {
  min-width: 0;
  overflow: visible;
  color: var(--n-text-color);
  font-size: 12px;
  font-weight: 650;
  line-height: 1.34;
  text-overflow: clip;
  white-space: normal;
}

.event-hub.is-aichi-event .event-brief-detail {
  position: absolute;
  z-index: 12;
  inset: calc(100% + 4px) 0 auto 62px;
  display: none;
  padding: 9px 10px;
  border: 1px solid var(--event-border);
  border-radius: 8px;
  background: var(--event-surface);
}

.event-hub.is-aichi-event .event-brief-compact__item:hover .event-brief-detail,
.event-hub.is-aichi-event .event-brief-compact__item:focus-within .event-brief-detail,
.event-hub.is-aichi-event .event-brief-compact__item[open] .event-brief-detail {
  display: block;
}

.event-hub.is-aichi-event .event-brief-detail p {
  margin: 0;
  color: var(--n-text-color-2);
  font-size: var(--event-font-reading);
  line-height: 1.5;
}

.event-hub.is-aichi-event .event-brief-detail__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px 9px;
  margin-top: 6px;
  color: var(--event-muted);
  font-size: 10px;
}

.event-hub.is-aichi-event .event-brief-detail__meta time {
  font-variant-numeric: tabular-nums;
}

.event-hub.is-aichi-event .event-brief-detail__link {
  margin-inline-start: auto;
  color: var(--n-primary-color, #d03050);
  text-decoration: none;
  font-weight: 700;
}

.event-hub.is-aichi-event .event-brief-detail__link:hover,
.event-hub.is-aichi-event .event-brief-detail__link:focus-visible {
  text-decoration: underline;
}

@media (min-width: 721px) {
  .event-hub.is-aichi-event .event-hero {
    padding-block: 11px 9px;
  }
}

@media (max-width: 720px) {
  .event-hub.is-aichi-event .event-brief-compact {
    margin-top: 7px;
    padding-top: 6px;
  }

  .event-hub.is-aichi-event .event-brief-compact__head {
    margin-bottom: 2px;
  }

  .event-hub.is-aichi-event .event-brief-compact__item:nth-child(n + 3) {
    display: none;
  }

  .event-hub.is-aichi-event .event-brief-compact__item summary {
    grid-template-columns: 58px minmax(0, 1fr);
    gap: 6px;
    padding-block: 2px;
  }

  .event-hub.is-aichi-event .event-brief-compact__item summary > span {
    font-size: 11.5px;
  }

  .event-hub.is-aichi-event .event-brief-detail {
    position: static;
    display: none;
    margin: 5px 0 3px 58px;
    padding: 8px 9px;
  }

  .event-hub.is-aichi-event .event-brief-compact__item:hover .event-brief-detail,
  .event-hub.is-aichi-event .event-brief-compact__item:focus-within .event-brief-detail {
    display: none;
  }

  .event-hub.is-aichi-event .event-brief-compact__item[open] .event-brief-detail {
    display: block;
  }
}


/* Event Hub space polish v7: use snapshot dead space for event-level viewing
   navigation and keep the schedule header focused on schedule controls. */
.event-hub.is-aichi-event .event-watch-nav,
.event-hub.is-aichi-event .schedule-watch-nav.is-mobile-watch-nav {
  display: flex;
  min-width: 0;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
  color: var(--event-muted);
  font-size: var(--event-font-caption);
}

.event-hub.is-aichi-event .event-watch-nav {
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid var(--event-border);
}

.event-hub.is-aichi-event .event-watch-nav > span,
.event-hub.is-aichi-event .schedule-watch-nav.is-mobile-watch-nav > span {
  flex: 0 0 auto;
  color: var(--event-muted);
  font-weight: 650;
}

.event-hub.is-aichi-event .event-watch-nav a,
.event-hub.is-aichi-event .schedule-watch-nav.is-mobile-watch-nav a {
  display: inline-flex;
  min-height: 24px;
  align-items: center;
  gap: 3px;
  padding: 0 7px;
  border: 1px solid var(--event-border);
  border-radius: 999px;
  color: var(--n-text-color-2);
  background: var(--event-surface);
  text-decoration: none;
  font-weight: 680;
  white-space: nowrap;
}

.event-hub.is-aichi-event .event-watch-nav a:hover,
.event-hub.is-aichi-event .event-watch-nav a:focus-visible,
.event-hub.is-aichi-event .schedule-watch-nav.is-mobile-watch-nav a:hover,
.event-hub.is-aichi-event .schedule-watch-nav.is-mobile-watch-nav a:focus-visible {
  color: var(--n-primary-color, #d03050);
  border-color: color-mix(
    in srgb,
    var(--n-primary-color, #d03050) 32%,
    var(--event-border)
  );
  background: var(--event-hover);
}

@media (min-width: 721px) {
  .event-hub.is-aichi-event .schedule-watch-nav.is-mobile-watch-nav {
    display: none;
  }
}

@media (max-width: 720px) {
  .event-hub.is-aichi-event .event-watch-nav {
    display: none;
  }

  .event-hub.is-aichi-event .schedule-watch-nav.is-mobile-watch-nav {
    width: 100%;
    justify-content: flex-start;
    margin-top: 6px;
  }
}

/* Event Hub design baseline v9: one hierarchy, one control vocabulary, one density scale. */
.event-hub.is-aichi-event .event-hero__topbar {
  grid-column: 1 / -1;
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
  padding: 1px 0 9px;
  border-bottom: 1px solid var(--event-border);
}

.event-hub.is-aichi-event .event-hero__eyebrow {
  min-width: 0;
  flex: 1 1 auto;
  flex-wrap: nowrap;
  gap: 8px;
}

.event-hub.is-aichi-event .event-hero__edition-label {
  min-width: 0;
  overflow: hidden;
  font-size: var(--event-font-meta);
  text-overflow: ellipsis;
}

.event-refresh-controls {
  display: inline-flex;
  min-width: 0;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
  margin-inline-start: auto;
}

.event-refresh-state {
  font-size: var(--event-font-caption);
}

.event-refresh-select,
.event-refresh-button {
  min-height: var(--event-control-height);
  border: 1px solid var(--event-border);
  border-radius: var(--event-control-radius);
  color: var(--n-text-color-2);
  background: var(--event-surface);
  font: inherit;
  font-size: var(--event-font-caption);
}

.event-refresh-select {
  max-width: 94px;
  padding: 0 24px 0 8px;
}

.event-refresh-button {
  padding: 0 10px;
  cursor: pointer;
  font-weight: 680;
}

.event-refresh-button:hover,
.event-refresh-button:focus-visible,
.event-refresh-select:focus-visible {
  color: var(--n-primary-color, #d03050);
  border-color: color-mix(
    in srgb,
    var(--n-primary-color, #d03050) 42%,
    var(--event-border)
  );
}

.event-refresh-button:disabled {
  cursor: default;
  opacity: 0.55;
}

.event-hub.is-aichi-event .event-hero__identity {
  min-width: 0;
}

.event-hub.is-aichi-event .event-hero h1 {
  margin: 1px 0 6px;
  font-size: 30px;
  line-height: 1.14;
}

.event-hub.is-aichi-event .event-hero__meta {
  gap: 4px 16px;
  margin-top: 8px;
  font-size: var(--event-font-meta);
}

.event-hub.is-aichi-event .event-hero__actions {
  gap: 6px;
  margin-top: 10px;
}

.event-hub.is-aichi-event .event-link {
  min-height: var(--event-control-height);
  padding-inline: 10px;
  border-radius: var(--event-control-radius);
  font-size: var(--event-font-caption);
}

.event-hub.is-aichi-event .event-brief-compact__head strong {
  font-size: var(--event-font-meta);
}

.event-hub.is-aichi-event .event-brief-compact__head span,
.event-hub.is-aichi-event .event-brief-compact__item summary time,
.event-hub.is-aichi-event .event-brief-detail__meta {
  font-size: var(--event-font-caption);
}

.event-hub.is-aichi-event .event-brief-compact__item summary > span {
  font-size: var(--event-font-meta);
  line-height: 1.4;
}

.event-hub.is-aichi-event .snapshot-head,
.event-hub.is-aichi-event .snapshot-stat > span,
.event-hub.is-aichi-event .snapshot-stat > small {
  font-size: var(--event-font-caption);
}

.event-hub.is-aichi-event .snapshot-stat > strong {
  font-size: 22px;
}

.event-hub.is-aichi-event .event-watch-nav a,
.event-hub.is-aichi-event .schedule-watch-nav.is-mobile-watch-nav a {
  min-height: var(--event-control-height-sm);
  padding-inline: 8px;
  border-radius: var(--event-control-radius);
  font-size: var(--event-font-caption);
}

.event-hub.is-aichi-event .panel-head {
  min-height: 58px;
  gap: 12px;
  margin-top: 0;
  padding: 0 0 11px;
}

.event-hub.is-aichi-event .panel-head::before {
  display: none;
}

.event-hub.is-aichi-event .panel-kicker {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 4px;
  color: var(--event-muted);
  font-size: var(--event-font-caption);
  letter-spacing: 0.01em;
}

.event-hub.is-aichi-event .panel-kicker::before {
  content: "";
  width: 14px;
  height: 3px;
  flex: 0 0 14px;
  border-radius: 999px;
  background: var(--aichi-kakitsubata-purple);
}

.event-hub.is-aichi-event .panel-head h2 {
  font-size: var(--event-panel-title-size);
  line-height: 1.25;
}

.event-hub.is-aichi-event .panel-count,
.event-hub.is-aichi-event .topic-panel__status {
  margin-top: 3px;
  font-size: var(--event-font-caption);
  line-height: 1.35;
}

.event-hub.is-aichi-event .primary-panel .medal-table thead th {
  padding-block: 9px;
  font-size: var(--event-table-head-size);
  font-weight: 720;
  letter-spacing: 0;
}

.event-hub.is-aichi-event .primary-panel .medal-table th:nth-child(1),
.event-hub.is-aichi-event .primary-panel .medal-table td:nth-child(1) {
  width: 32px;
}

.event-hub.is-aichi-event .primary-panel .medal-table th:nth-child(3),
.event-hub.is-aichi-event .primary-panel .medal-table td:nth-child(3),
.event-hub.is-aichi-event .primary-panel .medal-table th:nth-child(4),
.event-hub.is-aichi-event .primary-panel .medal-table td:nth-child(4),
.event-hub.is-aichi-event .primary-panel .medal-table th:nth-child(5),
.event-hub.is-aichi-event .primary-panel .medal-table td:nth-child(5) {
  width: 36px;
}

.event-hub.is-aichi-event .primary-panel .medal-table th:nth-child(6),
.event-hub.is-aichi-event .primary-panel .medal-table td:nth-child(6) {
  width: 42px;
}

.event-hub.is-aichi-event .primary-panel .medal-table th,
.event-hub.is-aichi-event .primary-panel .medal-table td {
  padding-inline: 4px;
}

.event-hub.is-aichi-event .primary-panel .delegation-copy {
  overflow: visible;
}

.event-hub.is-aichi-event .primary-panel .delegation-cell strong,
.event-hub.is-aichi-event .primary-panel .medal-number,
.event-hub.is-aichi-event .primary-panel .total-number {
  font-size: 13.5px;
}

.event-hub.is-aichi-event .schedule-controls {
  margin-top: 9px;
}

.event-hub.is-aichi-event .schedule-scope {
  min-height: var(--event-control-height);
}

.event-hub.is-aichi-event .schedule-scope button,
.event-hub.is-aichi-event .schedule-controls input,
.event-hub.is-aichi-event .schedule-today,
.event-hub.is-aichi-event .schedule-range-all {
  min-height: var(--event-control-height);
  height: var(--event-control-height);
  border-radius: var(--event-control-radius);
  font-size: var(--event-font-caption);
}

.event-hub.is-aichi-event .schedule-scope button {
  min-height: calc(var(--event-control-height) - 4px);
  height: calc(var(--event-control-height) - 4px);
}

.event-hub.is-aichi-event :deep(.discipline-select .n-base-selection) {
  min-height: var(--event-control-height);
  border-radius: var(--event-control-radius);
}

.event-hub.is-aichi-event :deep(.discipline-select .n-base-selection-label) {
  min-height: calc(var(--event-control-height) - 2px);
  font-size: var(--event-font-caption);
}

.event-hub.is-aichi-event .schedule-summary {
  gap: 14px;
  padding: 7px 0 6px;
}

.event-hub.is-aichi-event .schedule-summary span {
  font-size: var(--event-font-caption);
}

.event-hub.is-aichi-event .schedule-summary strong {
  font-size: var(--event-font-meta);
}

.event-hub.is-aichi-event .schedule-status-row {
  min-height: var(--event-control-height);
  gap: 8px;
  margin-bottom: 8px;
  padding-bottom: 8px;
}

.event-hub.is-aichi-event .schedule-status-filter {
  min-height: var(--event-control-height);
}

.event-hub.is-aichi-event .schedule-status-filter button,
.event-hub.is-aichi-event .schedule-focus-now,
.event-hub.is-aichi-event .schedule-focus-indicator {
  min-height: calc(var(--event-control-height) - 4px);
  font-size: var(--event-font-caption);
}

.schedule-focus-now.is-secondary {
  color: var(--n-text-color-2);
  border-color: var(--event-border);
  background: transparent;
}

.event-hub.is-aichi-event > .topic-panel .topic-card {
  padding-block: 8px;
}

.event-hub.is-aichi-event > .topic-panel .topic-card:first-child {
  padding-top: 8px;
}

.event-hub.is-aichi-event > .topic-panel .topic-card__main.has-media {
  grid-template-columns: 86px minmax(0, 1fr);
  gap: 10px;
}

.event-hub.is-aichi-event > .topic-panel .topic-card__media {
  width: 86px;
  height: 58px;
}

.event-hub.is-aichi-event > .topic-panel .topic-card__meta {
  gap: 4px 8px;
  font-size: var(--event-font-caption);
}

.event-hub.is-aichi-event > .topic-panel .topic-card h3 {
  margin-top: 5px;
  font-size: 15px;
  line-height: 1.42;
}

.event-hub.is-aichi-event > .topic-panel .topic-card p {
  margin-top: 5px;
  font-size: var(--event-font-meta);
  line-height: 1.5;
}

.event-hub.is-aichi-event > .topic-panel .topic-card__evidence {
  margin-top: 5px;
  padding-top: 4px;
}

@media (min-width: 1081px) {
  .event-hub.is-aichi-event .event-hero {
    grid-template-columns: minmax(0, 1fr) minmax(340px, 370px);
    column-gap: 18px;
    row-gap: 10px;
    padding: 12px 18px 12px;
  }

  .event-hub.is-aichi-event .event-hero__main {
    grid-column: 1;
    display: grid;
    grid-template-columns: minmax(0, 1.08fr) minmax(310px, 0.92fr);
    column-gap: 18px;
    align-content: stretch;
  }

  .event-hub.is-aichi-event .event-hero__identity {
    grid-column: 1;
    min-width: 0;
    padding-top: 2px;
  }

  .event-hub.is-aichi-event .event-brief-compact {
    grid-column: 2;
    align-self: stretch;
    margin-top: 0;
    padding: 2px 0 0 16px;
    border-top: 0;
    border-inline-start: 1px solid var(--event-border);
  }

  .event-hub.is-aichi-event .event-brief-compact__head {
    margin-bottom: 5px;
  }

  .event-hub.is-aichi-event .event-brief-compact__item summary {
    grid-template-columns: 58px minmax(0, 1fr);
    gap: 7px;
    padding-block: 5px;
  }

  .event-hub.is-aichi-event .event-brief-detail {
    inset-inline: 58px 0;
  }

  .event-hub.is-aichi-event .event-hero__snapshot {
    grid-column: 2;
    grid-row: 2;
    padding-inline-start: 18px;
  }

  .event-hub.is-aichi-event .event-dashboard > .primary-panel,
  .event-hub.is-aichi-event .event-dashboard > .schedule-panel,
  .event-hub.is-aichi-event > .topic-panel {
    padding: var(--event-panel-pad-y) var(--event-panel-pad-x) 12px;
  }
}

@media (max-width: 1080px) {
  .event-hub.is-aichi-event .event-hero__topbar {
    flex-wrap: wrap;
  }

  .event-refresh-controls {
    margin-inline-start: 0;
  }

  .event-hub.is-aichi-event .event-hero__main {
    gap: 0;
  }
}

@media (max-width: 720px) {
  .event-hub.is-aichi-event .event-hero__topbar {
    align-items: flex-start;
    gap: 7px;
    padding-bottom: 7px;
  }

  .event-hub.is-aichi-event .event-hero__eyebrow {
    width: 100%;
    flex-wrap: wrap;
  }

  .event-refresh-controls {
    width: 100%;
    margin-inline-start: 0;
  }

  .event-refresh-state {
    margin-inline-end: auto;
  }

  .event-refresh-select {
    max-width: 96px;
  }

  .event-hub.is-aichi-event .event-hero h1 {
    font-size: 22px;
  }

  .event-hub.is-aichi-event .event-brief-compact__item summary time,
  .event-hub.is-aichi-event .event-brief-compact__item summary > span,
  .event-hub.is-aichi-event .event-brief-detail__meta {
    font-size: var(--event-font-caption);
  }
}

/* Event Hub product polish v10: compact service navigation, timeline briefs and schedule workbench. */
.event-hero__palette {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.event-refresh-label {
  color: var(--event-muted);
  font-size: var(--event-font-caption);
  font-weight: 650;
  white-space: nowrap;
}

.event-hub.is-aichi-event .event-service-nav {
  position: relative;
  z-index: 1;
  grid-column: 2;
  grid-row: 2;
  min-width: 0;
  padding-inline-start: 18px;
  border-inline-start: 1px solid var(--event-border);
}

.event-hub.is-aichi-event .event-service-nav__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.event-hub.is-aichi-event .event-service-nav__head strong {
  color: var(--n-text-color);
  font-size: var(--event-font-meta);
  font-weight: 720;
}

.event-hub.is-aichi-event .event-service-nav__head span {
  color: var(--event-muted);
  font-size: var(--event-font-caption);
}

.event-hub.is-aichi-event .event-service-nav__links {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.event-hub.is-aichi-event .event-service-nav__links a {
  display: grid;
  min-width: 0;
  gap: 1px;
  padding: 8px 9px;
  border: 1px solid var(--event-border);
  border-radius: var(--event-control-radius);
  color: var(--n-text-color-2);
  background: color-mix(in srgb, var(--event-surface) 94%, transparent);
  text-decoration: none;
  transition: border-color .16s ease, background .16s ease, color .16s ease;
}

.event-hub.is-aichi-event .event-service-nav__links a:hover,
.event-hub.is-aichi-event .event-service-nav__links a:focus-visible {
  color: var(--n-primary-color, #d03050);
  border-color: color-mix(in srgb, var(--n-primary-color, #d03050) 38%, var(--event-border));
  background: var(--event-hover);
}

.event-hub.is-aichi-event .event-service-nav__links a > span {
  overflow: hidden;
  font-size: var(--event-font-meta);
  font-weight: 680;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-hub.is-aichi-event .event-brief-compact__head {
  justify-content: space-between;
  gap: 10px;
}

.event-hub.is-aichi-event .event-brief-compact__head > div:first-child {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 8px;
}

.event-hub.is-aichi-event .event-brief-pager {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 4px;
  color: var(--event-muted);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

.event-hub.is-aichi-event .event-brief-pager button {
  width: 22px;
  height: 22px;
  display: inline-grid;
  place-items: center;
  padding: 0;
  border: 1px solid var(--event-border);
  border-radius: 5px;
  color: var(--n-text-color-2);
  background: transparent;
  cursor: pointer;
}

.event-hub.is-aichi-event .event-brief-pager button:hover:not(:disabled),
.event-hub.is-aichi-event .event-brief-pager button:focus-visible {
  color: var(--n-primary-color, #d03050);
  border-color: color-mix(in srgb, var(--n-primary-color, #d03050) 36%, var(--event-border));
}

.event-hub.is-aichi-event .event-brief-pager button:disabled {
  cursor: default;
  opacity: .35;
}

.event-hub.is-aichi-event .event-brief-compact__list {
  overscroll-behavior: contain;
}

.event-hub.is-aichi-event .event-brief-compact__item::after {
  content: "";
  position: absolute;
  z-index: 0;
  left: 62px;
  top: 18px;
  bottom: -6px;
  width: 1px;
  background: color-mix(in srgb, var(--event-border) 78%, transparent);
  pointer-events: none;
}

.event-hub.is-aichi-event .event-brief-compact__item:last-child::after {
  display: none;
}

.event-hub.is-aichi-event .event-brief-compact__item summary {
  position: relative;
  z-index: 1;
  grid-template-columns: 54px 10px minmax(0, 1fr);
  gap: 6px;
}

.event-hub.is-aichi-event .event-brief-node {
  width: 7px;
  height: 7px;
  align-self: center;
  justify-self: center;
  border: 2px solid var(--event-border-strong);
  border-radius: 50%;
  background: var(--event-muted);
}

.event-hub.is-aichi-event .event-brief-compact__item.is-new .event-brief-node {
  border-color: var(--aichi-jonetsu-red);
  outline: 3px solid color-mix(in srgb, var(--aichi-jonetsu-red) 13%, transparent);
  background: var(--aichi-jonetsu-red);
}

.event-hub.is-aichi-event .event-brief-title {
  min-width: 0;
}

.event-hub.is-aichi-event .event-brief-title em {
  display: inline-flex;
  min-height: 16px;
  align-items: center;
  margin-inline-end: 4px;
  padding: 0 4px;
  border-radius: 4px;
  color: var(--aichi-jonetsu-red);
  background: color-mix(in srgb, var(--aichi-jonetsu-red) 11%, transparent);
  font-size: 9px;
  font-style: normal;
  font-weight: 750;
  vertical-align: 1px;
}

.event-hub.is-aichi-event .core-panel-head {
  min-height: 36px;
  align-items: center;
  padding-bottom: 9px;
}

.event-hub.is-aichi-event .core-panel-head h2 {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.event-hub.is-aichi-event .core-panel-head h2::before {
  content: "";
  width: 14px;
  height: 3px;
  flex: 0 0 14px;
  border-radius: 999px;
  background: var(--aichi-kakitsubata-purple);
}

.event-hub.is-aichi-event .schedule-head {
  display: block;
}

.event-hub.is-aichi-event .schedule-heading-row {
  display: flex !important;
  min-width: 0;
  align-items: center !important;
  justify-content: space-between !important;
  flex-wrap: wrap;
  gap: 6px 12px !important;
}

.event-hub.is-aichi-event .schedule-heading-copy {
  flex: 0 0 auto;
}

.event-hub.is-aichi-event .schedule-controls {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
  width: 100%;
  margin-top: 8px;
  justify-items: stretch;
}

.event-hub.is-aichi-event .schedule-scope {
  width: min(300px, 100%);
}

.event-hub.is-aichi-event .schedule-control-row {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 5px;
}

.event-hub.is-aichi-event .discipline-select {
  width: auto;
  min-width: 180px;
  flex: 1 1 180px;
}

.event-hub.is-aichi-event .schedule-search {
  min-width: 170px;
  flex: 1 1 190px;
}

.event-hub.is-aichi-event .schedule-search input {
  width: 100%;
}

.event-hub.is-aichi-event .schedule-controls input[type="search"] {
  padding-inline: 10px;
}

.event-hub.is-aichi-event .schedule-controls input[type="search"]::-webkit-search-cancel-button {
  cursor: pointer;
}

.event-hub.is-aichi-event .schedule-status-row {
  align-items: center;
  flex-wrap: wrap;
}

.event-hub.is-aichi-event .schedule-status-filter {
  flex: 1 1 270px;
}

.event-hub.is-aichi-event .schedule-order-filter {
  display: inline-flex;
  min-height: var(--event-control-height);
  flex: 0 0 auto;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--event-border);
  border-radius: var(--event-control-radius);
  background: var(--event-surface-soft);
}

.event-hub.is-aichi-event .schedule-order-filter button {
  min-height: calc(var(--event-control-height) - 6px);
  padding: 0 8px;
  border: 0;
  border-radius: calc(var(--event-control-radius) - 2px);
  color: var(--event-muted);
  background: transparent;
  cursor: pointer;
  font: inherit;
  font-size: var(--event-font-caption);
  white-space: nowrap;
}

.event-hub.is-aichi-event .schedule-order-filter button.is-active {
  color: var(--n-text-color);
  background: var(--event-hover);
  font-weight: 700;
}

.event-hub.is-aichi-event .primary-panel .medal-head {
  white-space: nowrap;
}

@media (max-width: 1080px) {
  .event-hub.is-aichi-event .event-service-nav {
    grid-column: 1 / -1;
    grid-row: auto;
    padding: 10px 0 0;
    border-top: 1px solid var(--event-border);
    border-inline-start: 0;
  }

  .event-hub.is-aichi-event .event-service-nav__links {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .event-refresh-label {
    display: none;
  }

  .event-hub.is-aichi-event .event-service-nav__head {
    margin-bottom: 6px;
  }

  .event-hub.is-aichi-event .event-service-nav__links {
    display: flex;
    overflow-x: auto;
    gap: 5px;
    padding-bottom: 2px;
    scrollbar-width: none;
  }

  .event-hub.is-aichi-event .event-service-nav__links::-webkit-scrollbar {
    display: none;
  }

  .event-hub.is-aichi-event .event-service-nav__links a {
    min-width: 126px;
    flex: 0 0 auto;
    padding: 7px 8px;
  }

  .event-hub.is-aichi-event .event-brief-compact__item summary {
    grid-template-columns: 50px 9px minmax(0, 1fr);
  }

  .event-hub.is-aichi-event .event-brief-compact__item::after {
    left: 55px;
  }

  .event-hub.is-aichi-event .event-brief-detail {
    margin-inline-start: 59px;
  }

  .event-hub.is-aichi-event .schedule-control-row {
    display: grid;
    grid-template-columns: auto auto minmax(0, 1fr);
  }

  .event-hub.is-aichi-event .schedule-control-row .discipline-select,
  .event-hub.is-aichi-event .schedule-search {
    grid-column: 1 / -1;
    width: 100%;
    min-width: 0;
  }

  .event-hub.is-aichi-event .schedule-order-filter {
    width: 100%;
  }

  .event-hub.is-aichi-event .schedule-order-filter button {
    flex: 1 1 0;
  }

}

/* Event Hub product polish v11: tighter hero rhythm, facet counts, explicit time sort and hover detail. */
.event-hub .sr-only {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}

.event-hub.is-aichi-event .event-hero {
  align-items: start;
}

.event-hub.is-aichi-event .event-hero__meta {
  display: grid;
  gap: 5px;
  margin-top: 9px;
}

.event-hub.is-aichi-event .event-hero__meta-primary,
.event-hub.is-aichi-event .event-hero__meta-stats {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px 20px;
}

.event-hub.is-aichi-event .event-hero__meta-primary span,
.event-hub.is-aichi-event .event-hero__meta-stats span {
  white-space: nowrap;
}

.event-hub.is-aichi-event .event-service-nav {
  align-self: start;
}

.event-hub.is-aichi-event .event-service-nav__head {
  min-height: 24px;
  align-items: center;
  margin-bottom: 6px;
}

.event-hub.is-aichi-event .event-service-nav__links {
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 6px;
}

.event-hub.is-aichi-event .event-service-nav__links a {
  min-height: 42px;
  grid-column: span 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 7px;
  padding: 8px 9px;
}

.event-hub.is-aichi-event .event-service-nav__links a:nth-last-child(-n + 2) {
  grid-column: span 3;
}

.event-hub.is-aichi-event .event-service-nav__links a > i {
  flex: 0 0 auto;
  color: var(--event-muted);
  font-size: 11px;
  font-style: normal;
  transition: transform .16s ease, color .16s ease;
}

.event-hub.is-aichi-event .event-service-nav__links a:hover > i,
.event-hub.is-aichi-event .event-service-nav__links a:focus-visible > i {
  color: currentColor;
  transform: translate(1px, -1px);
}

.event-hub.is-aichi-event .event-brief-compact__head,
.event-hub.is-aichi-event .event-service-nav__head {
  line-height: 1.2;
}

.event-hub.is-aichi-event .schedule-heading-row {
  min-height: 34px;
}

.event-hub.is-aichi-event .schedule-controls {
  gap: 7px;
  margin-top: 6px;
}

.event-hub.is-aichi-event .schedule-control-row {
  flex-wrap: nowrap;
  gap: 6px;
}

.event-hub.is-aichi-event .discipline-select {
  width: 180px;
  min-width: 160px;
  max-width: 210px;
  flex: 0 1 180px;
}

.event-hub.is-aichi-event .schedule-search {
  width: 190px;
  min-width: 160px;
  max-width: 210px;
  flex: 0 1 190px;
  margin-inline-start: auto;
}

.event-hub.is-aichi-event .schedule-search input {
  min-height: var(--event-control-height);
  border: 1px solid var(--event-border);
  border-radius: var(--event-control-radius);
  color: var(--n-text-color);
  background: var(--event-surface-soft);
  outline: none;
}

.event-hub.is-aichi-event .schedule-search input:hover,
.event-hub.is-aichi-event .schedule-search input:focus {
  border-color: color-mix(
    in srgb,
    var(--n-primary-color, #d03050) 38%,
    var(--event-border)
  );
  background: var(--event-hover);
}

.event-hub.is-aichi-event .schedule-status-row {
  gap: 6px;
  padding-top: 7px;
}

.event-hub.is-aichi-event .schedule-status-filter {
  flex: 1 1 350px;
}

.event-hub.is-aichi-event .schedule-status-filter button {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding-inline: 9px;
}

.event-hub.is-aichi-event .schedule-status-count {
  display: inline-grid;
  min-width: 19px;
  height: 18px;
  place-items: center;
  padding: 0 5px;
  border: 1px solid var(--event-border);
  border-radius: 999px;
  color: var(--event-muted);
  background: color-mix(in srgb, var(--event-surface) 86%, transparent);
  font-size: 9px;
  font-weight: 720;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.event-hub.is-aichi-event .schedule-status-filter button.is-active .schedule-status-count {
  border-color: color-mix(in srgb, currentColor 25%, transparent);
  color: inherit;
  background: color-mix(in srgb, currentColor 10%, transparent);
}

.event-hub.is-aichi-event .schedule-order-filter {
  gap: 0;
}

.event-hub.is-aichi-event .schedule-order-filter button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding-inline: 9px;
}

.event-hub.is-aichi-event .schedule-focus-now {
  flex: 0 0 auto;
  white-space: nowrap;
}

.event-hub.is-aichi-event > .topic-panel .topic-card__main {
  position: relative;
}

.event-hub.is-aichi-event > .topic-panel .topic-card__body {
  min-width: 0;
  min-height: 0;
  align-self: start;
  padding-top: 1px;
}

.event-hub.is-aichi-event > .topic-panel .topic-card__title-link {
  display: block;
  color: inherit;
  text-decoration: none;
}

.event-hub.is-aichi-event > .topic-panel .topic-card h3 {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.event-hub.is-aichi-event > .topic-panel .topic-card__title-link:hover h3,
.event-hub.is-aichi-event > .topic-panel .topic-card__title-link:focus-visible h3 {
  color: var(--n-primary-color, #d03050);
}

.event-hub.is-aichi-event > .topic-panel .topic-card__media.is-previewable {
  cursor: zoom-in;
}

.event-hub.is-aichi-event > .topic-panel .topic-card__preview-image {
  width: 100%;
  height: 100%;
  cursor: zoom-in;
}

.event-hub.is-aichi-event > .topic-panel .topic-card__preview-image :deep(.n-image),
.event-hub.is-aichi-event > .topic-panel .topic-card__preview-image :deep(img) {
  cursor: zoom-in;
}

.event-hub.is-aichi-event > .topic-panel .topic-card__preview-image :deep(img) {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.topic-card__tooltip {
  display: grid;
  max-height: min(360px, 60vh);
  gap: 10px;
  overflow-y: auto;
  padding: 2px;
  color: var(--n-text-color-2);
}

.topic-card__tooltip.has-media {
  grid-template-columns: 132px minmax(0, 1fr);
  align-items: center;
}

.topic-card__tooltip-media {
  width: 132px;
  height: 99px;
  overflow: hidden;
  border-radius: 8px;
  background: var(--event-surface-soft);
}

.topic-card__tooltip-media img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.topic-card__tooltip-content {
  display: grid;
  min-width: 0;
  gap: 9px;
}

.topic-card__tooltip-content > p {
  margin: 0;
  color: var(--n-text-color-2);
  font-size: 13px;
  line-height: 1.65;
  white-space: normal;
}

.topic-card__tooltip-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 5px 10px;
  padding-top: 2px;
  color: var(--event-muted);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 520px) {
  .topic-card__tooltip.has-media {
    grid-template-columns: 104px minmax(0, 1fr);
  }

  .topic-card__tooltip-media {
    width: 104px;
    height: 78px;
  }
}

@media (max-width: 1080px) {
  .event-hub.is-aichi-event .event-service-nav__links {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }

  .event-hub.is-aichi-event .schedule-control-row {
    flex-wrap: wrap;
  }

  .event-hub.is-aichi-event .schedule-search {
    margin-inline-start: 0;
  }
}

@media (max-width: 720px) {
  .event-hub.is-aichi-event .event-service-nav__links a,
  .event-hub.is-aichi-event .event-service-nav__links a:nth-last-child(-n + 2) {
    grid-column: auto;
  }

  .event-hub.is-aichi-event .schedule-control-row {
    display: flex;
    flex-wrap: wrap;
  }

  .event-hub.is-aichi-event .schedule-control-row .discipline-select {
    width: 100%;
    max-width: none;
    flex: 1 1 100%;
  }

  .event-hub.is-aichi-event .schedule-search {
    width: 100%;
    max-width: none;
    flex: 1 1 100%;
  }

  .event-hub.is-aichi-event .schedule-status-filter {
    flex-basis: 100%;
  }

  .event-hub.is-aichi-event > .topic-panel .topic-card__body {
    padding-top: 0;
  }
}

/* Event Hub product polish v12: three-line event facts and compact service shortcuts. */
.event-hub.is-aichi-event .event-hero__meta {
  display: grid;
  gap: 6px;
  margin-top: 10px;
}

.event-hub.is-aichi-event .event-hero__meta-row {
  display: flex;
  min-width: 0;
  min-height: 20px;
  align-items: center;
  gap: 7px;
  color: var(--n-text-color-2);
  line-height: 1.35;
}

.event-hub.is-aichi-event .event-hero__meta-row::before,
.event-hub.is-aichi-event .event-hero__meta-row span::before,
.event-hub.is-aichi-event .event-hero__meta-metric::before {
  display: none !important;
  content: none !important;
}

.event-hub.is-aichi-event .event-hero__meta-icon {
  width: 14px;
  height: 14px;
  flex: 0 0 14px;
  fill: none;
  stroke: var(--event-muted);
  stroke-width: 1.75;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.event-hub.is-aichi-event .event-hero__meta-row.is-scale {
  gap: 14px;
}

.event-hub.is-aichi-event .event-hero__meta-metric {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.event-hub.is-aichi-event .event-service-nav__head {
  min-height: 18px;
  margin-bottom: 5px;
}

.event-hub.is-aichi-event .event-service-nav__links {
  gap: 5px;
}

.event-hub.is-aichi-event .event-service-nav__links a {
  min-height: 30px;
  padding: 0 8px;
  border-color: color-mix(in srgb, var(--event-border) 82%, transparent);
  border-radius: 6px;
  background: color-mix(in srgb, var(--event-surface) 78%, transparent);
  line-height: 1;
}

.event-hub.is-aichi-event .event-service-nav__links a > span {
  font-size: var(--event-font-caption);
  font-weight: 680;
}

.event-hub.is-aichi-event .event-service-nav__links a > i {
  font-size: 10px;
  opacity: .72;
}

.event-hub.is-aichi-event .event-service-nav__links a:hover,
.event-hub.is-aichi-event .event-service-nav__links a:focus-visible {
  background: var(--event-hover);
}

.event-hub.is-aichi-event .event-brief-compact__item summary {
  grid-template-columns: 72px 8px minmax(0, 1fr);
  gap: 8px;
}

.event-hub.is-aichi-event .event-brief-compact__item summary time {
  justify-self: end;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.event-hub.is-aichi-event .event-brief-compact__item::after {
  left: 84px;
}

.event-hub.is-aichi-event .event-brief-node {
  width: 8px;
  height: 8px;
}

@media (min-width: 1081px) {
  .event-hub.is-aichi-event .event-brief-detail {
    inset-inline: 96px 0;
  }
}

@media (max-width: 720px) {
  .event-hub.is-aichi-event .event-hero__meta {
    display: flex;
    width: 100%;
    overflow-x: auto;
    align-items: center;
    gap: 12px;
    padding-bottom: 2px;
    scrollbar-width: none;
  }

  .event-hub.is-aichi-event .event-hero__meta::-webkit-scrollbar {
    display: none;
  }

  .event-hub.is-aichi-event .event-hero__meta-row {
    min-height: 0;
    flex: 0 0 auto;
    gap: 5px;
    white-space: nowrap;
  }

  .event-hub.is-aichi-event .event-hero__meta-row.is-scale {
    gap: 10px;
  }

  .event-hub.is-aichi-event .event-hero__meta-icon {
    width: 12px;
    height: 12px;
    flex-basis: 12px;
  }

  .event-hub.is-aichi-event .event-service-nav__links a {
    min-width: 112px;
    min-height: 30px;
    padding: 0 8px;
  }

  .event-hub.is-aichi-event .event-brief-compact__item summary {
    grid-template-columns: 66px 8px minmax(0, 1fr);
    gap: 7px;
  }

  .event-hub.is-aichi-event .event-brief-compact__item::after {
    left: 77px;
  }

  .event-hub.is-aichi-event .event-brief-detail {
    margin-inline-start: 88px;
  }
}

/* Event Hub product polish v14: compact information header, bottom ticker and structured sport data motif. */
.event-hub.is-aichi-event .event-hero {
  grid-template-columns: minmax(0, 1fr) minmax(400px, 430px);
  column-gap: 22px;
  row-gap: 10px;
}

.event-hub.is-aichi-event .event-brief-ticker {
  grid-column: 1 / -1;
  grid-row: 3;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  min-width: 0;
  align-items: center;
  gap: 12px;
  min-height: 34px;
  padding: 7px 0 1px;
  border-top: 1px solid var(--event-border);
}

.event-hub.is-aichi-event .event-brief-ticker__label {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  padding-inline-start: 2px;
  white-space: nowrap;
}

.event-hub.is-aichi-event .event-brief-ticker__label strong {
  color: var(--n-text-color);
  font-size: var(--event-font-meta);
  font-weight: 740;
}

.event-hub.is-aichi-event .event-brief-ticker__label span {
  color: var(--event-muted);
  font-size: var(--event-font-caption);
}

.event-hub.is-aichi-event .event-brief-ticker__viewport {
  min-width: 0;
  overflow: hidden;
}

.event-hub.is-aichi-event .event-brief-ticker__track {
  display: flex;
  width: max-content;
  align-items: center;
  gap: 32px;
  animation: event-brief-ticker-scroll 112s linear infinite;
  will-change: transform;
}

.event-hub.is-aichi-event .event-brief-ticker__track:hover,
.event-hub.is-aichi-event .event-brief-ticker__track:focus-within {
  animation-play-state: paused;
}

.event-hub.is-aichi-event .event-brief-ticker__track.is-static {
  animation: none;
}

.event-hub.is-aichi-event .event-brief-ticker__item {
  display: inline-flex;
  max-width: 520px;
  flex: 0 0 auto;
  align-items: center;
  gap: 7px;
  color: var(--n-text-color-2);
  text-decoration: none;
  white-space: nowrap;
}

.event-hub.is-aichi-event .event-brief-ticker__item time {
  color: var(--event-muted);
  font-size: var(--event-font-caption);
  font-variant-numeric: tabular-nums;
}

.event-hub.is-aichi-event .event-brief-ticker__item > i {
  width: 6px;
  height: 6px;
  flex: 0 0 6px;
  border-radius: 50%;
  background: var(--event-muted);
}

.event-hub.is-aichi-event .event-brief-ticker__item.is-new > i {
  background: var(--aichi-jonetsu-red);
}

.event-hub.is-aichi-event .event-brief-ticker__item > em {
  padding: 1px 4px;
  border-radius: 4px;
  color: var(--aichi-jonetsu-red);
  background: color-mix(in srgb, var(--aichi-jonetsu-red) 10%, transparent);
  font-size: 9px;
  font-style: normal;
  font-weight: 760;
}

.event-hub.is-aichi-event .event-brief-ticker__item > span {
  overflow: hidden;
  max-width: 400px;
  font-size: var(--event-font-meta);
  font-weight: 650;
  text-overflow: ellipsis;
}

.event-hub.is-aichi-event .event-brief-ticker__item:hover,
.event-hub.is-aichi-event .event-brief-ticker__item:focus-visible {
  color: var(--n-primary-color, #d03050);
}

@keyframes event-brief-ticker-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(calc(-50% - 14px)); }
}

@media (min-width: 1081px) {
  .event-hub.is-aichi-event .event-hero__main {
    grid-column: 1;
    grid-row: 2;
    display: grid;
    grid-template-columns: minmax(390px, 1fr) minmax(250px, 300px);
    min-width: 0;
    min-height: 134px;
    align-items: center;
    gap: 18px;
    overflow: hidden;
  }

  .event-hub.is-aichi-event .event-service-nav {
    grid-column: 2;
    grid-row: 2;
    align-self: center;
  }
}

.event-hub.is-aichi-event .event-hero__identity {
  position: relative;
  z-index: 1;
}

.event-hub.is-aichi-event .event-hero__ops {
  display: flex;
  min-width: 0;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  margin-inline-start: auto;
}

.event-hub.is-aichi-event .event-page-search.event-page-search--topbar {
  width: min(330px, 31vw);
  min-height: 30px;
  margin-top: 0;
  border-color: color-mix(in srgb, var(--event-border-strong) 76%, transparent);
  background: color-mix(in srgb, var(--event-surface) 68%, transparent);
}

.event-hub.is-aichi-event .event-page-search.event-page-search--topbar > input {
  height: 28px;
  color: var(--n-text-color);
  font-weight: 560;
}

.event-hub.is-aichi-event .event-page-search {
  display: flex;
  width: min(390px, 100%);
  min-height: 34px;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 0 8px 0 10px;
  border: 1px solid var(--event-border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--event-surface-soft) 86%, transparent);
  transition: border-color .16s ease, background .16s ease;
}

.event-hub.is-aichi-event .event-page-search:focus-within {
  border-color: color-mix(in srgb, var(--n-primary-color, #d03050) 42%, var(--event-border));
  background: var(--event-hover);
}

.event-hub.is-aichi-event .event-page-search > svg {
  width: 15px;
  height: 15px;
  flex: 0 0 15px;
  fill: none;
  stroke: var(--event-muted);
  stroke-width: 1.7;
  stroke-linecap: round;
}

.event-hub.is-aichi-event .event-page-search > input {
  min-width: 0;
  height: 32px;
  flex: 1 1 auto;
  padding: 0;
  border: 0;
  outline: 0;
  color: var(--n-text-color);
  background: transparent;
  font: inherit;
  font-size: var(--event-font-meta);
}

.event-hub.is-aichi-event .event-page-search > input::placeholder {
  color: var(--event-muted);
}

.event-hub.is-aichi-event .event-page-search > kbd {
  display: inline-flex;
  min-width: 28px;
  height: 20px;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  border: 1px solid var(--event-border);
  border-bottom-color: var(--event-border-strong);
  border-radius: 5px;
  color: var(--event-muted);
  background: var(--event-surface);
  font-family: inherit;
  font-size: 9px;
  font-weight: 680;
}

.event-hub.is-aichi-event .event-page-search.event-page-search--topbar:focus-within {
  border-color: color-mix(in srgb, var(--n-primary-color, #d03050) 56%, var(--event-border-strong));
  background: color-mix(in srgb, var(--event-surface) 78%, transparent);
}

.event-hub.is-aichi-event .event-page-search.event-page-search--topbar > svg {
  stroke: var(--n-text-color-2);
}

.event-hub.is-aichi-event .event-page-search.event-page-search--topbar > input::placeholder {
  color: color-mix(in srgb, var(--n-text-color-2) 78%, transparent);
}

.event-hub.is-aichi-event .event-page-search.event-page-search--topbar > kbd {
  border-color: color-mix(in srgb, var(--event-border-strong) 78%, transparent);
  color: var(--n-text-color-2);
  background: color-mix(in srgb, var(--event-surface-soft) 62%, transparent);
}

.event-hub.is-aichi-event .event-refresh-button {
  display: inline-flex;
  width: 30px;
  min-width: 30px;
  height: 30px;
  min-height: 30px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid color-mix(in srgb, var(--event-border-strong) 76%, transparent);
  border-radius: 7px;
  color: var(--n-text-color-2);
  background: color-mix(in srgb, var(--event-surface) 68%, transparent);
}

.event-hub.is-aichi-event .event-refresh-button > span {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.event-hub.is-aichi-event .event-refresh-button__icon {
  display: inline-flex;
  width: 14px;
  height: 14px;
  flex: 0 0 14px;
  color: currentColor;
  font-size: 14px;
  line-height: 1;
}

.event-hub.is-aichi-event .event-refresh-button:hover,
.event-hub.is-aichi-event .event-refresh-button:focus-visible {
  border-color: color-mix(in srgb, var(--aichi-jonetsu-red) 58%, var(--event-border-strong));
  color: var(--n-primary-color, var(--aichi-jonetsu-red));
  background: color-mix(in srgb, var(--aichi-jonetsu-red) 8%, var(--event-surface));
}

.event-hub.is-aichi-event .event-refresh-button.is-loading .event-refresh-button__icon {
  animation: event-refresh-spin .9s linear infinite;
}

@keyframes event-refresh-spin {
  to { transform: rotate(360deg); }
}

.event-hub.is-aichi-event .noc-flag-image {
  width: 20px;
  height: 14px;
  flex: 0 0 20px;
  object-fit: contain;
  border-radius: 1px;
}

@media (max-width: 1080px) {
  .event-hub.is-aichi-event .event-brief-ticker {
    grid-row: auto;
  }

  .event-hub.is-aichi-event .event-hero__main,
  .event-hub.is-aichi-event .event-service-nav {
    grid-column: 1 / -1;
    grid-row: auto;
  }
}

@media (max-width: 720px) {
  .event-hub.is-aichi-event .event-brief-ticker {
    grid-template-columns: auto minmax(0, 1fr);
    gap: 8px;
  }

  .event-hub.is-aichi-event .event-brief-ticker__label span {
    display: none;
  }

  .event-hub.is-aichi-event .event-brief-ticker__track {
    animation-duration: 92s;
    gap: 24px;
  }

  .event-hub.is-aichi-event .event-brief-ticker__item {
    max-width: 360px;
  }

  .event-hub.is-aichi-event .event-brief-ticker__item > span {
    max-width: 260px;
  }

  .event-hub.is-aichi-event .event-hero__ops {
    width: 100%;
    order: 2;
  }

  .event-hub.is-aichi-event .event-page-search.event-page-search--topbar {
    width: 100%;
    margin-top: 0;
  }

  .event-hub.is-aichi-event .event-page-search > kbd {
    display: none;
  }
}


/* Event Hub product polish v15: schedule title-row workbench. */
@media (min-width: 1081px) {
  .event-hub.is-aichi-event .schedule-head {
    display: grid !important;
    grid-template-columns: minmax(138px, auto) minmax(0, 1fr);
    min-height: 0;
    align-items: start !important;
    gap: 5px 12px !important;
    padding-bottom: 8px;
  }

  .event-hub.is-aichi-event .schedule-heading-row {
    grid-column: 1;
    grid-row: 1;
    min-height: 30px;
    align-items: center !important;
    align-self: start;
  }

  .event-hub.is-aichi-event .schedule-controls {
    grid-column: 2;
    grid-row: 1 / span 2;
    display: grid;
    width: 100%;
    min-width: 0;
    justify-items: end;
    align-content: start;
    gap: 5px;
    margin-top: 0;
  }

  .event-hub.is-aichi-event .schedule-scope {
    width: min(100%, 252px);
    min-width: 0;
    min-height: 30px;
    justify-self: end;
    padding: 2px;
  }

  .event-hub.is-aichi-event .schedule-scope button {
    min-height: 26px;
    height: 26px;
    padding-inline: 7px;
    font-size: var(--event-font-caption);
  }

  .event-hub.is-aichi-event .schedule-control-row {
    display: flex;
    width: 100%;
    min-width: 0;
    flex-wrap: nowrap;
    justify-content: flex-end;
    align-items: center;
    gap: 5px;
  }

  .event-hub.is-aichi-event .schedule-control-row > label,
  .event-hub.is-aichi-event .schedule-range-field {
    min-width: 0;
  }

  .event-hub.is-aichi-event .schedule-control-row input,
  .event-hub.is-aichi-event .schedule-today,
  .event-hub.is-aichi-event .schedule-range-all {
    min-height: 30px;
    height: 30px;
    font-size: var(--event-font-caption);
  }

  .event-hub.is-aichi-event .schedule-today {
    padding-inline: 8px;
  }

  .event-hub.is-aichi-event .schedule-control-row input[type="date"] {
    width: 128px;
    padding-inline: 7px;
  }

  .event-hub.is-aichi-event .schedule-control-row .discipline-select {
    width: 154px;
    max-width: 154px;
    flex: 0 0 154px;
  }

  .event-hub.is-aichi-event :deep(.schedule-control-row .discipline-select .n-base-selection) {
    min-height: 30px;
  }

  .event-hub.is-aichi-event :deep(.schedule-control-row .discipline-select .n-base-selection-label) {
    min-height: 28px;
    font-size: var(--event-font-caption);
  }
}

/* Event Hub product polish v16: integrated cinematic hero with background atmosphere. */
.event-hub.is-aichi-event .event-hero {
  isolation: isolate;
  grid-template-columns: minmax(0, 1fr);
  column-gap: 0;
  row-gap: 0;
  overflow: hidden;
  background: var(--event-surface);
}

.event-hub.is-aichi-event .event-hero__topbar,
.event-hub.is-aichi-event .event-hero__main,
.event-hub.is-aichi-event .event-brief-ticker {
  position: relative;
  z-index: 3;
}

.event-hub.is-aichi-event .event-hero__backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  background:
    radial-gradient(
      ellipse at 82% 18%,
      color-mix(in srgb, var(--aichi-kakitsubata-purple) 11%, transparent) 0,
      transparent 42%
    ),
    radial-gradient(
      ellipse at 55% 100%,
      color-mix(in srgb, var(--aichi-kinshachi-gold) 8%, transparent) 0,
      transparent 50%
    );
}

.event-hub.is-aichi-event .event-hero__motion-ribbons {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 104%;
  height: 100%;
  margin-inline-start: -2%;
  overflow: visible;
  opacity: .64;
  filter: saturate(.9);
}

.event-hub.is-aichi-event .event-hero__motion-ribbon {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
  transform-box: fill-box;
  transform-origin: center;
  animation: event-hero-ribbon-drift 16s ease-in-out infinite alternate;
}

.event-hub.is-aichi-event .event-hero__motion-ribbon.is-red {
  stroke: color-mix(in srgb, var(--aichi-jonetsu-red) 74%, transparent);
  stroke-width: 11;
  animation-duration: 15s;
}

.event-hub.is-aichi-event .event-hero__motion-ribbon.is-purple {
  stroke: color-mix(in srgb, var(--aichi-kakitsubata-purple) 68%, transparent);
  stroke-width: 17;
  opacity: .76;
  animation-duration: 19s;
  animation-delay: -6s;
}

.event-hub.is-aichi-event .event-hero__motion-ribbon.is-green {
  stroke: color-mix(in srgb, var(--aichi-shinrin-green) 62%, transparent);
  stroke-width: 9;
  opacity: .68;
  animation-duration: 17s;
  animation-delay: -10s;
}

.event-hub.is-aichi-event .event-hero__motion-ribbon.is-gold {
  stroke: color-mix(in srgb, var(--aichi-kinshachi-gold) 74%, transparent);
  stroke-width: 13;
  opacity: .72;
  animation-duration: 21s;
  animation-delay: -4s;
}

.event-hub.is-aichi-event .event-hero__winner {
  position: absolute;
  z-index: 1;
  right: -1.5%;
  bottom: -4%;
  width: min(650px, 47vw);
  height: min(360px, 28vw);
  opacity: .94;
  filter: saturate(.96) contrast(.98);
  transform-origin: 70% 70%;
  -webkit-mask-image: linear-gradient(
    90deg,
    transparent 0%,
    rgba(0, 0, 0, .18) 14%,
    #000 34%,
    #000 100%
  );
  mask-image: linear-gradient(
    90deg,
    transparent 0%,
    rgba(0, 0, 0, .18) 14%,
    #000 34%,
    #000 100%
  );
}

@keyframes event-hero-ribbon-drift {
  0% {
    transform: translate3d(-2%, -1.5%, 0) scaleX(1.01);
  }

  100% {
    transform: translate3d(2%, 1.5%, 0) scaleX(1.035);
  }
}

.event-hub.is-aichi-event .event-hero__backdrop-wash {
  position: absolute;
  inset: 0;
  z-index: 2;
  background:
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--event-surface) 88%, transparent) 0%,
      color-mix(in srgb, var(--event-surface) 78%, transparent) 22%,
      color-mix(in srgb, var(--event-surface) 56%, transparent) 42%,
      color-mix(in srgb, var(--event-surface) 22%, transparent) 62%,
      transparent 82%
    ),
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--event-surface) 12%, transparent) 0%,
      transparent 54%,
      color-mix(in srgb, var(--event-surface) 38%, transparent) 100%
    );
}

@media (min-width: 1081px) {
  .event-hub.is-aichi-event .event-hero {
    padding: 12px 18px 12px;
  }

  .event-hub.is-aichi-event .event-hero__main {
    grid-column: 1;
    grid-row: 2;
    display: block;
    width: clamp(590px, 52vw, 820px);
    min-width: 0;
    min-height: 174px;
    padding: 10px 0 14px;
  }

  .event-hub.is-aichi-event .event-hero__identity {
    max-width: 100%;
  }

  .event-hub.is-aichi-event .event-service-nav {
    position: relative;
    z-index: 1;
    display: flex;
    max-width: 790px;
    min-width: 0;
    align-items: center;
    gap: 10px;
    margin-top: 15px;
    padding: 0;
    border: 0;
  }

  .event-hub.is-aichi-event .event-service-nav__head {
    flex: 0 0 auto;
    margin: 0;
  }

  .event-hub.is-aichi-event .event-service-nav__head strong {
    color: var(--event-muted);
    font-size: var(--event-font-caption);
    font-weight: 700;
    white-space: nowrap;
  }

  .event-hub.is-aichi-event .event-service-nav__links {
    display: flex;
    min-width: 0;
    flex: 1 1 auto;
    flex-wrap: wrap;
    gap: 6px;
  }

  .event-hub.is-aichi-event .event-service-nav__links a {
    display: inline-flex;
    min-height: 30px;
    flex: 0 1 auto;
    align-items: center;
    grid-template-columns: none;
    gap: 7px;
    padding: 0 10px;
    border-color: color-mix(in srgb, var(--event-border) 86%, transparent);
    color: var(--n-text-color-2);
    background: color-mix(in srgb, var(--event-surface) 72%, transparent);
  }

  .event-hub.is-aichi-event .event-service-nav__links a > span {
    min-width: 0;
    max-width: 124px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .event-hub.is-aichi-event .event-brief-ticker {
    grid-column: 1;
    grid-row: 3;
    margin: 0 -18px -12px;
    padding: 8px 18px 9px;
    background: color-mix(in srgb, var(--event-surface) 76%, transparent);
  }
}

@media (max-width: 1080px) {
  .event-hub.is-aichi-event .event-hero__winner {
    right: -12%;
    bottom: -2%;
    width: 560px;
    height: 330px;
    opacity: .52;
  }

  .event-hub.is-aichi-event .event-hero__motion-ribbons {
    width: 112%;
    margin-inline-start: -6%;
    opacity: .48;
  }

  .event-hub.is-aichi-event .event-hero__backdrop-wash {
    background:
      linear-gradient(
        90deg,
        color-mix(in srgb, var(--event-surface) 90%, transparent) 0%,
        color-mix(in srgb, var(--event-surface) 80%, transparent) 40%,
        color-mix(in srgb, var(--event-surface) 46%, transparent) 68%,
        color-mix(in srgb, var(--event-surface) 14%, transparent) 100%
      ),
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--event-surface) 12%, transparent) 0%,
        transparent 50%,
        color-mix(in srgb, var(--event-surface) 42%, transparent) 100%
      );
  }

  .event-hub.is-aichi-event .event-hero__main {
    position: relative;
    z-index: 3;
    width: min(100%, 720px);
  }

  .event-hub.is-aichi-event .event-service-nav {
    position: relative;
    z-index: 1;
    display: flex;
    max-width: 680px;
    align-items: flex-start;
    gap: 8px;
    margin-top: 13px;
    padding: 0;
    border: 0;
  }

  .event-hub.is-aichi-event .event-service-nav__head {
    flex: 0 0 auto;
    margin: 7px 0 0;
  }

  .event-hub.is-aichi-event .event-service-nav__links {
    display: flex;
    min-width: 0;
    flex: 1 1 auto;
    flex-wrap: wrap;
    gap: 6px;
  }

  .event-hub.is-aichi-event .event-service-nav__links a {
    display: inline-flex;
    min-height: 30px;
    align-items: center;
    gap: 6px;
    padding: 0 9px;
    background: color-mix(in srgb, var(--event-surface) 76%, transparent);
  }

  .event-hub.is-aichi-event .event-brief-ticker {
    margin-inline: -18px;
    padding-inline: 18px;
    background: color-mix(in srgb, var(--event-surface) 80%, transparent);
  }
}

@media (max-width: 720px) {
  .event-hub.is-aichi-event .event-hero__winner {
    right: -34%;
    bottom: -1%;
    width: 430px;
    height: 270px;
    opacity: .22;
  }

  .event-hub.is-aichi-event .event-hero__motion-ribbons {
    width: 130%;
    margin-inline-start: -15%;
    opacity: .28;
  }

  .event-hub.is-aichi-event .event-hero__motion-ribbon {
    stroke-width: 8;
  }

  .event-hub.is-aichi-event .event-hero__motion-ribbon.is-purple,
  .event-hub.is-aichi-event .event-hero__motion-ribbon.is-gold {
    stroke-width: 11;
  }

  .event-hub.is-aichi-event .event-hero__backdrop-wash {
    background: linear-gradient(
      90deg,
      color-mix(in srgb, var(--event-surface) 94%, transparent) 0%,
      color-mix(in srgb, var(--event-surface) 84%, transparent) 62%,
      color-mix(in srgb, var(--event-surface) 48%, transparent) 100%
    );
  }

  .event-hub.is-aichi-event .event-service-nav {
    display: block;
    margin-top: 11px;
  }

  .event-hub.is-aichi-event .event-service-nav__head {
    margin: 0 0 6px;
  }

  .event-hub.is-aichi-event .event-service-nav__links {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .event-hub.is-aichi-event .event-service-nav__links a {
    justify-content: space-between;
  }

  .event-hub.is-aichi-event .event-brief-ticker {
    margin-inline: -18px;
    padding-inline: 18px;
  }
}


/* LoL Event Series: shared esports workspace with site-authored Hero artwork.
   Riot-owned position icons remain separately sourced and documented. */
.event-hub.is-lol-event {
  /* Shared LoL results (facts) and trace (interaction) semantics. */
  --lol-result-win:#277256;
  --lol-result-loss:#a84752;
  --lol-trace-accent:#29329e;
  /* Blue-black + cyan is the dominant site-authored League-game UI language.
     Gold is intentionally limited to structure / qualification / premium accents. */
  --worlds-ink: #010a13;
  --worlds-ink-soft: #101621;
  /* League Hextech UI references: deep/magic blue + cyan interaction family.
     Riot corporate red is used only as a small warm competition accent. */
  --worlds-deep-blue: #0a142b;
  --worlds-rift-blue: #005a82;
  --worlds-cyan: #0ac8b9;
  --worlds-teal: #0a96aa;
  --worlds-hot: #d13639;
  /* Riot client position icons use #785a28 + #c8aa6e directly. */
  --worlds-gold-base: #785a28;
  --worlds-gold: #c8aa6e;
  --worlds-cream: #f0e6d2;
  --lol-action-start: #075b78;
  --lol-action-end: #164e6d;
  --lol-action-hover: #08677c;
  --lol-action-text: #f2ffff;
  --n-primary-color: #0bc4e2;
  --n-primary-color-hover: #00c8c8;
  --n-primary-color-pressed: #2c8cc2;
  --n-primary-color-suppl: #00c8c8;
}

.event-hub.is-dark.is-lol-event{--lol-result-win:#8ac6af;--lol-result-loss:#e6a1a8;--lol-trace-accent:#b7c1ff}
.event-hub.is-lol-event.is-demacia-event {
  --demacia-blue: #29329e;
  --demacia-blue-deep: #0d164f;
  --demacia-blue-mid: #1d2b88;
  --demacia-ivory: #f5eedc;
  --demacia-gold: #d3b45f;
  --worlds-deep-blue: var(--demacia-blue-deep);
  --worlds-rift-blue: var(--demacia-blue);
  --worlds-cyan: #6676df;
  --worlds-teal: #4054bd;
  --worlds-hot: #c7a95b;
  --worlds-gold: var(--demacia-gold);
  --lol-action-start: #3147bd;
  --lol-action-end: #1f2f88;
  --lol-action-hover: #445bd3;
  --lol-action-text: #fff8e9;
  --n-primary-color: var(--lol-action-start);
  --n-primary-color-hover: var(--lol-action-hover);
  --n-primary-color-pressed: var(--lol-action-end);
  --n-primary-color-suppl: var(--lol-action-hover);
}
.event-hub.is-demacia-event { --guide-accent: var(--demacia-blue); }
.event-hub.is-demacia-event.is-dark { --guide-accent: #b7c1ff; }
.event-hub.is-lol-event.is-demacia-event .event-panel {
  border-color: color-mix(in srgb, var(--demacia-blue) 28%, var(--event-border));
}

.event-hub.is-lol-event.is-demacia-event .panel-kicker,
.event-hub.is-lol-event.is-demacia-event .panel-count {
  color: color-mix(in srgb, var(--demacia-gold) 78%, var(--event-muted));
}

.event-hub.is-lol-event .event-status {
  border: 1px solid color-mix(in srgb, var(--worlds-hot) 62%, var(--worlds-gold));
  border-radius: 999px;
  padding: 3px 7px;
  color: #ffd7c2;
  background: linear-gradient(90deg, rgba(209, 54, 57, .16), rgba(200, 155, 60, .085));
  letter-spacing: .02em;
}

.event-hub.is-lol-event .event-page-search.event-page-search--topbar {
  display: flex;
  width: min(320px, 31vw);
  min-height: 30px;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 0 8px 0 10px;
  border: 1px solid rgba(255, 255, 255, .18);
  border-radius: 7px;
  background: rgba(4, 13, 24, .42);
}

.event-hub.is-lol-event .event-page-search.event-page-search--topbar:focus-within {
  border-color: var(--lol-action-hover);
  background: rgba(4, 20, 31, .64);
}

.event-hub.is-lol-event .event-page-search > svg {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: rgba(255, 255, 255, .7);
  stroke-width: 1.7;
}

.event-hub.is-lol-event .event-page-search > input {
  min-width: 0;
  height: 30px;
  flex: 1 1 auto;
  padding: 0;
  border: 0;
  outline: 0;
  color: #f4f7fb;
  background: transparent;
  font: inherit;
  font-size: var(--event-font-meta);
}

.event-hub.is-lol-event .event-page-search > input::placeholder {
  color: rgba(230, 237, 247, .56);
}

.event-hub.is-lol-event .event-refresh-button {
  display: inline-flex;
  width: 30px;
  min-width: 30px;
  height: 30px;
  min-height: 30px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, .18);
  border-radius: 7px;
  color: color-mix(in srgb, var(--worlds-cream) 90%, transparent);
  background: rgba(4, 13, 24, .42);
}

.event-hub.is-lol-event .event-refresh-button > span {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.event-hub.is-lol-event .event-refresh-button__icon {
  display: inline-flex;
  width: 14px;
  height: 14px;
  flex: 0 0 14px;
  color: currentColor;
  font-size: 14px;
  line-height: 1;
}

.event-hub.is-lol-event .event-refresh-button.is-loading .event-refresh-button__icon {
  animation: event-refresh-spin .9s linear infinite;
}

.event-hub.is-lol-event .event-refresh-button:hover,
.event-hub.is-lol-event .event-refresh-button:focus-visible {
  border-color: var(--lol-action-hover);
  color: #dffcff;
  background: rgba(0, 200, 200, .14);
}

.event-hub.is-lol-event .schedule-head {
  flex: 0 0 auto;
  flex-wrap: wrap;
  align-items: flex-start;
}

.event-hub.is-lol-event .schedule-heading-row {
  flex: 0 0 auto;
}

.event-hub.is-lol-event .schedule-heading-copy h2 {
  white-space: nowrap;
}

.event-hub.is-lol-event .event-dashboard {
  grid-template-columns: minmax(560px, 1.12fr) minmax(420px, .88fr);
}

.event-hub.is-lol-event.is-demacia-event .event-dashboard {
  grid-template-columns: minmax(600px, 1.28fr) minmax(360px, .72fr);
}

.event-hub.is-demacia-event .schedule-panel {
  container-type: inline-size;
}

@container (max-width: 520px) {
  .event-hub.is-demacia-event .schedule-status-row {
    flex-wrap: wrap;
    gap: 8px;
  }
  .event-hub.is-demacia-event .schedule-status-filter {
    flex: 1 0 100%;
    width: 100%;
    min-width: 0;
  }
  .event-hub.is-demacia-event .schedule-status-filter button {
    min-width: 0;
    flex: 1 1 0;
    white-space: nowrap;
    gap: 4px;
  }
  .event-hub.is-demacia-event .schedule-order-filter {
    display: flex;
    flex: 0 0 auto;
  }
  .event-hub.is-demacia-event .schedule-focus-now {
    margin-inline-start: auto;
  }
}

.event-hub.is-lol-event [id$="-teams"],
.event-hub.is-lol-event [id$="-schedule"],
.event-hub.is-lol-event [id$="-stages"],
.event-hub.is-lol-event [id$="-news"] {
  scroll-margin-top: 96px;
}

.event-hub.is-lol-event .standings-panel .panel-count {
  color: color-mix(in srgb, var(--worlds-gold) 72%, var(--event-muted));
}

.event-hub.is-lol-event .standings-groups {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding-top: 12px;
}

.event-hub.is-lol-event .standings-group {
  padding: 11px 12px 8px;
  border: 1px solid var(--event-border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--event-surface-soft) 46%, transparent);
}

.event-hub.is-lol-event .standings-group:last-child {
  padding-bottom: 8px;
  border-bottom: 1px solid var(--event-border);
}

.event-hub.is-lol-event .standings-group > header {
  margin-bottom: 3px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--event-border);
}

.event-hub.is-lol-event .standings-group > header strong {
  color: color-mix(in srgb, var(--worlds-gold) 74%, var(--n-text-color));
  letter-spacing: .04em;
}

.event-hub.is-lol-event .standings-team-grid {
  grid-template-columns: 1fr;
  column-gap: 0;
}

.event-hub.is-lol-event .standings-team {
  min-height: 49px;
  padding: 7px 0;
}

.event-hub.is-lol-event .standings-team__logo {
  width: 42px;
  height: 42px;
  flex-basis: 42px;
}

.event-hub.is-lol-event .standings-team__logo img {
  width: 34px;
  height: 34px;
}

.event-hub.is-lol-event .standings-team strong {
  font-size: 14px;
  letter-spacing: .015em;
}

.event-hub.is-lol-event .standings-team__name-row {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px 7px;
}

.event-hub.is-lol-event .standings-team__name-row > strong {
  min-width: 0;
}

.event-hub.is-lol-event .standings-team__record {
  display: inline-flex;
  min-height: 18px;
  flex: 0 0 auto;
  align-items: center;
  padding: 0 6px;
  border: 1px solid color-mix(in srgb, var(--worlds-cyan) 56%, var(--event-border));
  border-radius: 999px;
  color: color-mix(in srgb, var(--worlds-cyan) 78%, var(--worlds-cream));
  background: color-mix(in srgb, var(--worlds-rift-blue) 22%, transparent);
  font-size: 10px;
  font-weight: 760;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  letter-spacing: .02em;
  white-space: nowrap;
}

.event-hub.is-lol-event:not(.is-dark) .standings-team__record {
  border-color: #148ca4;
  color: #075466;
  background: #e9f8fb;
}

.event-hub.is-lol-event .standings-team__seed {
  display: inline-flex;
  min-height: 18px;
  flex: 0 0 auto;
  align-items: center;
  padding: 0 5px;
  border: 1px solid color-mix(in srgb, var(--worlds-gold) 42%, var(--event-border));
  border-radius: 999px;
  color: color-mix(in srgb, var(--worlds-gold) 82%, var(--n-text-color));
  background: color-mix(in srgb, var(--worlds-gold) 6%, transparent);
  font-size: 10px;
  font-weight: 720;
  line-height: 1;
  white-space: nowrap;
}

.event-hub.is-lol-event .standings-team__seed.is-direct {
  border-color: color-mix(in srgb, var(--worlds-cream) 28%, var(--worlds-gold-base));
  color: var(--worlds-cream);
  background:
    linear-gradient(180deg, rgba(149, 176, 184, .06), rgba(163, 126, 56, .08));
}

.event-hub.is-lol-event .standings-team__seed.is-pending {
  border-color: var(--event-border);
  color: var(--event-muted);
  background: transparent;
  font-weight: 620;
}

.event-hub.is-lol-event:not(.is-dark) .standings-team__seed {
  border-color: color-mix(in srgb, #8a651f 62%, var(--event-border));
  color: #4a3714;
  background: #f5ecd8;
}

.event-hub.is-lol-event:not(.is-dark) .standings-team__seed.is-direct {
  border-color: #a77a25;
  color: #3c2b0d;
  background: linear-gradient(180deg, #f8f1df, #ead7a6);
}

.event-hub.is-lol-event:not(.is-dark) .standings-team__seed.is-pending {
  border-color: color-mix(in srgb, #5c6673 48%, var(--event-border));
  color: #4d5662;
  background: #f3f5f7;
}

.event-hub.is-lol-event .standings-team__qualifier {
  display: inline-flex;
  min-height: 18px;
  flex: 0 0 auto;
  align-items: center;
  padding: 0 5px;
  border: 1px solid color-mix(in srgb, var(--worlds-cyan) 48%, var(--event-border));
  border-radius: 999px;
  color: color-mix(in srgb, var(--worlds-cyan) 66%, var(--worlds-cream));
  background: color-mix(in srgb, var(--worlds-rift-blue) 18%, transparent);
  font-size: 10px;
  font-weight: 720;
  line-height: 1;
  white-space: nowrap;
}

.event-hub.is-lol-event:not(.is-dark) .standings-team__qualifier {
  border-color: #0d6f78;
  color: #064b52;
  background: #dff4f2;
}

.event-hub.is-lol-event .standings-pending {
  grid-column: 1 / -1;
  justify-content: flex-start;
  padding: 10px 12px;
  border: 1px dashed color-mix(in srgb, var(--worlds-gold) 36%, var(--event-border));
  border-radius: 8px;
  background: color-mix(in srgb, var(--worlds-gold) 4%, var(--event-surface));
}

.event-hub.is-lol-event .lol-schedule-empty {
  display: grid;
  grid-template-columns: 66px minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  min-height: 230px;
  padding: 20px 6px;
}

.event-hub.is-lol-event .lol-schedule-empty__mark {
  position: relative;
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--worlds-gold) 34%, var(--event-border));
  border-radius: 50%;
}

.event-hub.is-lol-event .lol-schedule-empty__mark span {
  position: absolute;
  width: 28px;
  height: 1px;
  background: var(--worlds-gold);
  transform-origin: center;
}

.event-hub.is-lol-event .lol-schedule-empty__mark span:nth-child(1) {
  transform: rotate(0deg);
}

.event-hub.is-lol-event .lol-schedule-empty__mark span:nth-child(2) {
  transform: rotate(60deg);
}

.event-hub.is-lol-event .lol-schedule-empty__mark span:nth-child(3) {
  transform: rotate(-60deg);
}

.event-hub.is-lol-event .lol-schedule-empty__copy {
  min-width: 0;
}

.event-hub.is-lol-event .lol-schedule-empty__copy > strong {
  display: block;
  color: var(--n-text-color);
  font-size: 17px;
  font-weight: 760;
}

.event-hub.is-lol-event .lol-schedule-empty__copy > p {
  max-width: 620px;
  margin: 6px 0 12px;
  color: var(--n-text-color-2);
  font-size: var(--event-font-meta);
  line-height: 1.62;
}

.event-hub.is-lol-event .lol-schedule-empty__next {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px 10px;
  color: var(--event-muted);
  font-size: var(--event-font-caption);
}

.event-hub.is-lol-event .lol-schedule-empty__next span {
  color: var(--worlds-gold);
  font-weight: 720;
}

.event-hub.is-lol-event .lol-schedule-empty__next b {
  color: var(--n-text-color-2);
}

.event-hub.is-lol-event .lol-schedule-empty__actions {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
}

.event-hub.is-lol-event .lol-schedule-empty__action {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 7px;
  min-height: 32px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--lol-action-text);
  background: linear-gradient(
    315deg,
    var(--lol-action-start) 0%,
    var(--lol-action-end) 100%
  );
  font-weight: 720;
  white-space: nowrap;
}

.event-hub.is-lol-event .lol-schedule-empty__action:hover,
.event-hub.is-lol-event .lol-schedule-empty__action:focus-visible {
  border-color: var(--lol-action-hover);
  color: var(--lol-action-text);
  background: var(--lol-action-hover);
}

.event-hub.is-lol-event .lol-schedule-empty__action.is-secondary {
  border-color: color-mix(in srgb, var(--worlds-cream) 18%, var(--event-border));
  color: var(--n-text-color-2);
  background: transparent;
  font-weight: 650;
}

.event-hub.is-lol-event .lol-schedule-empty__action.is-secondary:hover,
.event-hub.is-lol-event .lol-schedule-empty__action.is-secondary:focus-visible {
  border-color: var(--lol-action-hover);
  color: color-mix(in srgb, var(--lol-action-hover) 68%, var(--n-text-color));
  background: rgba(0, 200, 200, .08);
}

.event-hub.is-lol-event .stage-grid {
  gap: 10px;
  padding-top: 12px;
}

.event-hub.is-lol-event .stage-card {
  position: relative;
  padding: 13px 14px;
  border: 1px solid var(--event-border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--event-surface-soft) 42%, transparent);
}

.event-hub.is-lol-event .stage-card__head {
  grid-template-columns: auto minmax(0, 1fr);
  align-items: baseline;
  gap: 4px 9px;
}

.event-hub.is-lol-event .lol-stage-index {
  grid-row: 1 / span 2;
  align-self: start;
  color: color-mix(in srgb, var(--worlds-gold) 58%, var(--event-muted));
  font-size: 20px;
  font-weight: 780;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.event-hub.is-lol-event .stage-card__head > span:last-child {
  color: var(--worlds-gold);
}

.event-hub.is-lol-event .stage-card small {
  min-height: 3.1em;
  margin-top: 9px;
  color: var(--event-muted);
  line-height: 1.55;
}

.event-hub.is-lol-event .lol-stage-broadcast {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 11px;
  padding-top: 8px;
  border-top: 1px solid var(--event-border);
  color: var(--event-muted);
  font-size: 11px;
}

.event-hub.is-lol-event .lol-stage-broadcast b {
  color: var(--n-text-color-2);
  font-weight: 680;
  text-align: right;
}

.event-hub.is-lol-event .news-panel .panel-kicker {
  color: color-mix(in srgb, var(--worlds-gold) 65%, var(--event-muted));
}

.event-hub.is-lol-event .event-source-note {
  flex-wrap: wrap;
}

.event-hub.is-lol-event .lol-riot-disclaimer {
  flex: 1 1 100%;
  padding-inline-start: calc(2em + 10px);
  color: color-mix(in srgb, var(--event-muted) 84%, transparent);
  font-size: 10px;
  line-height: 1.55;
}

@media (max-width: 1180px) {

  .event-hub.is-lol-event .event-page-search.event-page-search--topbar {
    width: min(280px, 29vw);
  }

  .event-hub.is-lol-event .event-dashboard {
    grid-template-columns: 1fr;
  }

  .event-hub.is-lol-event.is-demacia-event .event-dashboard {
    grid-template-columns: 1fr;
  }

  .event-hub.is-lol-event .stage-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {

  .event-hub.is-lol-event .event-page-search.event-page-search--topbar {
    width: auto;
    flex: 1 1 auto;
  }
}

@media (max-width: 620px) {

  .event-hub.is-lol-event .event-refresh-button {
    flex: 0 0 auto;
  }

  .event-hub.is-lol-event .event-page-search.event-page-search--topbar {
    min-width: calc(100% - 92px);
  }

  .event-hub.is-lol-event .standings-groups,
  .event-hub.is-lol-event .stage-grid {
    grid-template-columns: 1fr;
  }

  .event-hub.is-lol-event .lol-schedule-empty {
    grid-template-columns: 48px minmax(0, 1fr);
    gap: 12px;
    min-height: 0;
  }

  .event-hub.is-lol-event .lol-schedule-empty__mark {
    width: 44px;
    height: 44px;
  }

  .event-hub.is-lol-event .lol-schedule-empty__actions {
    grid-column: 1 / -1;
    align-items: flex-start;
  }
}


@media (prefers-reduced-motion: reduce) {
  .event-hub.is-aichi-event .event-hero__motion-ribbon {
    animation: none;
    transform: none;
  }

  .event-hub.is-aichi-event .event-brief-ticker__track {
    animation: none;
    transform: none;
  }

  .event-hub.is-aichi-event .event-brief-ticker__viewport {
    overflow-x: auto;
  }

  .medal-table tbody tr,
  .schedule-row,
  .schedule-more,
  .topic-more,
  .topic-card__main,
  .news-card {
    transition: none;
  }
}

@media (prefers-contrast: more) {
  .event-hub {
    --event-border: var(--event-border-strong);
  }
}

.event-history-link { flex: 0 0 auto; margin-inline-start: auto; color: #cbd9df; font-size: 12px; text-decoration: none; white-space: nowrap; }
.event-history-link:hover { color: #fff; text-decoration: underline; text-underline-offset: 3px; }
.event-history-link:focus-visible { outline: 2px solid #a9f4f4; outline-offset: 3px; }
.event-hub.is-lol-event .lol-schedule-empty__action:focus-visible { outline: 2px solid var(--worlds-cyan); outline-offset: 3px; }

/* Worlds 2026: results and stage route / schedule / source-backed information feed. */
.event-hub.is-worlds-event .worlds-workspace { gap: 12px; align-items: start; }
.event-hub.is-worlds-event .worlds-workspace > .event-panel { min-width: 0; padding: 16px; }
.event-hub.is-worlds-event .worlds-workspace .standings-group { min-width: 0; }
.worlds-schedule-clock-note { display: block; max-width: 100%; margin-top: 6px; color: var(--event-muted); font-size: 10px; line-height: 1.5; white-space: normal; }
.worlds-route-compact { margin: 8px 0 18px; padding: 12px; border: 1px solid var(--event-border); border-radius: 11px; background: color-mix(in srgb, var(--event-surface) 95%, var(--worlds-gold)); }
.worlds-route-compact__head { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 5px 8px; margin-bottom: 10px; }
.worlds-route-compact__head strong { font-size: 13px; }
.worlds-route-compact__head > span { font-size: 11px; color: var(--event-muted); }
.worlds-route-compact__list { display: grid; gap: 0; }
.worlds-route-compact__item { display: grid; grid-template-columns: 26px minmax(0,1fr); gap: 8px; align-items: start; padding: 9px 0; border-top: 1px solid var(--event-border); }
.worlds-route-compact__index { font-size: 10px; font-weight: 760; color: var(--worlds-gold); font-variant-numeric: tabular-nums; }
.worlds-route-compact__item > div { display: grid; min-width: 0; gap: 3px; }
.worlds-route-compact__item strong { font-size: 12px; line-height: 1.45; }
.worlds-route-compact__item time, .worlds-route-compact__item small { color: var(--event-muted); font-size: 11px; line-height: 1.45; }
.worlds-route-compact__details { margin-top: 8px; max-width: 100%; min-width: 0; overflow-x: auto; }
.worlds-route-compact__details summary { cursor: pointer; padding: 8px 0 2px; font-size: 12px; font-weight: 700; color: var(--n-text-color); }
.worlds-route-compact__details summary:focus-visible { outline: 2px solid var(--n-primary-color); outline-offset: 3px; }
.worlds-route-compact__details > :not(summary) { margin-top: 12px; max-width: 100%; }
.worlds-insights { display: flex; flex-direction: column; min-width: 0; gap: 13px; }
 .worlds-insights > .event-hot-ranking { flex: 1 1 auto; min-height: 0; overflow-y: auto; overflow-x: hidden; scrollbar-gutter: stable; padding-right: 3px; }
.worlds-insights__head { display: flex; align-items: start; justify-content: space-between; gap: 8px; }
.worlds-insights__head h2 { margin: 4px 0 0; font-size: 18px; line-height: 1.3; }
.worlds-insights__count { padding: 3px 8px; border: 1px solid var(--event-border); border-radius: 7px; color: var(--event-muted); font-size: 12px; font-variant-numeric: tabular-nums; }
.worlds-insights__tabs { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 4px; padding: 3px; border: 1px solid var(--event-border); border-radius: 9px; background: color-mix(in srgb, var(--event-surface) 92%, var(--n-text-color)); }
.worlds-insights__tabs button { min-height: 34px; padding: 5px 2px; border: 0; border-radius: 6px; background: transparent; color: var(--event-muted); font-size: 12px; cursor: pointer; }
.worlds-insights__tabs button.is-active { color: var(--n-text-color); background: var(--event-surface); font-weight: 760; border: 1px solid var(--event-border); }
.worlds-insights__tabs button:focus-visible, .worlds-insights__more:focus-visible, .worlds-insights__item:focus-visible { outline: 2px solid var(--n-primary-color); outline-offset: 2px; }
.worlds-insights__feed { display: grid; gap: 0; }
.worlds-insights__item { display: grid; gap: 5px; min-width: 0; padding: 12px 0; border-bottom: 1px solid var(--event-border); color: var(--n-text-color); text-decoration: none; }
.worlds-insights__item:hover strong, .worlds-insights__item:focus-within strong { color: var(--n-primary-color); }
.worlds-insights__item strong { font-size: 13px; line-height: 1.5; overflow-wrap: anywhere; }
.worlds-insights__item p { margin: 0; font-size: 11px; line-height: 1.6; color: var(--event-muted); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.worlds-insights__item small { color: var(--event-muted); font-size: 10px; }
.worlds-insights__meta { display: flex; align-items: center; flex-wrap: wrap; gap: 5px 8px; color: var(--event-muted); font-size: 10px; }
.worlds-insights__meta time { font-variant-numeric: tabular-nums; }
.worlds-insights__source { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 150px; }
.worlds-insights__kind { margin-left: auto; padding: 2px 5px; border: 1px solid var(--event-border); border-radius: 4px; font-weight: 650; }
.worlds-insights__empty { padding: 22px 4px; color: var(--event-muted); font-size: 12px; line-height: 1.65; }
.worlds-insights__more { width: 100%; padding: 10px 8px; border: 1px solid var(--event-border); border-radius: 7px; background: transparent; color: var(--n-text-color); font-size: 12px; cursor: pointer; }
.worlds-insights__links { display: flex; flex-wrap: wrap; gap: 8px 12px; padding-top: 10px; border-top: 1px solid var(--event-border); }
.worlds-insights__links a { font-size: 11px; color: var(--event-muted); text-decoration: none; }
.worlds-insights__links a:hover { color: var(--n-primary-color); }
.aichi-archive-note { display: flex; gap: 18px; justify-content: space-between; align-items: center; }
.aichi-archive-note h2 { margin: 6px 0; font-size: 17px; }
.aichi-archive-note p { margin: 0; color: var(--event-muted); font-size: 12px; line-height: 1.7; }
.aichi-archive-note > a { flex: 0 0 auto; color: var(--n-primary-color); font-size: 12px; text-decoration: none; }
@media (min-width: 1240px) {
  .event-hub.is-lol-event.is-worlds-event .worlds-workspace {
    grid-template-columns: minmax(260px,.83fr) minmax(410px,1.45fr) minmax(278px,.93fr);
  }
  .event-hub.is-worlds-event .worlds-insights { position: sticky; top: 82px; max-height: calc(100vh - 104px); overflow-y: auto; scrollbar-gutter: stable; }
  .event-hub.is-worlds-event .standings-groups { max-height: 64vh; min-height: 120px; overflow-y: auto; scrollbar-gutter: stable; }
}
@media (min-width: 901px) and (max-width: 1239px) {
  .event-hub.is-lol-event.is-worlds-event .worlds-workspace { grid-template-columns: minmax(280px,.8fr) minmax(0,1.2fr); }
  .event-hub.is-worlds-event .worlds-insights { grid-column: 1 / -1; }
  .event-hub.is-worlds-event .worlds-insights__feed { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 0 18px; }
}
@media (max-width: 900px) {
  .event-hub.is-lol-event.is-worlds-event .worlds-workspace { grid-template-columns: minmax(0,1fr); }
  .event-hub.is-worlds-event .worlds-workspace > .schedule-panel { order: 0; }
  .event-hub.is-worlds-event .worlds-workspace > .worlds-insights { order: 1; }
  .event-hub.is-worlds-event .worlds-workspace > .primary-panel { order: 2; }
  .event-hub.is-worlds-event .worlds-insights { position: static; max-height: none; overflow: visible; }
  .aichi-archive-note { align-items: start; flex-direction: column; }
}
@media (prefers-reduced-motion: reduce) {
  .event-hub.is-worlds-event .worlds-insights__item { scroll-behavior: auto; }
}


/* S16 two-column match-first dashboard: schedule, live/VOD and bracket share the main surface. */
.event-hub.is-lol-event.is-worlds-event .worlds-workspace {
 display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,30%);grid-template-rows:minmax(0,auto);
 gap:12px;align-items:stretch;
}
.event-hub.is-worlds-event .worlds-workspace > .worlds-main-shell {
 grid-column:1;grid-row:1;min-width:0;align-self:stretch;
}
.event-hub.is-worlds-event .worlds-workspace.is-worlds-schedule-view > .schedule-panel{grid-column:1;grid-row:1 / span 2;}
.event-hub.is-worlds-event .worlds-workspace > :is(.primary-panel,.schedule-panel) {
 grid-column:1;grid-row:2;min-width:0;align-self:start;
}
.worlds-main-shell > :is(.worlds-bracket-panel,.worlds-format-panel) {min-width:0;padding-top:13px}
.event-hub.is-worlds-event .worlds-workspace > .worlds-insights {
 grid-column:2;grid-row:1;position:relative;top:auto;
 height:auto;box-sizing:border-box;max-height:none;min-height:0;overflow:hidden;align-self:stretch;
}
.worlds-main-tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px;padding:3px;border:1px solid var(--event-border);border-radius:9px;background:color-mix(in srgb,var(--event-surface) 92%,var(--n-text-color))}
.worlds-main-tabs button{min-width:0;min-height:34px;padding:5px 6px;border:1px solid transparent;border-radius:6px;background:transparent;font:inherit;font-size:12px;color:var(--event-muted);cursor:pointer;transition:none}
.worlds-main-tabs button:hover:not(.is-active){background:color-mix(in srgb,var(--event-surface) 45%,transparent);color:var(--n-text-color)}
.worlds-main-tabs button.is-active{background:var(--event-surface);border-color:var(--event-border);color:var(--n-text-color);font-weight:760}
.worlds-main-tabs button:focus-visible{outline:2px solid var(--n-primary-color);outline-offset:2px}
.worlds-return-bracket{border:0;background:transparent;padding:6px 0;color:var(--n-primary-color);font:inherit;font-size:11px;cursor:pointer}
.worlds-return-bracket:focus-visible{outline:2px solid var(--n-primary-color);outline-offset:2px}
.event-hub.is-worlds-event .worlds-workspace .primary-panel .worlds-route-compact{display:none}
.worlds-format-stage-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:16px}
.worlds-format-stage-list>div{display:grid;gap:5px;padding:10px;border:1px solid var(--event-border);border-radius:8px}
.worlds-format-stage-list b{font-size:12px}.worlds-format-stage-list time,.worlds-format-stage-list small{font-size:11px;color:var(--event-muted)}
.worlds-format-teams{display:flex;gap:10px;justify-content:space-between;flex-wrap:wrap;font-size:12px;border-top:1px solid var(--event-border);padding-top:12px}
.worlds-format-teams button{border:0;background:transparent;color:var(--n-primary-color);font:inherit;cursor:pointer}
.event-hub.is-worlds-event .worlds-insights{display:flex;flex-direction:column;min-height:0}
 .event-hub.is-worlds-event .worlds-insights__feed{
 display:block;flex:1 1 0;min-width:0;min-height:0;max-height:none;
 overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;scrollbar-gutter:stable;
 border-left:0;padding-left:23px;margin-left:0;
}
.event-hub.is-worlds-event .worlds-insights__feed:focus-visible{outline:2px solid var(--n-primary-color);outline-offset:2px}
.event-hub.is-worlds-event .worlds-insights__item{
 display:grid;gap:6px;position:relative;min-width:0;padding:13px 0 18px;
 border-bottom:0;color:var(--n-text-color);text-decoration:none;
}
.event-hub.is-worlds-event .worlds-insights__item:not(:last-child):after{
 content:'';position:absolute;left:-13px;top:23px;bottom:-12px;border-left:1px solid var(--event-border)
}
.event-hub.is-worlds-event .worlds-insights__item:before{
 content:'';position:absolute;left:-18px;top:18px;width:10px;height:10px;border-radius:50%;
 border:3px solid color-mix(in srgb,var(--n-primary-color) 20%,var(--n-color));
 background:var(--n-primary-color);z-index:1;
}
.event-hub.is-worlds-event .worlds-insights__item strong{
 font-size:13px;line-height:1.6;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;
}
.event-hub.is-worlds-event .worlds-insights__meta{order:2;gap:4px 8px;font-size:11px;align-items:center}
.event-hub.is-worlds-event .worlds-insights__kind{margin-left:0;padding:1px 5px;font-size:10px}
.event-hub.is-worlds-event .worlds-insights__source{max-width:165px}
.event-hub.is-worlds-event .worlds-insights__item > small{order:3}
.event-hub.is-worlds-event .worlds-insights__item:hover strong,.event-hub.is-worlds-event .worlds-insights__item:focus-within strong{color:var(--n-primary-color)}
.event-hub.is-worlds-event .worlds-insights__primary-link{display:grid;gap:5px;min-width:0;color:inherit;text-decoration:none;outline-offset:3px}
.event-hub.is-worlds-event .worlds-insights__primary-link:focus-visible,
.event-hub.is-worlds-event .worlds-insights__alternate:focus-visible{outline:2px solid var(--n-primary-color);outline-offset:3px}
.event-hub.is-worlds-event .worlds-insights__alternate{font-size:11px;color:var(--n-primary-color);width:max-content;max-width:100%;text-decoration:none;padding:2px 0}

@media(max-width:1090px){
 .event-hub.is-lol-event.is-worlds-event .worlds-workspace{grid-template-columns:minmax(0,1fr) minmax(250px,33%)}
 .event-hub.is-worlds-event .worlds-insights{grid-column:2;grid-row:1;max-height:none}
 .event-hub.is-worlds-event .worlds-insights__feed{display:block;grid-template-columns:none}
}
@media(max-width:850px){
 .event-hub.is-lol-event.is-worlds-event .worlds-workspace{grid-template-columns:minmax(0,1fr);grid-template-rows:auto auto auto;align-items:start}
 .event-hub.is-worlds-event .worlds-workspace > .worlds-main-shell{grid-column:1;grid-row:1}
 .event-hub.is-worlds-event .worlds-workspace > :is(.primary-panel,.schedule-panel){grid-column:1;grid-row:2}
 .event-hub.is-worlds-event .worlds-workspace.is-worlds-schedule-view > .schedule-panel{grid-column:1;grid-row:1 / span 2}
 .event-hub.is-worlds-event .worlds-workspace > .worlds-insights{
  grid-column:1;grid-row:3;position:static;height:auto;max-height:none;overflow:visible;order:unset;
 }
 .event-hub.is-worlds-event .worlds-insights__feed{display:block;flex:0 1 auto;max-height:470px;grid-template-columns:none}
}
@media(max-width:460px){
 .worlds-main-tabs{grid-template-columns:repeat(2,minmax(0,1fr))}
 .worlds-format-stage-list{grid-template-columns:1fr}
 .event-hub.is-worlds-event .worlds-insights__feed{max-height:450px}
}


/* Aichi's completed-event right column reuses the S16 unified news/talk sidebar.
   It stays in the original three-column grid instead of adding a wide archive card. */
.event-hub.is-aichi-event .aichi-insights {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}
.event-hub.is-aichi-event .aichi-insights__archive-caption {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 9px;
  margin: -3px 0 0;
  color: var(--event-muted);
  font-size: 11px;
  line-height: 1.55;
}
.event-hub.is-aichi-event .aichi-insights__archive-caption a {
  color: var(--n-primary-color);
  text-decoration: none;
}
.event-hub.is-aichi-event .aichi-insights__archive-caption a:hover { text-decoration: underline; }
.event-hub.is-aichi-event .aichi-insights .worlds-insights__feed {
  display: block;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-gutter: stable;
  padding-left: 22px;
}
.event-hub.is-aichi-event .aichi-insights .worlds-insights__item {
  position: relative;
  display: grid;
  gap: 5px;
  padding: 12px 0 16px;
  border: 0;
}
.event-hub.is-aichi-event .aichi-insights .worlds-insights__item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: -13px;
  top: 23px;
  bottom: -12px;
  border-left: 1px solid var(--event-border);
}
.event-hub.is-aichi-event .aichi-insights .worlds-insights__item::before {
  content: '';
  position: absolute;
  left: -18px;
  top: 18px;
  z-index: 1;
  width: 10px;
  height: 10px;
  border: 3px solid color-mix(in srgb,var(--n-primary-color) 20%,var(--n-color));
  border-radius: 50%;
  background: var(--n-primary-color);
}
.event-hub.is-aichi-event .aichi-insights .worlds-insights__primary-link {
  display: grid;
  gap: 5px;
  min-width: 0;
  color: inherit;
  text-decoration: none;
}
.event-hub.is-aichi-event .aichi-insights .worlds-insights__primary-link strong {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.6;
}
.event-hub.is-aichi-event .aichi-insights .worlds-insights__kind { margin-left: 0; }
.event-hub.is-aichi-event .aichi-insights .worlds-insights__primary-link:focus-visible,
.event-hub.is-aichi-event .aichi-insights .aichi-insights__archive-caption a:focus-visible {
  outline: 2px solid var(--n-primary-color);
  outline-offset: 3px;
}
@media (min-width: 1081px) {
  .event-hub.is-aichi-event .event-dashboard > .aichi-insights {
    grid-column: 3;
    order: 2;
    height: clamp(500px, calc(100vh - 310px), 590px);
  }
}
@media (min-width: 721px) and (max-width: 1080px) {
  .event-hub.is-aichi-event .event-dashboard > .aichi-insights {
    grid-column: 2;
    order: 3;
    height: 500px;
  }
}
@media (max-width: 720px) {
  .event-hub.is-aichi-event .event-dashboard > .aichi-insights {
    grid-column: 1;
    order: 4;
    max-height: none;
  }
  .event-hub.is-aichi-event .aichi-insights .worlds-insights__feed {
    flex: 0 1 auto;
    max-height: 470px;
  }
}
</style>
