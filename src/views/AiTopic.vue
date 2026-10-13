<template>
  <section ref="topicRef" class="ai-topic" :class="{ 'is-wide': wideLayout, 'is-compact': reader.compact, 'is-model-panel': modelView, 'is-intelligence-panel': !modelView && !monitorView }" :style="themeStyle">
    <div v-show="!monitorView" class="topic-overview" :class="{ 'is-model-workspace': modelView, 'is-intelligence-workspace': !modelView && !monitorView }" :aria-hidden="monitorView" :role="monitorView ? undefined : 'region'" :aria-label="monitorView ? undefined : modelView ? modelIdentity.title : copy.title">
    <n-alert v-if="loadError" type="error" :show-icon="false" class="topic-alert">{{ result ? evidenceCopy.refreshFailed : evidenceCopy.loadFailed }}</n-alert>
    <n-alert v-else-if="severeDegraded" type="warning" :show-icon="false" class="topic-alert">{{ copy.degraded }}</n-alert>
    <header class="ai-header">
      <div class="ai-brand"><span class="ai-brand-mark" aria-hidden="true"><svg viewBox="0 0 40 40" fill="none"><path d="m20 8 3.8 9.2L33 21l-9.2 3.8L20 34l-3.8-9.2L7 21l9.2-3.8L20 8Z" fill="currentColor"/><path d="m32 1 1.8 4.2L38 7l-4.2 1.8L32 13l-1.8-4.2L26 7l4.2-1.8L32 1ZM6 3l1.1 2.8L10 7l-2.9 1.2L6 11l-1.2-2.8L2 7l2.8-1.2L6 3Z" fill="currentColor" opacity=".55"/></svg></span><svg class="ai-banner-art" viewBox="0 0 360 180" aria-hidden="true"><g fill="none" stroke="currentColor"><circle cx="220" cy="90" r="80"/><circle cx="220" cy="90" r="56"/><circle cx="220" cy="90" r="30"/><path d="M130 90h180M220 0v180M220 90l60-54"/><path d="M220 90l60-54a80 80 0 0 1 20 54Z" fill="currentColor" opacity=".2"/></g><g fill="currentColor"><circle cx="252" cy="65" r="4"/><circle cx="182" cy="112" r="3"/><circle cx="275" cy="132" r="3"/></g></svg><div><h1>{{ modelView ? modelIdentity.title : copy.title }}</h1><p>{{ modelView ? modelIdentity.description : copy.description }}</p><div v-if="!modelView && result" class="ai-brand-metadata"><span>{{ data.length }} {{ ui.events }}</span><time v-if="result?.updateTime">{{ ui.updated }} {{ formatUpdated(result.updateTime) }}</time></div></div></div>
      <div class="ai-header-right"><div class="ai-status">
        <AiServiceStatus :statuses="serviceStatuses" :loading="statusesLoading" :locale="locale" :theme-style="themeStyle" />
        <span v-if="supplementing" class="ai-load-status" role="status">{{ cachedSnapshot ? boardCopy.recentSnapshot : boardCopy.supplementing }}</span>
        <button type="button" class="radar-refresh" :class="{'is-loading':modelView ? modelExplorerRef?.loading : loading}" :disabled="modelView ? modelExplorerRef?.loading : loading" :aria-label="ui.refresh" @click="refreshTopic"><svg viewBox="0 0 18 18" aria-hidden="true"><path d="M14.5 6.1A6 6 0 1 0 15 10.2M14.5 3.5v3.2h-3.2" /></svg><span>{{ ui.refresh }}</span></button>
        <button type="button" class="ai-page-settings-trigger" :aria-label="boardCopy.pageSettings" :title="boardCopy.pageSettings" :aria-expanded="pageSettingsOpen" aria-haspopup="dialog" @click="openPageSettings"><n-icon :component="SettingTwo" /></button>
      </div>
      <nav class="ai-panel-switch" :aria-label="locale.startsWith('zh')?'专题视角':'Topic view'"><button type="button" :class="{active:!modelView && !monitorView}" :aria-pressed="!modelView && !monitorView" @click="setPanel('intelligence')">{{ locale.startsWith('zh')?'精华动态':'Intelligence' }}</button><button type="button" :class="{active:modelView}" :aria-pressed="modelView" @click="setPanel('models')">{{ locale.startsWith('zh')?'模型实力榜':'Model benchmarks' }}</button><button type="button" :class="{active:monitorView}" :aria-pressed="monitorView" @click="setPanel('monitor')">{{ locale.startsWith('zh')?'监控大屏 · 实验':'Monitor · Beta' }}</button><div v-if="!modelView" class="ai-language-choice"><span class="sr-only">{{ locale.startsWith('zh')?'看板语言':'Board language' }}</span><HoverMenuSelect :model-value="displayLanguage.board" :options="boardLanguageOptions" :theme-style="themeStyle" :aria-label="locale.startsWith('zh')?'看板语言':'Board language'" variant="toolbar" @update:model-value="displayLanguage.board=$event" /></div><router-link :to="withLocalePrefix(locale,'/category/ai')">{{ locale.startsWith('zh')?'AI 榜单目录':'AI rankings' }} ↗</router-link><n-popover v-if="modelView" trigger="click" placement="bottom-end" :style="{...themeStyle,maxWidth:'min(300px, calc(100vw - 36px))'}"><template #trigger><button class="ai-model-help" type="button" :aria-label="locale.startsWith('zh')?'榜单统计口径说明':'Benchmark methodology'" :title="locale.startsWith('zh')?'榜单统计口径说明':'Benchmark methodology'"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="7.25"/><path d="M10 9v4m0-7.2v.4"/></svg></button></template><p class="ai-model-help-text">{{ locale.startsWith('zh')?'能力测试、用户偏好与使用量分别衡量不同维度，不应直接累加原始分数。':'Capability tests, user preferences and usage measure different dimensions; do not add raw scores.' }}</p></n-popover><button v-if="modelView" type="button" class="ai-model-reset" :aria-label="locale.startsWith('zh')?'重置四栏':'Reset four boards'" :title="locale.startsWith('zh')?'重置四栏':'Reset four boards'" @click="modelExplorerRef?.reset()"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 9a6 6 0 1 1 1.5 4.9M4 4.5V9h4.5"/></svg></button></nav>
      </div>
    </header>
    <n-modal v-model:show="pageSettingsOpen" :trap-focus="true" @after-enter="focusPageSettings" @after-leave="returnPageSettingsFocus">
      <div ref="pageSettingsRef" class="ai-settings-popup ai-page-settings" :style="themeStyle" role="dialog" aria-modal="true" :aria-label="boardCopy.pageSettings" @keydown.esc.stop.prevent="pageSettingsOpen=false">
        <header class="ai-settings-popup-heading"><h2>{{ boardCopy.pageSettings }}</h2><button type="button" :aria-label="boardCopy.closePage" @click="pageSettingsOpen=false">×</button></header>
        <label class="ai-page-language">{{ locale.startsWith('zh')?'全页语言显示':'Page language display' }}<NativeSelectShell class="ai-page-language-select"><select v-model="displayLanguage.page" :aria-label="locale.startsWith('zh')?'全页语言显示':'Page language display'"><option value="translated">{{ locale.startsWith('zh')?'译文（术语保留原名）':'Translated (names preserved)' }}</option><option value="original">{{ locale.startsWith('zh')?'原文':'Original' }}</option></select></NativeSelectShell></label>
        <AiTopicPageSettings :copy="boardCopy" :sources="managedSources" :excluded="readerPreference.excluded" :refined="readerPreference.refined" :rankings="rankingShortcuts" @exclude-source="toggleSource" @restore-sources="restoreSources" @reset-order="laneOrder=normalizeAiLaneOrder(null)" @update:refined="readerPreference={...readerPreference,refined:$event}">
          <template #diagnostics>
            <div class="ai-diagnostics">
              <details class="source-health"><summary>{{ boardCopy.quality }} · {{ rawData.length-qualityRejected.length }} / {{ rawData.length }}</summary><p>{{ boardCopy.qualityHint }}</p><ul><li v-for="[reason,count] in qualityCounts" :key="reason"><span>{{ boardCopy.qualityReasons[reason] || reason }}</span><span>{{ count }}</span></li></ul></details>
              <details v-if="result" class="source-health">
                <summary>{{ evidenceCopy.health }} · {{ healthyFeedCount }} / {{ sourceFeeds.length }}</summary>
                <p>{{ evidenceCopy.basis }}</p><p v-if="result.fromCache">{{ evidenceCopy.cached }}</p>
                <ul>
                  <li v-for="feed in sourceFeeds" :key="feed.source + ':' + (feed.variant || '')">
                    <span>{{ sourceChannelLabel(feed.source, feed.label) }}<template v-if="feed.rankingLabel"> · {{ feed.rankingLabel }}</template><template v-if="feed.intake"> · {{ boardCopy.observing }}</template></span>
                    <span>{{ evidenceCopy.states[aiFeedState(feed)] }} · {{ Number(feed.count || 0) }}</span>
                    <time v-if="formatUpdated(feed.updateTime)">{{ ui.updated }} {{ formatUpdated(feed.updateTime) }}</time>
                  </li>
                </ul>
              </details>
              <div class="ai-discovery-status">
                <details>
                  <summary>{{ boardCopy.discover }} · {{ boardCopy.checked }} {{ discoveryCoverage.checked || 0 }}/{{ discoveryCoverage.total || '—' }} {{ boardCopy.targets }}<span v-if="discoveryFailures"> · {{ boardCopy.failures }} {{ discoveryFailures }}</span></summary>
                  <p>{{ boardCopy.scope }}</p><p v-if="discoveryError">{{ boardCopy.paused }}</p>
                  <ul><li v-for="feed in discoveryFeeds" :key="feed.source + ':' + feed.variant">{{ sourceChannelLabel(feed.source,feed.label) }} · {{ feed.rankingLabel }} · {{ evidenceCopy.states[aiFeedState(feed)] }} · {{ feed.count }}</li></ul>
                </details>
              </div>
            </div>
          </template>
        </AiTopicPageSettings>
      </div>
    </n-modal>
    <AiIntelligenceBoard v-if="!modelView && !monitorView" :theme-style="themeStyle" :loading="loading && !result" :lanes="visibleBoardLanes" :available-lanes="boardLanes" :copy="boardCopy" @reorder="reorderLanes" @replace-lane="replaceVisibleLane" @select="selectBoardTask" @browse="visibleBoardKeys=$event" @toggle-language="toggleItemLanguage($event,'board')" />
    <Teleport to="body"><AiRadarMonitor v-if="monitorView" :lanes="boardLanes" :feeds="sourceFeeds" :locale="locale" :updated-at="result?.updateTime" :source-count="sourceFeeds.length" :healthy-count="healthyFeedCount" :total-count="data.length" :loading="loading && !result" @close="setPanel('intelligence')" @select="selectBoardTask" /></Teleport>
    <AiModelExplorer ref="modelExplorerRef" v-if="modelView" :locale="locale" :theme-style="themeStyle" />
    </div>
    <div ref="readerContainerRef" class="topic-reader" :aria-label="locale.startsWith('zh')?'深入阅读':'In-depth reading'">
    <div class="ai-workspace">
      <nav class="ai-navigation" :aria-label="boardCopy.type">
        <button v-for="option in categoryOptions" :key="option.value" type="button" :data-ai-topic="option.value" :class="{ active: activeBoard === 'all' && activeCategory === option.value }" :aria-current="activeBoard === 'all' && activeCategory === option.value ? 'true' : undefined" @click="selectReadingTopic(option.value)"><span>{{ option.label }}</span><em>{{ option.count }}</em></button>
      </nav>
      <div ref="eventListRef" class="ai-main">
        <div class="ai-feed-toolbar">
          <div><h2 class="ai-feed-heading" tabindex="-1">{{ boardCopy.full }}<template v-if="activeBoard !== 'all'"> · {{ boardCopy.lanes[activeBoard].title }}</template><template v-else-if="activeCategory !== 'all'"> · {{ kindLabel(activeCategory) }}</template></h2><span v-if="result">{{ pageRangeText }}</span><span v-if="supplementing && result" class="ai-reading-progress" role="status">{{ boardCopy.supplementing }}</span><span v-else-if="discoveryError" class="ai-reading-progress" role="status">{{ boardCopy.paused }}</span></div>
          <div class="ai-feed-actions">
            <div class="ai-reader-time-filter"><span>{{ locale.startsWith("zh") ? "时间" : "Time" }}</span><HoverMenuSelect :model-value="activeTime" :options="readingTimeOptions" :theme-style="themeStyle" :aria-label="locale.startsWith('zh') ? '深入阅读时间范围' : 'Reading time range'" variant="toolbar" @update:model-value="activeTime=$event" /></div>
            <n-pagination v-if="result && pageCount>1" v-model:page="currentPage" :page-count="pageCount" :page-slot="3" size="small" @update:page="handlePageChange" />
            <div class="ai-language-choice"><span class="sr-only">{{ locale.startsWith('zh')?'阅读语言':'Reading language' }}</span><HoverMenuSelect :model-value="displayLanguage.reader" :options="readerLanguageOptions" :theme-style="themeStyle" :aria-label="locale.startsWith('zh')?'阅读语言':'Reading language'" variant="toolbar" @update:model-value="displayLanguage.reader=$event" /></div><button type="button" class="ai-translation-trigger" :title="translationFailed ? boardCopy.translationFailed : undefined" :disabled="translating" @click="translateVisible(true)">{{ translating ? boardCopy.translating : boardCopy.translate }}</button>
            <button v-if="hasFilters" type="button" class="reset-filter" @click="resetFilters"><span aria-hidden="true">×</span> {{ ui.reset }}</button>
            <button v-if="!wideLayout" type="button" class="ai-settings-trigger" :aria-expanded="settingsOpen" aria-haspopup="dialog" @click="settingsOpen=true">{{ readerCopy.settings }}</button>
            <n-modal v-if="!wideLayout" v-model:show="settingsOpen" :trap-focus="true" @after-enter="handleSettingsShow(true)" @after-leave="closeSettings">
              <div ref="settingsPopupRef" class="ai-settings-popup" :style="themeStyle" role="dialog" aria-modal="true" :aria-label="readerCopy.settings" @keydown.esc.stop.prevent="closeSettings">
                <header class="ai-settings-popup-heading"><h2>{{ readerCopy.settings }}</h2><button type="button" :aria-label="boardCopy.close" @click="closeSettings">×</button></header>
                <AiTopicControls v-model="reader" :copy="readerCopy" :filters="controlFilters" :associated-only="activeConfirmed" :associated-count="associatedEventCount" :associated-label="ui.resonance" :board-copy="boardCopy" :page="currentPage" :page-count="pageCount" @filter-change="updateControl" @update:associated-only="activeConfirmed=$event" @page-change="changeReadingPage" />
              </div>
            </n-modal>
          </div>
        </div>
        <span v-if="translationFeedback" class="ai-translation-feedback" role="status">{{ translationFeedback }}</span><span v-else-if="translationFailed" class="ai-reader-announcement" role="status">{{ boardCopy.translationFailed }}</span>
        <div v-if="(modelView && !modelReaderActive) || (loading && !result)" class="topic-loading"><n-skeleton text :repeat="9" /></div>
        <div v-else-if="filteredData.length" class="event-list">
          <article v-for="(item,index) in pagedData" :key="aiItemKey(item)" :data-ai-item="aiItemKey(item)" class="event-item expandable-cover-row" :class="{ 'has-cover': hasUsableCover(item), 'is-model-release': aiOfficialModelRelease(item) }">
            <span class="ai-row-number" :data-rank="pageStart+index+1" :title="boardCopy.full">{{ pageStart+index+1 }}</span>
            <ReadingCover v-if="hasUsableCover(item)" class="event-cover" :src="aiSafeUrl(item.cover)" :title="item.title" :locale="locale" @error="onImageError($event, item)" />
            <div class="event-main">
              <a class="event-title" :href="localizedPublicationUrl(aiSafeUrl(item.url),locale) || undefined" target="_blank" rel="noopener noreferrer"><h3 :title="originalTitleHint(item)">{{ item.title }}<AiSignalBadge v-if="aiOfficialModelRelease(item)" kind="official" :label="releaseLabel(item)" /><AiSignalBadge v-else-if="aiEditorialEmphasis(item)" kind="quota" :label="boardCopy.quotaMark" /><span aria-hidden="true"> ↗</span></h3></a>
              <p v-if="reader.original && item.originalTitle && item.originalTitle !== item.title" class="original-title">{{ item.originalTitle }}</p>
              <ReadingSummary v-if="reader.summaries && item.desc" :text="item.desc" :lines="reader.compact ? 1 : 2" :expand-label="readerCopy.fullSummary" :collapse-label="boardCopy.collapseSummary" />
              <div class="event-meta"><span class="ai-topic-tag" :data-ai-topic="signalKind(item)">{{ kindLabel(signalKind(item)) }}</span>
                <span class="event-source-line"><img :src="getSourceLogo(primarySource(item))" alt="" @error="onLogoError" /><span>{{ sourceLabel(item) }}</span></span>
                <span v-if="rankLabel(item)">{{ rankLabel(item) }}</span>
                <span v-if="associatedSourceCount(item) > 1">{{ associatedSourceCount(item) }} {{ ui.sourceResonance }}</span>
                <AiMetric :metric="readableMetric(item)" />
                <time v-if="item.extra?.socialPost?.eventGroup?.latestAt" :datetime="item.extra.socialPost.eventGroup.latestAt" :title="formatFullTime(item.extra.socialPost.eventGroup.latestAt)">{{ locale.startsWith('zh')?'最新进展':'Latest update' }} {{ formatUpdated(item.extra.socialPost.eventGroup.latestAt) }}</time>
                <time v-else-if="aiTimes(item).published" :datetime="calendarPublicationDate(aiPublicationDisplayTime(item)) || new Date(aiTimes(item).published).toISOString()" :title="formatFullTime(aiPublicationDisplayTime(item))">{{ formatSignalFreshness(item) }}</time>
                <time v-else-if="aiTimes(item).updated" :title="evidenceCopy.times.updated">{{ ui.updated }} {{ formatUpdated(aiTimes(item).updated) }}</time>
                <time v-if="item.extra?.modelRepository" :title="locale.startsWith('zh')?'模型仓库创建时间，非正式发布日期':'Repository creation, not release date'">{{ locale.startsWith('zh')?'仓库创建':'Repository created' }} {{ formatUpdated(item.extra.modelRepository.createdAt) }}</time>
                <button v-if="translatableItem(item)" type="button" class="ai-item-language" :aria-pressed="isOriginal(item,'reader')" @click="toggleItemLanguage(item,'reader')">{{ isOriginal(item,'reader')?(locale.startsWith('zh')?'译文':'Translated'):(locale.startsWith('zh')?'原文':'Original') }}</button><button type="button" class="ai-hide-source" :aria-label="boardCopy.hide + ' ' + sourceLabel(item)" @click="hideReadingSource(primarySource(item))">{{ boardCopy.hide }}</button>
                <AiEvidencePopover :id="'evidence-'+encodeURIComponent(aiItemKey(item))" :locale="locale" :theme-style="themeStyle" :label="evidenceCopy.evidence+(associatedSourceCount(item)>1?' · '+associatedSourceCount(item)+' '+ui.sourcesShort:'')"><div class="event-evidence">
              <p v-if="associatedSourceCount(item) > 1" class="evidence-note">{{ evidenceCopy.associationNote }}</p>
              <p v-if="!item.extra?.socialPost" class="evidence-note">{{ boardCopy.quality }} · {{ itemQuality(item).reasons.map(reason=>boardCopy.qualityReasons[reason] || reason).join(" / ") }}</p>
              <p v-if="item.author && !item.extra?.socialPost" class="event-author">{{ evidenceCopy.author }}：{{ item.author }}</p>
              <p v-if="isOriginal(item,'reader') && item.originalTitle && item.originalTitle !== item.title" class="original-title">{{ evidenceCopy.original }}：{{ item.originalTitle }}</p>
              <p v-if="visibleDiscovery(item)" class="evidence-note">{{ boardCopy.discover }}：<router-link :to="discoveryPath(item)">{{ sourceChannelLabel(item.extra.discovery.source) }} · {{ item.extra.discovery.rankingLabel }}</router-link> · {{ boardCopy.reason }} {{ item.extra.discovery.reason }}<template v-if="item.extra.discovery.originalRank"> · {{ boardCopy.rank }} #{{ item.extra.discovery.originalRank }}</template></p>
              <p v-if="item.extra?.modelRepository" class="evidence-note">{{ locale.startsWith('zh')?'模型仓库创建（非正式发布日期）':'Repository created (not model release date)' }} · {{ formatFullTime(item.extra.modelRepository.createdAt) }}</p>
              <p v-if="item.extra?.rankedTopicMerge" class="evidence-note">{{ locale.startsWith('zh')?'两平台同题榜单关联，仅代表话题同时上榜，不代表标题主张已被证实。各平台热度不可直接相加。':'Same topic across two rankings; this does not verify the claim, and platform heat metrics are not additive.' }}</p>
              <p v-if="item.extra?.editorial" class="evidence-note">{{ locale.startsWith('zh')?'原帖核验摘录（非自动时间线）':'Reviewed original post (not a live timeline)' }} · {{ formatFullTime(item.extra.editorial.verifiedAt) }}</p>
              <template v-if="item.extra?.socialPost">
                <p class="evidence-note" :title="item.extra.intake?.observedAt ? (locale.startsWith('zh')?'最近成功采集：':'Last collected: ')+formatFullTime(item.extra.intake.observedAt) : undefined">{{ locale.startsWith('zh')?'作者公开发言 · AI 摘要未经人工核验':'Author statement · AI summary not human verified' }}<template v-if="item.extra.intake?.stale"> · {{ locale.startsWith('zh')?'采集已过期':'Collection stale' }}</template></p>
                <ul v-if="!item.extra.socialPost.eventGroup && item.extra.aiAnalysis?.facts?.length"><li v-for="fact in item.extra.aiAnalysis.facts" :key="fact.quote"><span>{{ fact.text }}</span><q v-if="isOriginal(item,'reader')">{{ fact.quote }}</q></li></ul>
                <AiSocialEventSources v-if="item.extra.socialPost.eventGroup" :group="item.extra.socialPost.eventGroup" :locale="locale" inline :show-original="isOriginal(item,'reader')" />
                <p v-if="item.extra.socialPost.quoted" class="evidence-note"><a :href="item.extra.socialPost.quoted.url" target="_blank" rel="noopener noreferrer">{{ locale.startsWith('zh')?'引用原帖':'Quoted post' }} · @{{ item.extra.socialPost.quoted.username }} ↗</a></p>
              </template><p v-else-if="item.extra?.intake" class="evidence-note">{{ boardCopy.observing }}</p>
              <ul>
                <li v-for="entry in (item.extra?.socialPost?.eventGroup ? [] : visibleEvidence(item))" :key="entry.url">
                  <span>{{ evidenceSourceLabel(entry) }} · {{ evidenceCopy.roles[entry.role] }}</span>
                  <a :href="entry.url" target="_blank" rel="noopener noreferrer">{{ item.extra?.socialPost && !isOriginal(item,'reader')?(locale.startsWith('zh')?'阅读原帖':'Original post'):entry.title }} ↗</a><span v-if="entry.originalRank">#{{ entry.originalRank }}</span><span v-if="item.extra?.rankedTopicMerge && entry.metric?.kind==='heat'">{{ locale.startsWith('zh')?'热度':'Heat' }} {{ formatCompactNumber(entry.metric.value) }}</span><time v-if="entry.publishedAt">{{ formatFullTime(entry.publishedAt) }}</time>
                </li>
              </ul>
              <p v-if="!item.extra?.socialPost?.eventGroup && !visibleEvidence(item).length">{{ evidenceCopy.noEvidence }}</p>
              <dl v-if="!item.extra?.socialPost && Object.values(aiTimes(item)).some(Boolean)" class="evidence-times">
                <template v-for="(value, key) in aiTimes(item)" :key="key">
                  <template v-if="value">
                    <dt>{{ evidenceCopy.times[key] }}</dt>
                    <dd>{{ formatFullTime(key==='published' ? aiPublicationDisplayTime(item) : value) }}</dd>
                  </template>
                </template>
              </dl>
              <p v-if="aiOfficialReleaseReference(item)" class="evidence-note"><a :href="aiOfficialReleaseReference(item).url" target="_blank" rel="noopener noreferrer">{{ locale.startsWith('zh') ? '官方核验出处（不改变原始社区来源）' : 'Official reference (original community source preserved)' }} · {{ aiOfficialReleaseReference(item).publisher }} ↗</a></p>
              <p v-if="item.extra?.publicationEvidence" class="evidence-note"><a :href="aiSafeUrl(item.extra.publicationEvidence.url)" target="_blank" rel="noopener noreferrer">{{ evidenceCopy.times.published }} · {{ item.extra.publicationEvidence.format || 'RSS' }} ↗</a></p>
              <p v-if="Number(item.hot) > 0 && !readableMetric(item)" class="evidence-note">{{ evidenceCopy.unknownMetric }}</p>
                </div></AiEvidencePopover>
              </div>
            </div>

          </article>
          <div class="event-pagination"><span>{{ pageRangeText }}</span><n-pagination v-if="pageCount > 1" v-model:page="currentPage" :page-count="pageCount" :page-slot="5" size="small" @update:page="handlePageChange" /></div>
        </div>
        <div v-else-if="!loadError" class="topic-empty"><n-empty :description="activeTime !== 'all' ? (locale.startsWith('zh') ? '当前时间范围内暂无匹配内容，可扩大时间范围。' : 'No matches in this time range. Try a wider window.') : (hasFilters ? readerCopy.unavailable : readerCopy.emptyData)" /><button v-if="activeTime !== 'all'" type="button" class="reset-filter" @click="activeTime=activeTime==='24h' ? '72h' : 'all'">{{ locale.startsWith('zh') ? '扩大时间范围' : 'Expand time range' }}</button><button v-else-if="hasFilters" type="button" class="reset-filter" @click="resetFilters"><span aria-hidden="true">×</span> {{ ui.reset }}</button></div>
      </div>
      <aside v-if="wideLayout" class="ai-settings" :aria-label="readerCopy.settings">
        <h2>{{ readerCopy.settings }}</h2>
        <AiTopicControls v-model="reader" :copy="readerCopy" :filters="controlFilters" :associated-only="activeConfirmed" :associated-count="associatedEventCount" :associated-label="ui.resonance" :board-copy="boardCopy" :page="currentPage" :page-count="pageCount" @filter-change="updateControl" @update:associated-only="activeConfirmed=$event" @page-change="changeReadingPage" />
      </aside>
    </div>

    </div>
    <div v-if="undoSource" class="ai-undo-notice" role="status"><span>{{ boardCopy.sourceHidden.replace('{source}',sourceChannelLabel(undoSource)) }}</span><button ref="undoButtonRef" type="button" @click="undoHideSource">{{ boardCopy.undo }}</button><button type="button" class="undo-dismiss" :aria-label="boardCopy.dismiss" @click="undoSource=''">×</button></div>
  </section>
</template>
<script setup>
import { defineAsyncComponent } from "vue";
import { createAiTopicReads, scanAiDiscovery, readAiSnapshot, writeAiSnapshot, mergeAiServiceStatuses } from "@/utils/aiTopicLoading.mjs";
import { applyAiPublication } from "@/utils/aiPublications.mjs";
import AiServiceStatus from '@/components/AiServiceStatus.vue';
import AiTopicControls from "@/components/AiTopicControls.vue";
import AiTopicPageSettings from "@/components/AiTopicPageSettings.vue";
import ReadingSummary from "@/components/ReadingSummary.vue";
import ReadingCover from "@/components/ReadingCover.vue";
import AiSignalBadge from "@/components/AiSignalBadge.vue";
import {mergeAiSocialThreads,mergeAiVerifiedResetEvents} from '@/utils/aiSocialThreads.js';
import {conciseAiAuthorHeadline} from '@/utils/aiHeadlinePresentation.js';
import {mergeAiEvents} from '@/utils/aiEventMerge.js';
import {mergeAiVerifiedOfficialEvents} from '@/utils/aiVerifiedEventMerge.mjs';
import {localizedPublicationUrl,publicationCover} from "@/utils/sourcePublicationPresentation.js";
import AiEvidencePopover from '@/components/AiEvidencePopover.vue';
import AiMetric from "@/components/AiMetric.vue";
import AiSocialEventSources from "@/components/AiSocialEventSources.vue";
import { SettingTwo } from "@icon-park/vue-next";
import { AI_LANE_ORDER_STORAGE, normalizeAiLaneOrder, orderAiLanes, aiReadableMetric, aiAnchorPage, canPreserveAiReading, mergeAiSourcePreferences, aiTranslationText, restoreAiSource, aiEditorialEmphasis } from "@/utils/aiReadingPresentation.mjs";
import AiIntelligenceBoard from "@/components/AiIntelligenceBoard.vue";
import HoverMenuSelect from "@/components/HoverMenuSelect.vue";
import NativeSelectShell from "@/components/ui/NativeSelectShell.vue";
import { aiOfficialModelRelease } from '@/utils/aiReleaseSignals.mjs';
import { aiOfficialReleaseReference } from '@/utils/aiOfficialReleaseReferences.mjs';
import { evaluateAiQuality } from "@/utils/aiQuality.js";
import { AI_BOARD_LANES, buildAiBoard, aiReadingBoardGroup } from "@/utils/aiCuration.mjs";
import {AI_PRECISION_LANES,buildAiPrecisionBoard,aiPrecisionReadingLane} from "@/utils/aiPrecisionBoard.mjs";
import {normalizeAiVisibleLanes,swapAiVisibleLane,AI_VISIBLE_LANES_STORAGE} from "@/utils/aiVisibleLanes.mjs";
import { AI_BOARD_COPY } from "@/config/ai-board-copy.mjs";
import { AI_TOPICS, AI_BOARD_STORAGE, normalizeAiBoard, aiContentTopic, aiOriginalRank, aiCuratedScore, mergeAiArticles, aiCanonicalUrl } from "@/utils/aiContent.js";
import { translateReadableTitles, looksTranslatableSentence } from "@/utils/readableTitles";
import { restoreAiReadableTerms } from "@/utils/readableTranslationProtocol.mjs";
import { mergeAiRankedCrossPlatformTopics } from "@/utils/aiRankedTopicMerge.mjs";
import { canonicalProductHuntName } from "@/utils/aiProductIdentity.mjs";
import { formatCompactMetric } from "@/utils/compactMetric.js";
import { mainStore } from '@/store';
import { useThemeVars } from "naive-ui";
import { AI_WORKSPACE_COPY } from "@/config/ai-workspace-copy.mjs";
import { AI_LENSES, aiMatchesLens, AI_READER_DEFAULTS, AI_READER_STORAGE, AI_READER_WINDOWS, aiReadingInWindow, normalizeAiReader, readAiQuery, buildAiQuery, aiItemKey } from "@/utils/aiWorkspace.mjs";
import { getHotListsWithFallback } from "@/api";
import { aiMeta, aiPrimarySource, aiSafeUrl, aiEvidence, aiAssociatedSourceCount, aiSourceRole, aiTimes, aiFeedState, aiCompare, aiTime } from "@/utils/aiEvidence.mjs";
import {aiPublicationDisplayTime} from '@/utils/aiTime.js';
import {calendarPublicationDate,formatCalendarPublicationDate} from '@/utils/publicationDates.js';
import { AI_EVIDENCE_COPY } from "@/config/ai-evidence-copy.mjs";
import { AI_TOPIC_METADATA } from "@/config/site-metadata.mjs";
import { DATA_REFRESH_EVENT } from "@/utils/dataRefresh";
import { getLocaleFromRoute, normalizeLocale, withLocalePrefix } from "@/utils/locale";
import { getSourceLabel } from "@/utils/sourceLabels";
import { getSourceLogo, getSourceLogoFallback } from "@/utils/sourceLogos";
import {reviewedTranslationFor} from '@/utils/reviewedTranslation';
import { useRoute, useRouter } from "vue-router";
import { useContextSearch } from "@/composables/useContextSearch";

const route = useRoute();
const router = useRouter();
const result = ref(null);
const loading = ref(false);
const loadError = ref("");
const searchQuery = useContextSearch(route, router);
const queryState = computed(() => readAiQuery(route.query));
const setConditions = (patch, resetPage = true) => void router.replace({
  path: route.path, query: buildAiQuery(route.query, { ...(resetPage ? { page: 1 } : {}), ...patch }), hash: route.hash,
});
const conditionModel = key => computed({
  get: () => queryState.value[key], set: value => setConditions({ [key]: value }, key !== "page"),
});
const activeLens = conditionModel("lens");
const activeBoard = conditionModel("board");
const activeCategory = conditionModel("category");
const activeSource = conditionModel("source");
const activeSort = conditionModel("sort");
const activeTime = conditionModel("time");
const activeConfirmed = conditionModel("confirmed");
const currentPage = conditionModel("page");
const AiModelExplorer=defineAsyncComponent(()=>import('@/components/AiModelExplorer.vue'));
const modelExplorerRef=ref(null);
const modelView=computed(()=>route.query.panel==='models');
const modelReaderActive=ref(false);
const monitorView=computed(()=>route.query.panel==='monitor');
const AiRadarMonitor=defineAsyncComponent(()=>import('@/components/AiRadarMonitor.vue'));
const setPanel=async panel=>{const anchor=captureReadingAnchor();const query={...route.query};if(panel==='models' || panel==='monitor')query.panel=panel;else {delete query.panel;delete query.model;}await router.replace({path:route.path,query,hash:route.hash});await nextTick();restoreReadingAnchor(anchor);};
const pageSize = conditionModel("size");
const PAGE_SIZE_VALUES = [20, 30, 50, 100];
const topicRef = ref(null);
const readerContainerRef = ref(null);
const wideLayout = ref(false);
const settingsOpen = ref(false);
const settingsPopupRef = ref(null);
const handleSettingsShow = async (show) => {
  if (!show) return;
  await nextTick();
  settingsPopupRef.value?.querySelector("select, input, button")?.focus({ preventScroll: true });
};
const closeSettings = async () => {
  settingsOpen.value = false;
  await nextTick();
  topicRef.value?.querySelector(".ai-settings-trigger")?.focus({ preventScroll: true });
};
const pageSettingsOpen = ref(false);
const pageSettingsRef = ref(null);
const focusPageSettings = () => pageSettingsRef.value?.querySelector('input,button')?.focus({preventScroll:true});
const openPageSettings = async () => {pageSettingsOpen.value=true;await nextTick();focusPageSettings();};
const returnPageSettingsFocus = () => topicRef.value?.querySelector('.ai-page-settings-trigger')?.focus({preventScroll:true});
const laneOrder = ref((()=>{try{return normalizeAiLaneOrder(JSON.parse(localStorage.getItem(AI_LANE_ORDER_STORAGE)));}catch{return normalizeAiLaneOrder(null);}})());
const visibleLaneKeys=ref((()=>{try{return normalizeAiVisibleLanes(JSON.parse(localStorage.getItem(AI_VISIBLE_LANES_STORAGE)));}catch{return normalizeAiVisibleLanes(null);}})());
watch(visibleLaneKeys,value=>{try{localStorage.setItem(AI_VISIBLE_LANES_STORAGE,JSON.stringify(value));}catch{/* Preference storage optional. */}});
const replaceVisibleLane=({previous,next})=>{visibleLaneKeys.value=swapAiVisibleLane(visibleLaneKeys.value,previous,next);};
watch(laneOrder,value=>{try{localStorage.setItem(AI_LANE_ORDER_STORAGE,JSON.stringify(value));}catch{/* Optional storage. */}});
const reorderLanes = keys => {visibleLaneKeys.value=normalizeAiVisibleLanes(keys);laneOrder.value=normalizeAiLaneOrder([...keys,...laneOrder.value]);};
const READER_FILTER_STORAGE = "wuaihot-ai-reader-filters-v1";
const SOURCE_PREF_STORAGE = "wuaihot-ai-source-preferences-v2";
const readerPreference = ref((() => {
  try {
    const saved=JSON.parse(localStorage.getItem(SOURCE_PREF_STORAGE));
    if(saved)return normalizeAiBoard(saved);
    const oldBoard=normalizeAiBoard(JSON.parse(localStorage.getItem(AI_BOARD_STORAGE)));
    const oldReader=normalizeAiBoard(JSON.parse(localStorage.getItem(READER_FILTER_STORAGE)) || oldBoard);
    return normalizeAiBoard(mergeAiSourcePreferences(oldBoard,oldReader));
  }catch{return normalizeAiBoard(null);}
})());
// One exclusion policy for the whole topic; temporary reader filters remain independent.
const boardPreference = readerPreference;
watch(readerPreference,value=>{try {
  const text=JSON.stringify(normalizeAiBoard(value));
  localStorage.setItem(SOURCE_PREF_STORAGE,text);
  localStorage.setItem(READER_FILTER_STORAGE,text);
  localStorage.setItem(AI_BOARD_STORAGE,text);
}catch{/* Optional storage. */}}, {deep:true});
const excludedSources = computed(()=>new Set(readerPreference.value.excluded));
const undoSource=ref(''),undoButtonRef=ref(null);
const toggleSource = source => {
  if(!source)return;const excluded=new Set(readerPreference.value.excluded);
  if(excluded.has(source)){excluded.delete(source);if(undoSource.value===source)undoSource.value='';}
  else{excluded.add(source);undoSource.value=source;}
  readerPreference.value={...readerPreference.value,excluded:[...excluded]};
};
const hideReadingSource=async source=>{toggleSource(source);await nextTick();undoButtonRef.value?.focus({preventScroll:true});};
const undoHideSource=()=>{readerPreference.value=restoreAiSource(readerPreference.value,undoSource.value);undoSource.value='';nextTick(()=>eventListRef.value?.querySelector('.ai-feed-heading')?.focus({preventScroll:true}));};
const restoreSources = () => {readerPreference.value={...readerPreference.value,excluded:[]};undoSource.value='';};
const discoveryApplied = ref([]);
const discoveryFeeds = ref([]);
const discoveryCoverage = ref({});
const discoveryError = ref("");
const toolStatuses = ref([]);
const statusesLoading=ref(true),statusCheckedAt=ref(null),supplementing=ref(false),cachedSnapshot=ref(false);
const toolFeeds = ref([]);
const serviceStatuses = computed(()=>[
  {source:'openai-status',name:'OpenAI',url:'https://status.openai.com/'},
  {source:'claude-status',name:'Claude',url:'https://status.claude.com/'},
].map(service=>{const status=toolStatuses.value.find(status=>status.source===service.source);return {...status,...service,indicator:status?.indicator || 'unknown',description:status?.description || boardCopy.value.statusUnknown};}));
const translationMap = ref({});
const displayLanguage=ref((()=>{try{const x=JSON.parse(localStorage.getItem('wuaihot-ai-language-display-v1'));return {page:x?.page==='original'?'original':'translated',board:['original','translated'].includes(x?.board)?x.board:'inherit',reader:['original','translated'].includes(x?.reader)?x.reader:'inherit'};}catch{return {page:'translated',board:'inherit',reader:'inherit'};}})());
const itemLanguage=ref({});
watch(displayLanguage,value=>{try{localStorage.setItem('wuaihot-ai-language-display-v1',JSON.stringify(value));}catch{}},{deep:true});
const isOriginal=(item,area)=>itemLanguage.value[area+'|'+aiItemKey(item)]!==undefined?itemLanguage.value[area+'|'+aiItemKey(item)]:(displayLanguage.value[area]==='inherit'?displayLanguage.value.page:displayLanguage.value[area])==='original';
const translatableItem=item=>canonicalProductHuntName(item)
  ?/[a-z]{3}/i.test(item.originalDesc || item.desc || '')
  :/[a-z]{3}/i.test(item.originalTitle || item.title || '') || /[a-z]{3}/i.test(item.originalDesc || item.desc || '');
const toggleItemLanguage=(item,area)=>{itemLanguage.value={...itemLanguage.value,[area+'|'+aiItemKey(item)]:!isOriginal(item,area)};if(!isOriginal(item,area))void translateVisible(true);};
const releaseLabel=item=>aiOfficialModelRelease(item)?(locale.value.startsWith('zh')?'官方发布':'Official release'):'';
const translating = ref(false);
const translationFailed = ref(false);
const failedCovers = ref(new Set());
const reader = ref((() => {
  try { return normalizeAiReader(JSON.parse(localStorage.getItem(AI_READER_STORAGE))); }
  catch { return { ...AI_READER_DEFAULTS }; }
})());
watch(reader, value => { try { localStorage.setItem(AI_READER_STORAGE, JSON.stringify(value)); } catch { /* Storage is optional. */ } }, { deep: true });
const theme = useThemeVars();
const topicStore = mainStore();
const themeStyle = computed(() => ({
  "--ai-text": theme.value.textColor1, "--ai-secondary": theme.value.textColor2,
  "--ai-muted": theme.value.textColor3, "--ai-border": theme.value.borderColor,
  "--ai-panel": theme.value.cardColor, "--ai-hover": theme.value.hoverColor,
  "--ai-meta": topicStore.siteTheme==='dark'?'#9699a1':'#6b7076',
  "--ai-danger": theme.value.errorColor, "--ai-action": topicStore.siteTheme==='dark'?'#83afff':'#315cb5',
}));
const readerCopy = computed(() => AI_WORKSPACE_COPY[locale.value] || AI_WORKSPACE_COPY["zh-CN"]);
const lensOptions = computed(() => AI_LENSES.map(value => ({
  value, label: readerCopy.value.lenses[value], count: data.value.filter(item => aiMatchesLens(item, value)).length,
})));
const hasUsableCover = item => reader.value.images && aiSafeUrl(item.cover) && !failedCovers.value.has(aiItemKey(item));
const eventListRef = ref(null);
const locale = computed(() => normalizeLocale(getLocaleFromRoute(route)));
const MODEL_WORKSPACE_IDENTITY = {
  'zh-CN': { title: '模型实力榜', description: '独立能力评测、真实使用偏好与跨榜位置；四栏可自由切换、拖拽排序。' },
  'zh-TW': { title: '模型實力榜', description: '獨立能力評測、真實使用偏好與跨榜位置；四欄可自由切換、拖曳排序。' },
  en: { title: 'AI Model Rankings', description: 'Independent benchmarks, user preferences and cross-board position. Customize and reorder all four boards.' },
  ja: { title: 'AIモデル実力ランキング', description: '能力評価・ユーザーの選好・複数ランキングでの順位。4つのボードを並べ替えられます。' },
  ko: { title: 'AI 모델 성능 순위', description: '성능 평가, 사용자 선호도 및 여러 순위의 위치를 비교하고 네 개의 보드를 재배치하세요.' },
};
const modelIdentity = computed(() => MODEL_WORKSPACE_IDENTITY[locale.value] || MODEL_WORKSPACE_IDENTITY.en);
const copy = computed(
  () => AI_TOPIC_METADATA[locale.value] || AI_TOPIC_METADATA["zh-CN"],
);
const publicationIndex = computed(() => new Map((result.value?.publications || []).map(entry => [aiCanonicalUrl(entry.url), entry])));
const rawData = computed(() => {
  const rows=mergeAiArticles(Array.isArray(result.value?.data)?result.value.data:[],discoveryApplied.value)
    .map(item=>({...applyAiPublication(item,publicationIndex.value),cover:publicationCover(item)}));
  // The AI Radar receives raw ai-tools social records, while the dedicated X
  // leaderboard performs verified reset grouping in its API. Use the exact
  // same evidence-bound aggregation here; never infer completion from a title.
  const social=mergeAiVerifiedResetEvents(mergeAiSocialThreads(rows),locale.value);
  return mergeAiRankedCrossPlatformTopics(mergeAiVerifiedOfficialEvents(mergeAiEvents(social)),{discovery:discoveryApplied.value});
});
const translatedItem = (item,area='reader') => {
  const productName=canonicalProductHuntName(item);
  const originalTitle=aiTranslationText(productName || item.originalTitle || item.title), originalDesc=aiTranslationText(item.originalDesc || item.desc);
  if(isOriginal(item,area))return {...item,title:originalTitle,desc:originalDesc,originalTitle,originalDesc};
  // The grouping result owns the newest, locale-specific event status. Never
  // reapply the root Day N notice's older 'awaiting reset' translation.
  if(item.extra?.socialPost?.eventGroup?.kind==='verified-day-reset')return item;
  const edited=reviewedTranslationFor(item,locale.value);
  const title=edited?.title || translationMap.value[locale.value+"|"+originalTitle], desc=edited?.desc || translationMap.value[locale.value+"|"+originalDesc];
  const repair=(original,value)=>locale.value.startsWith('zh')?restoreAiReadableTerms(original,value):value;
  const displayTitle=productName || (item.extra?.modelRepository ? item.title : repair(originalTitle,title || item.title)),displayDesc=repair(originalDesc,desc || item.desc);
  const conciseTitle=conciseAiAuthorHeadline(item,displayTitle,locale.value);
  return {...item,...(conciseTitle?{title:conciseTitle,originalTitle}:{}),...(displayDesc?{desc:displayDesc,originalDesc}:{})};
};
const data = computed(() => rawData.value);
const qualityByKey = computed(()=>new Map(rawData.value.map(item=>[aiItemKey(item),evaluateAiQuality(item)])));
const itemQuality = item => qualityByKey.value.get(aiItemKey(item)) || evaluateAiQuality(item);
const qualityRejected = computed(()=>rawData.value.filter(item=>!itemQuality(item).eligible));
const qualityCounts = computed(()=>Object.entries(qualityRejected.value.reduce((counts,item)=>{const reason=itemQuality(item).reasons[0];counts[reason]=(counts[reason] || 0)+1;return counts;},{})));
const visibleBoardKeys = ref(null);
const boardCopy = computed(() => AI_BOARD_COPY[locale.value] || AI_BOARD_COPY["zh-CN"]);
const dashboard = computed(() => result.value?.dashboard || null);
const sourceFeeds = computed(() => [...(Array.isArray(dashboard.value?.feeds) ? dashboard.value.feeds : []),...toolFeeds.value]);
const healthyFeedCount = computed(() => sourceFeeds.value.filter((feed) => aiFeedState(feed) === "ok").length);
const associatedEventCount = computed(() => data.value.filter((item) => associatedSourceCount(item) > 1).length);
const severeDegraded = computed(() => {
  const failed = Number(dashboard.value?.failedSourceCount || 0);
  const healthy = Number(dashboard.value?.sourceCount || 0);
  return failed >= 3 || (failed > 0 && healthy < 12);
});

const UI_COPY = {
  "zh-CN": {
    events: "条记录",
    sources: "个来源",
    search: "搜索 AI 事件",
    searchPlaceholder: "搜索模型、公司、项目、关键词…",
    matches: "条结果",
    resonance: "多来源条目",
    refresh: "刷新",
    filters: "AI 事件筛选",
    perPage: "每页",
    category: "类型",
    source: "来源",
    sort: "排序",
    smart: "聚合排序",
    resonanceFirst: "多源优先",
    latest: "发布时间",
    reset: "清除筛选",
    all: "全部",
    sourcesShort: "个来源",
    sourceResonance: "个关联来源",
    open: "查看来源",
    starsToday: "Star 今日",
    points: "热度",
    updated: "更新",
    currentTrend: "当前趋势",
    officialRelease: "官方发布",
    developerBreakout: "开发者爆火",
    featured: {
      focus: "关注信号",
      modelProduct: "模型与产品",
      breakout: "开发者社区",
    },
    categories: {
      major: "重大事件",
      model: "模型",
      product: "产品",
      research: "研究",
      developer: "开发者",
      safety: "安全治理",
      business: "商业",
      other: "其它",
    },
  },
  en: {
    events: "records",
    sources: "sources",
    search: "Search AI events",
    searchPlaceholder: "Search models, companies, projects…",
    matches: "results",
    resonance: "Multi-source items",
    refresh: "Refresh",
    filters: "AI event filters",
    perPage: "Per page",
    category: "Type",
    source: "Source",
    sort: "Sort",
    smart: "Aggregate order",
    resonanceFirst: "Multi-source first",
    latest: "Publication time",
    reset: "Reset",
    all: "All",
    sourcesShort: "sources",
    sourceResonance: "associated sources",
    open: "Open source",
    starsToday: "stars today",
    points: "points",
    updated: "Updated",
    currentTrend: "Trending now",
    officialRelease: "Official release",
    developerBreakout: "Developer breakout",
    featured: {
      focus: "Signals to explore",
      modelProduct: "Models & products",
      breakout: "Developer community",
    },
    categories: {
      major: "Major",
      model: "Model",
      product: "Product",
      research: "Research",
      developer: "Developer",
      safety: "Safety",
      business: "Business",
      other: "Other",
    },
  },
  "zh-TW": {
    events: "筆紀錄",
    sources: "個來源",
    search: "搜尋 AI 事件",
    searchPlaceholder: "搜尋模型、公司、專案、關鍵字…",
    matches: "筆結果",
    resonance: "多來源條目",
    refresh: "重新整理",
    filters: "AI 事件篩選",
    perPage: "每頁",
    category: "類型",
    source: "來源",
    sort: "排序",
    smart: "彙整排序",
    resonanceFirst: "多源優先",
    latest: "發布時間",
    reset: "清除篩選",
    all: "全部",
    sourcesShort: "個來源",
    sourceResonance: "個關聯來源",
    open: "查看來源",
    starsToday: "Star 今日",
    points: "熱度",
    updated: "更新",
    currentTrend: "目前趨勢",
    officialRelease: "官方發布",
    developerBreakout: "開發者爆紅",
    featured: {
      focus: "關注訊號",
      modelProduct: "模型與產品",
      breakout: "開發者社群",
    },
    categories: {
      major: "重大事件",
      model: "模型",
      product: "產品",
      research: "研究",
      developer: "開發者",
      safety: "安全治理",
      business: "商業",
      other: "其他",
    },
  },
  ja: {
    events: "件",
    sources: "情報源",
    search: "AIイベントを検索",
    searchPlaceholder: "モデル・企業・プロジェクトを検索…",
    matches: "件",
    resonance: "複数情報源の項目",
    refresh: "更新",
    filters: "AIイベントフィルター",
    perPage: "件数",
    category: "種類",
    source: "情報源",
    sort: "並び順",
    smart: "集計順",
    resonanceFirst: "複数ソース優先",
    latest: "公開時刻",
    reset: "解除",
    all: "すべて",
    sourcesShort: "情報源",
    sourceResonance: "関連情報源",
    open: "情報源を見る",
    starsToday: "Star 本日",
    points: "人気",
    updated: "更新",
    currentTrend: "現在のトレンド",
    officialRelease: "公式リリース",
    developerBreakout: "開発者急上昇",
    featured: {
      focus: "注目信号",
      modelProduct: "モデル・プロダクト",
      breakout: "開発者コミュニティ",
    },
    categories: {
      major: "重大",
      model: "モデル",
      product: "プロダクト",
      research: "研究",
      developer: "開発者",
      safety: "安全",
      business: "ビジネス",
      other: "その他",
    },
  },
  ko: {
    events: "개 기록",
    sources: "개 출처",
    search: "AI 이벤트 검색",
    searchPlaceholder: "모델, 기업, 프로젝트 검색…",
    matches: "개 결과",
    resonance: "다중 출처 항목",
    refresh: "새로고침",
    filters: "AI 이벤트 필터",
    perPage: "페이지당",
    category: "유형",
    source: "출처",
    sort: "정렬",
    smart: "집계 순서",
    resonanceFirst: "다중 출처 우선",
    latest: "게시 시각",
    reset: "초기화",
    all: "전체",
    sourcesShort: "개 출처",
    sourceResonance: "관련 출처",
    open: "출처 보기",
    starsToday: "오늘 Star",
    points: "인기",
    updated: "업데이트",
    currentTrend: "현재 트렌드",
    officialRelease: "공식 출시",
    developerBreakout: "개발자 급상승",
    featured: {
      focus: "관심 신호",
      modelProduct: "모델 · 제품",
      breakout: "개발자 커뮤니티",
    },
    categories: {
      major: "주요 사건",
      model: "모델",
      product: "제품",
      research: "연구",
      developer: "개발자",
      safety: "안전",
      business: "비즈니스",
      other: "기타",
    },
  },
};
const ui = computed(() => UI_COPY[locale.value] || UI_COPY["zh-CN"]);
const evidenceCopy = computed(() => AI_EVIDENCE_COPY[locale.value] || AI_EVIDENCE_COPY["zh-CN"]);
const CATEGORY_ORDER = [...AI_TOPICS,"other"];
const signalMeta = aiMeta;
const signalKind = aiContentTopic;
const visibleEvidence = item => aiEvidence(item).filter(entry=>!excludedSources.value.has(entry.source));
const associatedSourceCount = item => new Set(visibleEvidence(item).map(entry=>entry.source).filter(Boolean)).size;
const primarySource = aiPrimarySource;
const signalSources = (item) => visibleEvidence(item).map((entry) => entry.source);
const sourceChannelLabel = (source, fallback) => source === "huggingface-blog"
  ? "Hugging Face Blog" : getSourceLabel(source, locale.value, fallback || source);
const sourceLabel = (item) => primarySource(item)
  ? sourceChannelLabel(primarySource(item), signalMeta(item).primarySourceLabel)
  : evidenceCopy.value.unknownSource;
const evidenceSourceLabel = (entry) => entry.source
  ? sourceChannelLabel(entry.source, entry.sourceLabel)
  : evidenceCopy.value.unknownSource;
const kindLabel = (kind) => boardCopy.value.topics[kind] || ui.value.categories[kind] || kind;
const textFor = (item) =>
  [item.title, item.originalTitle, translatedItem(item).title, translatedItem(item).desc, item.desc, item.author, ...aiEvidence(item).flatMap((entry) =>
    [entry.title, evidenceSourceLabel(entry)])].filter(Boolean).join(" ").toLowerCase();

const BREAKOUT_SOURCES = new Set([
  "github-ai-trending",
  "reddit-localllama",
  "hackernews-ai",
  "producthunt-ai",
]);
const isBreakoutSignal = (item) => BREAKOUT_SOURCES.has(primarySource(item));
const isFocusSignal = (item) =>
  associatedSourceCount(item) > 1 ||
  (aiTimes(item).published && Date.now() - aiTimes(item).published < 86400000 &&
    signalKind(item) !== "other");
const isModelProductSignal = (item) =>
  ["models", "products"].includes(signalKind(item));
const categoryOptions = computed(() => {
  const options = [{ value: "all", label: ui.value.all, count: baseFilteredData.value.length },
    ...CATEGORY_ORDER.map(kind => ({ value: kind, label: kindLabel(kind), count: baseFilteredData.value.filter(item => signalKind(item) === kind).length }))];
  if (!options.some(option => option.value === activeCategory.value)) options.push({
    value: activeCategory.value, label: kindLabel(activeCategory.value), count: 0,
  });
  return options;
});
const sourceOptions = computed(() => {
  const feeds=new Map();
  for(const feed of [...sourceFeeds.value,...discoveryFeeds.value]) {const previous=feeds.get(feed.source);if(!previous || (previous.status!=="ok" && feed.status==="ok"))feeds.set(feed.source,feed);}
  for(const item of rawData.value)if(primarySource(item)&&!feeds.has(primarySource(item)))feeds.set(primarySource(item),{source:primarySource(item),label:signalMeta(item).primarySourceLabel,status:"ok",count:1});
  const options = [{ value: "all", label: ui.value.all, count: sourceCandidates.value.length },
    ...[...feeds.values()].filter(feed=>rawData.value.some(item=>aiEvidence(item).some(entry=>entry.source===feed.source)) || excludedSources.value.has(feed.source) || boardPreference.value.excluded.includes(feed.source) || activeSource.value===feed.source).map(feed => ({
      value: feed.source, label: sourceChannelLabel(feed.source, feed.label),
      count: sourceCandidates.value.filter(item => signalSources(item).includes(feed.source)).length,
      status: aiFeedState(feed), detail: evidenceCopy.value.states[aiFeedState(feed)],
    }))];
  if (!options.some(option => option.value === activeSource.value)) options.push({
    value: activeSource.value, label: sourceChannelLabel(activeSource.value), count: 0,
  });
  return options;
});
const sortOptions = computed(() => [
  { value: "smart", label: ui.value.smart },
  { value: "resonance", label: ui.value.resonanceFirst },
  { value: "latest", label: ui.value.latest },
]);
const pageSizeOptions = computed(() =>
  PAGE_SIZE_VALUES.map((value) => ({ value, label: String(value) })),
);
const boardLanguageOptions = computed(() => locale.value.startsWith('zh')
 ? [{value:'inherit',label:'跟随全页'},{value:'translated',label:'看板译文'},{value:'original',label:'看板原文'}]
 : [{value:'inherit',label:'Follow page'},{value:'translated',label:'Translated board'},{value:'original',label:'Original board'}]);
const readerLanguageOptions = computed(() => locale.value.startsWith('zh')
 ? [{value:'inherit',label:'跟随全页'},{value:'translated',label:'阅读译文'},{value:'original',label:'阅读原文'}]
 : [{value:'inherit',label:'Follow page'},{value:'translated',label:'Translated feed'},{value:'original',label:'Original feed'}]);
const readingTimeOptions = computed(() => AI_READER_WINDOWS.map(value => ({
  value, label: ({ "24h": locale.value.startsWith("zh") ? "近1天" : "Last 1 day", "72h": locale.value.startsWith("zh") ? "近3天" : "Last 3 days", "7d": locale.value.startsWith("zh") ? "近7天" : "Last 7 days", all: locale.value.startsWith("zh") ? "全部时间" : "All dates" })[value],
})));

const matchesReadingCategory = item => {
  if(activeBoard.value!=="all" && (activeBoard.value==="technical" ? !["building","research"].includes(aiPrecisionReadingLane(item)) : aiPrecisionReadingLane(item)!==activeBoard.value))return false;
  if(activeCategory.value==="all")return true;
  if(activeCategory.value==="focus")return isFocusSignal(item);
  if(activeCategory.value==="model-product")return isModelProductSignal(item);
  if(activeCategory.value==="breakout")return isBreakoutSignal(item);
  return signalKind(item)===activeCategory.value;
};
const readingCandidates = computed(() => {
  const query=searchQuery.value.trim().toLowerCase();
  return data.value.filter(item=>!excludedSources.value.has(primarySource(item)) &&
    (!readerPreference.value.refined||itemQuality(item).eligible) && aiMatchesLens(item,activeLens.value) &&
    aiReadingInWindow(item,activeTime.value) &&
    (!query||textFor(item).includes(query)) && (!activeConfirmed.value||associatedSourceCount(item)>=2));
});
const sourceCandidates = computed(()=>readingCandidates.value.filter(matchesReadingCategory));
const baseFilteredData = computed(()=>readingCandidates.value.filter(item=>activeSource.value==="all"||signalSources(item).includes(activeSource.value)));
const aiReadingLatestTime=item=>{
  const groupTime=aiTime(item.extra?.socialPost?.eventGroup?.latestAt);
  return groupTime??aiTimes(item).published??0;
};
const filteredData = computed(()=>baseFilteredData.value.filter(matchesReadingCategory).slice().sort((a,b)=>activeSort.value==='latest'
  ?aiReadingLatestTime(b)-aiReadingLatestTime(a)||aiCompare(a,b,'latest')
  :activeSort.value==='smart'?(Number(aiOfficialModelRelease(b))-Number(aiOfficialModelRelease(a)))*42+(itemQuality(b).score-itemQuality(a).score)*0.6+aiCuratedScore(b)-aiCuratedScore(a):aiCompare(a,b,activeSort.value)));
const managedSources = computed(()=>sourceOptions.value.filter(option=>option.value!=="all" && (option.count>0 || readerPreference.value.excluded.includes(option.value) || boardPreference.value.excluded.includes(option.value) || activeSource.value===option.value)).map(option=>({...option,logo:getSourceLogo(option.value)})));
const rankLabel = item => {
  const rank=aiOriginalRank(item);if(!rank)return "";
  const ranked=item.extra?.discovery?.dataKind==="ranking" || ["github-ai-trending","hackernews-ai","reddit-localllama","hf-models","producthunt-ai","sina-ai"].includes(primarySource(item));
  return (ranked?boardCopy.value.rank:boardCopy.value.order)+" #"+rank;
};
const visibleDiscovery = item => item.extra?.discovery && !excludedSources.value.has(item.extra.discovery.source);
const discoveryPath = item => withLocalePrefix(locale.value,"/rank/"+encodeURIComponent(item.extra.discovery.source)+(item.extra.discovery.variant?"/"+encodeURIComponent(item.extra.discovery.variant):""));
const curatedBoard = computed(()=>{
  const lanes=buildAiPrecisionBoard(rawData.value,{feeds:[...sourceFeeds.value,...discoveryFeeds.value],excluded:boardPreference.value.excluded,limit:12});
  return AI_PRECISION_LANES.map(key=>lanes.find(lane=>lane.key===key) || {key,count:0,items:[]});
});
const boardLanes = computed(()=>orderAiLanes(curatedBoard.value,laneOrder.value).map(lane=>({
  ...lane,label:boardCopy.value.lanes[lane.key].title,subtitle:boardCopy.value.lanes[lane.key].task,
  items:lane.items.map(({item,evidence})=>{
    const display=translatedItem(item,'board');
    const main=evidence.reasons[0],replace=(template,values)=>template.replace(/\{(\w+)\}/g,(_,key)=>values[key] ?? '');
    // A merged cross-ranking event retains the Sina AI primary rank; a
    // discovery alias such as sina/all must not hijack its board evidence.
    const primaryRank=item.extra?.rankedTopicMerge?.evidence?.find(entry=>entry.source===primarySource(item));
    const reason=replace(main.code==='model-release'?releaseLabel(item):boardCopy.value.reasons[main.code],{rank:primaryRank?.rank??main.rank,value:formatCompactNumber(main.value)});
    const rank=evidence.reasons.find(r=>r.code==='ranked');
    const ranking=primaryRank ? primaryRank.label+' #'+primaryRank.rank : rank ? sourceChannelLabel(rank.source)+(rank.label?' · '+rank.label:'')+' #'+rank.rank : '';
    return {key:aiItemKey(item),raw:item,isOriginal:isOriginal(item,'board'),translatable:translatableItem(item),url:localizedPublicationUrl(aiSafeUrl(item.url),locale.value),title:display.title,originalTitle:item.originalTitle || item.title,
      source:primarySource(item),sourceLabel:sourceLabel(item),logo:getSourceLogo(primarySource(item)),reason,reasonCode:main.code,
      crossPlatformEvidence:(item.extra?.rankedTopicMerge?.evidence||[]).map(entry=>({...entry,
        metricText:entry.metric?.kind==='heat'
          ?(locale.value.startsWith('zh')?(locale.value==='zh-TW'?'熱度 ':'热度 '):'Heat ')+formatCompactNumber(entry.metric.value):''})),
      sourceAssociationLabel:item.extra?.rankedTopicMerge ? (locale.value.startsWith('zh')?'2 平台同题':'Same topic · 2 platforms') : '',
      crossPlatformNote:item.extra?.rankedTopicMerge ? (locale.value.startsWith('zh')?'两榜同题关联，不代表标题主张已获核实，也不累加不同平台热度。':'Same-topic association does not verify the claim or combine heat metrics.') : '',
      context:['github-ai-trending','producthunt-ai'].includes(primarySource(item)) ? display.desc : '',originalDesc:item.originalDesc || item.desc || '',
      release:['codex-releases','claude-code-releases'].includes(primarySource(item)),
      new:evidence.reasons.some(r=>r.code==='new'),metric:readableMetric(item),ranking,
      published:evidence.published,date:evidence.published ? formatUpdated(aiPublicationDisplayTime(item)) : '',fullDate:evidence.published ? formatFullTime(aiPublicationDisplayTime(item)) : '',
      updated:evidence.updated ? formatUpdated(evidence.updated) : '',snapshot:evidence.snapshot?.valid ? formatUpdated(evidence.snapshot.time) : '',
      rankingUrl:primaryRank ? withLocalePrefix(locale.value,primaryRank.rankingUrl) : rank ? withLocalePrefix(locale.value,'/rank/'+encodeURIComponent(rank.source)+(rank.variant?'/'+encodeURIComponent(rank.variant):'')) : '',
      emphasis:aiEditorialEmphasis(item) || aiOfficialModelRelease(item),badgeKind:aiOfficialModelRelease(item)?'official':aiEditorialEmphasis(item)?'quota':'new',emphasisLabel:aiOfficialModelRelease(item)?releaseLabel(item):'',editorial:item.extra?.editorial?.reviewState==='original-checked',summary:display.desc || '',
      relatedUrl:aiSafeUrl(item.extra?.editorial?.relatedUrl),officialReference:aiOfficialReleaseReference(item),
    };
  })
})));
const visibleBoardLanes=computed(()=>visibleLaneKeys.value.map(key=>boardLanes.value.find(lane=>lane.key===key)).filter(Boolean));
const focusReading = () => nextTick(()=>{ eventListRef.value?.querySelector(".ai-feed-toolbar")?.scrollIntoView({block:"start",behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"}); eventListRef.value?.querySelector(".ai-feed-heading")?.focus({preventScroll:true}); });
const selectReadingTopic = async key => { await router.replace({path:route.path,query:buildAiQuery(route.query,{category:key,board:"all",page:1}),hash:route.hash}); focusReading(); };
const selectBoardTask = async key => {
  const query=buildAiQuery(route.query,{board:key,category:"all",source:"all",lens:"all",confirmed:false,time:"72h",page:1});
  delete query.q;
  await router.replace({path:route.path,query,hash:route.hash}); focusReading();
};
const rankingShortcuts = computed(()=>[
  {source:"ai-official-intake",label:sourceChannelLabel("ai-official-intake"),path:"/rank/ai-official-intake/all"},
  {source:"qwen-model-updates",label:"千问平台官方模型发布",path:"/topic/ai?source=qwen-model-updates&time=7d"},
  {source:"ai-model-board",label:sourceChannelLabel("ai-model-board"),path:"/rank/ai-model-board/consensus"},
  {source:"livebench",label:"LiveBench",path:"/rank/livebench/livebench"},
  {source:"sina-ai",label:sourceChannelLabel("sina-ai"),path:"/rank/sina-ai"},
  {source:"arena-ai",label:"Arena",path:"/rank/arena-ai/text"},
  {source:"artificialanalysis",label:"Artificial Analysis",path:"/rank/artificialanalysis/models"},
  {source:"openrouter-rankings",label:"OpenRouter",path:"/rank/openrouter-rankings/models-week"},
  {source:"designarena",label:"DesignArena",path:"/rank/designarena/fullstack"},
  {source:"huggingface",label:"Hugging Face",path:"/rank/huggingface/models"},
  {source:"github",label:"GitHub",path:"/rank/github"},
  {source:"hackernews",label:"Hacker News",path:"/rank/hackernews"},
].map(link=>({...link,logo:getSourceLogo(link.source),path:withLocalePrefix(locale.value,link.path)})));
const discoveryFailures = computed(()=>discoveryFeeds.value.filter(feed=>feed.status==="failed").length);
const pageCount = computed(() =>
  Math.max(1, Math.ceil(filteredData.value.length / pageSize.value)),
);
const pageStart = computed(() => (currentPage.value - 1) * pageSize.value);
const pagedData = computed(() =>
  filteredData.value.slice(pageStart.value, pageStart.value + pageSize.value).map(item=>translatedItem(item,'reader')),
);
const pageRangeText = computed(() => {
  if (!filteredData.value.length) return "0 / 0";
  const start = pageStart.value + 1;
  const end = Math.min(
    pageStart.value + pageSize.value,
    filteredData.value.length,
  );
  // The base feed can arrive before the supplemental sources: avoid presenting
  // its interim size as a settled total during the progressive read.
  return `${start}–${end} / ${filteredData.value.length}${supplementing.value ? '+' : ''}`;
});
const handlePageChange = () => {
  nextTick(() => {
    eventListRef.value?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    eventListRef.value?.querySelector(".ai-feed-heading")?.focus({preventScroll:true});
  });
};

const changeReadingPage = page => {currentPage.value=page;handlePageChange();};

const hasFilters = computed(() =>
  Boolean(
    searchQuery.value ||
      activeBoard.value !== "all" ||
      activeLens.value !== "all" ||
      activeCategory.value !== "all" ||
      activeSource.value !== "all" ||
      activeSort.value !== "smart" ||
      activeTime.value !== "24h" ||
      activeConfirmed.value,
  ),
);
const resetFilters = () => {
  const query = buildAiQuery(route.query, { lens: "all", category: "all", source: "all", board: "all", sort: "smart", time: "24h", confirmed: false, page: 1 });
  delete query.q;
  void router.replace({ path: route.path, query, hash: route.hash });
};
const controlFilters = computed(() => [
  { key: "source", value: activeSource.value, label: ui.value.source, options: sourceOptions.value, defaultValue: "all" },
  { key: "lens", value: activeLens.value, label: boardCopy.value.channel, options: lensOptions.value, defaultValue: "all" },
  { key: "sort", value: activeSort.value, label: ui.value.sort, options: sortOptions.value, defaultValue: "smart", showCount: false },
  { key: "size", value: pageSize.value, label: ui.value.perPage, options: pageSizeOptions.value, defaultValue: 30, showCount: false },
]);
const updateControl = ({ key, value }) => setConditions({ [key]: value });
// Share the localized compact-number formatter used in source evidence.
// zh-CN / zh-TW use 万/億; English uses K/M.
const formatCompactNumber = value => {
  const num=Number(value || 0);
  return Number.isFinite(num) && num>0 ? formatCompactMetric(num,locale.value) : "";
};
const readableMetric = item => aiReadableMetric(item,{...evidenceCopy.value.metrics,heat:ui.value.points,"stars-today":boardCopy.value.stars},formatCompactNumber);
const originalTitleHint = (item) =>
  item?.originalTitle && item.originalTitle !== item.title
    ? item.originalTitle
    : item.title;
const formatUpdated = (value) => {
  if(calendarPublicationDate(value))return formatCalendarPublicationDate(value,locale.value,{month:'2-digit',day:'2-digit'});
  const time = aiTime(value);
  return time ? new Intl.DateTimeFormat(locale.value, {
    month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(time)) : "";
};
const formatFullTime = (value) => calendarPublicationDate(value) ? formatCalendarPublicationDate(value,locale.value) : new Date(value).toLocaleString(locale.value);
const formatSignalFreshness = (item) => {
  const published = aiPublicationDisplayTime(item);
  return published ? `${evidenceCopy.value.times.published} ${formatUpdated(published)}`
    : evidenceCopy.value.unknownPublished;
};
const onLogoError = (event) => {
  if (event?.target) event.target.src = getSourceLogoFallback();
};
const onImageError = (event, item) => {
  failedCovers.value = new Set([...failedCovers.value, aiItemKey(item)]);
};
const clampPage = () => {
  if (result.value && currentPage.value > pageCount.value) setConditions({ page: pageCount.value }, false);
};
watch([() => result.value, pageCount, currentPage], clampPage);
const captureReadingAnchor = () => {
  let scroller=readerContainerRef.value?.parentElement;
  while(scroller && !(/auto|scroll/.test(getComputedStyle(scroller).overflowY) && scroller.scrollHeight>scroller.clientHeight))scroller=scroller.parentElement;
  const headerHeight=parseFloat(getComputedStyle(topicRef.value).getPropertyValue('--site-header-height')) || 64;
  const readingLine=(scroller?.getBoundingClientRect().top || 0)+headerHeight+20;
  if(!canPreserveAiReading({scrollTop:scroller?.scrollTop ?? window.scrollY,readerTop:readerContainerRef.value?.getBoundingClientRect().top,readingLine}))return null;
  const nodes = [...(eventListRef.value?.querySelectorAll("[data-ai-item]") || [])];
  const focused = nodes.find(node=>node.contains(document.activeElement));
  const node = focused || nodes.find(element=>{const box=element.getBoundingClientRect();return box.bottom>readingLine && box.top<window.innerHeight && box.height>0;});
  if(!node)return null;
  const controls=[...node.querySelectorAll('a,button,summary,input')];
  return {key:node.dataset.aiItem,top:node.getBoundingClientRect().top,focus:focused ? controls.indexOf(document.activeElement) : -1};
};
const applyAutomaticUpdate = async (update) => {
  const anchor=captureReadingAnchor();
  update();await nextTick();
  // A ranking refresh can move the same article onto a different page.
  const page=anchor ? aiAnchorPage(filteredData.value.map(item=>({key:aiItemKey(item)})),anchor.key,pageSize.value) : null;
  if(page && page!==currentPage.value){await router.replace({path:route.path,query:buildAiQuery(route.query,{page}),hash:route.hash});await nextTick();}
  restoreReadingAnchor(anchor);
};
const restoreReadingAnchor = anchor => {
  const node = [...(eventListRef.value?.querySelectorAll("[data-ai-item]") || [])].find(element => element.dataset.aiItem === anchor?.key);
  if (node && anchor) {
    const delta = node.getBoundingClientRect().top - anchor.top;
    let scroller = node.parentElement;
    while (scroller && !(/auto|scroll/.test(getComputedStyle(scroller).overflowY) && scroller.scrollHeight > scroller.clientHeight)) scroller = scroller.parentElement;
    (scroller || window).scrollBy({ top: delta, behavior: "instant" });
    if(anchor.focus>=0)node.querySelectorAll('a,button,summary,input')[anchor.focus]?.focus({preventScroll:true});
  } else if(anchor?.focus>=0)eventListRef.value?.querySelector('.ai-feed-heading')?.focus({preventScroll:true});
};
let requestGeneration=0,discoveryGeneration=0,loadController;
const fetchAiRead = async (path,query={},signal) => {
  const url=new URL('/api/'+path,window.location.origin);
  for(const [key,value] of Object.entries(query))if(value!==null&&value!==undefined)url.searchParams.set(key,String(value));
  const response=await fetch(url,{credentials:'same-origin',headers:{Accept:'application/json'},signal:signal?AbortSignal.any([signal,AbortSignal.timeout(12000)]):AbortSignal.timeout(12000)});
  if(!response.ok)throw Error('ai_read_'+response.status);
  const payload=await response.json();if(payload?.code!==200)throw Error('ai_invalid_response');return payload;
};
const isSupplementItem = item => item.extra?.publicationEvidence || item.extra?.editorial || toolFeeds.value.some(feed=>feed.source===primarySource(item));
const persistSnapshot = () => writeAiSnapshot(sessionStorage,locale.value,{result:result.value,discovery:discoveryApplied.value,discoveryFeeds:discoveryFeeds.value,toolFeeds:toolFeeds.value,coverage:discoveryCoverage.value,statuses:toolStatuses.value,checkedAt:statusCheckedAt.value});
const loadServiceStatuses = async (isCurrent,signal) => {
  statusesLoading.value=true;
  try {
    const payload=await fetchAiRead('ai-status',{},signal);
    if(!isCurrent())return;
    toolStatuses.value=mergeAiServiceStatuses(toolStatuses.value,payload.statuses,payload.checkedAt);statusCheckedAt.value=payload.checkedAt || null;
  }catch{if(isCurrent())toolStatuses.value=mergeAiServiceStatuses(toolStatuses.value,[]);}
  finally{if(isCurrent()){statusesLoading.value=false;if(result.value)persistSnapshot();}}
};
const loadModelStatuses=()=>{
  const generation=++requestGeneration;
  loadController?.abort();loadController=new AbortController();
  return loadServiceStatuses(()=>generation===requestGeneration,loadController.signal);
};
const loadTopic = async (force=false) => {
  const generation=++requestGeneration,discoveryRun=++discoveryGeneration;
  loadController?.abort();loadController=new AbortController();
  const isCurrent=()=>generation===requestGeneration && discoveryRun===discoveryGeneration;
  const signal=loadController.signal;
  if(!result.value) {
    const saved=readAiSnapshot(sessionStorage,locale.value);
    if(saved){result.value=saved.result;discoveryApplied.value=saved.discovery;discoveryFeeds.value=saved.discoveryFeeds;toolFeeds.value=saved.toolFeeds;discoveryCoverage.value=saved.coverage || {};toolStatuses.value=mergeAiServiceStatuses(saved.statuses,[]);statusCheckedAt.value=saved.checkedAt || null;cachedSnapshot.value=true;}
  }
  loading.value=true;supplementing.value=true;loadError.value='';discoveryError.value='';
  void loadServiceStatuses(isCurrent,signal);
  const reads=createAiTopicReads({
    topic:()=>getHotListsWithFallback('ai-topic',force,{locale:locale.value,translate_limit:0},{forceNoCache:force,timeout:12000,silent:true}),
    sina:()=>getHotListsWithFallback('sina-ai',force,{}, {forceNoCache:force,rankingLimit:100,timeout:8000,silent:true}),
    tools:()=>fetchAiRead('ai-tools',{locale:locale.value},signal),
    discovery:()=>scanAiDiscovery(query=>fetchAiRead('ai-discovery',query,signal),{isCurrent}),
    isCurrent,
  });
  try {
    const [topic,sina]=await reads.base;if(!isCurrent())return;
    const native=topic.status==='fulfilled' && topic.value.result?.code===200 ? topic.value.result : {code:200,data:[],dashboard:{feeds:[{source:'ai-topic',label:'AI',status:'failed',count:0}]}};
    const sinaItems=sina.status==='fulfilled' && sina.value.result?.code===200 ? sina.value.result.data.map((item,index)=>({...item,extra:{...item.extra,aiSignal:{primarySource:'sina-ai',primarySourceLabel:sourceChannelLabel('sina-ai'),primaryRank:item.rank || index+1,kind:'other',confirmations:[{source:'sina-ai',title:item.title,url:item.url}]},discovery:{source:'sina-ai',variant:'',dataKind:'ranking',rankingLabel:'AI',originalRank:item.rank || index+1,reason:'AI',snapshotUpdatedAt:sina.value.result.updateTime || ''}}})) : [];
    const sinaFeed=sinaItems.length ? {source:'sina-ai',label:sourceChannelLabel('sina-ai'),status:'ok',count:sinaItems.length,updateTime:sina.value.result.updateTime || ''} : null;
    const retained=(result.value?.data || []).filter(isSupplementItem);
    const incoming={...native,publications:result.value?.publications || [],dashboard:{...native.dashboard,feeds:[...(native.dashboard?.feeds || []).filter(feed=>!sinaFeed || feed.source!=='sina-ai'),...(sinaFeed?[sinaFeed]:[])]},data:mergeAiArticles(native.data,sinaItems,retained)};
    if(!incoming.data.length)throw Error('ai_data_unavailable');
    await applyAutomaticUpdate(()=>{result.value=incoming;cachedSnapshot.value=false;});persistSnapshot();
  }catch(error){if(isCurrent())loadError.value=error.message;}
  finally{if(isCurrent())loading.value=false;}
  if(!isCurrent())return;
  try {
    const [tools,scan]=await reads.supplement;if(!isCurrent())return;
    const official=tools.status==='fulfilled' ? tools.value : {data:[],publications:[],feeds:[{source:'official-tools',label:boardCopy.value.tools,status:'failed',count:0}]};
    const discovered=scan.status==='fulfilled' ? scan.value : {data:[],feeds:[],coverage:{},failedBatches:1};
    if(discovered.failedBatches)discoveryError.value='ai_discovery_partial';
    const base=result.value || {code:200,data:[],dashboard:{feeds:[{source:'ai-topic',label:'AI',status:'failed',count:0}]}};
    const publications=[...new Map([...(base.publications || []),...(official.publications || [])].map(entry=>[entry.url,entry])).values()].slice(-600);
    const primary=tools.status==='fulfilled' ? base.data.filter(item=>!isSupplementItem(item)) : base.data;
    const incoming={...base,publications,data:mergeAiArticles(primary,official.data)};
    if(incoming.data.length) {
      await applyAutomaticUpdate(()=>{if(tools.status==='fulfilled')toolFeeds.value=official.feeds || [];else toolFeeds.value=[...toolFeeds.value.filter(feed=>feed.source!=='official-tools'),...official.feeds];
        result.value=incoming;
        if(scan.status==='fulfilled'){discoveryFeeds.value=discovered.feeds;discoveryCoverage.value=discovered.coverage;discoveryApplied.value=mergeAiArticles(discovered.data);}
        loadError.value='';});persistSnapshot();
    }
  }finally{if(isCurrent())supplementing.value=false;}
};
let translationGeneration=0,translationTimer,translationActive=true;
const translationAttempted=new Set();
const translationFeedback=ref('');
const visibleTexts = computed(()=>[
  ...boardLanes.value.flatMap(lane=>(visibleBoardKeys.value ? lane.items.filter(item=>visibleBoardKeys.value.includes(item.key)) : lane.items.slice(0,5)).filter(item=>!item.release && !canonicalProductHuntName(item.raw)).map(item=>item.originalTitle)),
  ...boardLanes.value.flatMap(lane=>(visibleBoardKeys.value ? lane.items.filter(item=>visibleBoardKeys.value.includes(item.key)) : lane.items.slice(0,5)).filter(item=>item.context).map(item=>item.originalDesc)),
  ...pagedData.value.filter(item=>!item.extra?.modelRepository && !canonicalProductHuntName(item) && !["codex-releases","claude-code-releases"].includes(primarySource(item))).map(item=>item.originalTitle || item.title),
  ...(reader.value.summaries ? pagedData.value.map(item=>item.originalDesc || item.desc) : []),
].map(aiTranslationText).filter(text=>looksTranslatableSentence(text,locale.value)));
const translateVisible = async (retry=false) => {
  if(translating.value)return;
  if(retry){translationAttempted.clear();translationFailed.value=false;translationFeedback.value=boardCopy.value.translating;}
  const language=locale.value,generation=translationGeneration;
  const texts=[...new Set(visibleTexts.value)].filter(text=>!translationMap.value[language+"|"+text]&&!translationAttempted.has(language+"|"+text)).slice(0,20);
  if(!texts.length){if(retry)translationFeedback.value=boardCopy.value.translationNothing;return;}
  texts.forEach(text=>translationAttempted.add(language+"|"+text));translating.value=true;
  try {
    const map=await translateReadableTitles(texts,language,{priority:2,allowRawFallback:true});
    if(generation!==translationGeneration)return;
    const additions=Object.fromEntries(Object.entries(map).map(([text,translated])=>[language+"|"+text,translated]));
    const anchor=captureReadingAnchor();
    translationMap.value={...translationMap.value,...additions};
    await nextTick();restoreReadingAnchor(anchor);
    const failed=texts.some(text=>!map[text]);if(failed)translationFailed.value=true;
    if(retry)translationFeedback.value=(failed?boardCopy.value.translationPartial:boardCopy.value.translationDone).replace('{count}',String(Object.keys(map).length));
  }catch{if(generation===translationGeneration){translationFailed.value=true;if(retry)translationFeedback.value=boardCopy.value.translationFailed;}}
  finally{translating.value=false;queueVisibleTranslation();}
};
const queueVisibleTranslation = ()=>{if(!translationActive)return;clearTimeout(translationTimer);translationTimer=setTimeout(()=>void translateVisible(),180);};
watch([visibleTexts,locale],queueVisibleTranslation);
// Keep the complete reading workspace mounted; defer only its network work until visible.
const activateModelReader=()=>{
  if(!modelView.value || modelReaderActive.value)return;
  modelReaderActive.value=true;
  if(!result.value)void loadTopic(false);
};
const checkReaderVisibility=()=>{
  if(!modelView.value || modelReaderActive.value || !readerContainerRef.value)return;
  const rect=readerContainerRef.value.getBoundingClientRect();
  if(rect.top < window.innerHeight+400 && rect.bottom > -400)activateModelReader();
};
const observeReading=()=>{
  readerObserver?.disconnect();
  if(!readerContainerRef.value)return;
  if(typeof IntersectionObserver==="undefined"){checkReaderVisibility();return;}
  readerObserver=new IntersectionObserver(entries=>{
    if(entries.some(entry=>entry.isIntersecting))activateModelReader();
  },{rootMargin:"400px 0px"});
  readerObserver.observe(readerContainerRef.value);
};
const refreshTopic=()=>{if(modelView.value){void modelExplorerRef.value?.refresh();if(modelReaderActive.value)void loadTopic(true);else void loadModelStatuses();}else void loadTopic(true);};
const handleGlobalDataRefresh=event=>{if(modelView.value){void modelExplorerRef.value?.refresh();if(modelReaderActive.value)void loadTopic(Boolean(event?.detail?.force));else void loadModelStatuses();}else void loadTopic(Boolean(event?.detail?.force));};
let containerObserver,readerObserver,needsResume=false;
const measureContainer = () => {
  const nextWide = (readerContainerRef.value?.getBoundingClientRect().width || 0) >= 1080;
  if (wideLayout.value && !nextWide && topicRef.value?.querySelector(".ai-settings")?.contains(document.activeElement)) {
    settingsOpen.value = true;
    nextTick(() => topicRef.value?.querySelector(".ai-settings-trigger")?.focus());
  }
  wideLayout.value = nextWide;
};
onMounted(() => {
  measureContainer();
  observeReading();
  nextTick(checkReaderVisibility);
  if (typeof ResizeObserver !== "undefined" && readerContainerRef.value) {
    containerObserver = new ResizeObserver(measureContainer);
    containerObserver.observe(readerContainerRef.value);
  } else window.addEventListener("resize", measureContainer);
  window.addEventListener(DATA_REFRESH_EVENT, handleGlobalDataRefresh);
  if(modelView.value)void loadModelStatuses();else void loadTopic(false);
});
onActivated(() => {
  if(needsResume){needsResume=false;translationActive=true;if(modelView.value&&!modelReaderActive.value){void loadModelStatuses();nextTick(checkReaderVisibility);}else {queueVisibleTranslation();void loadTopic(false);}}
  window.removeEventListener(DATA_REFRESH_EVENT, handleGlobalDataRefresh);
  window.addEventListener(DATA_REFRESH_EVENT, handleGlobalDataRefresh);
});
onDeactivated(() => {
  needsResume=true;translationActive=false;translationGeneration++;clearTimeout(translationTimer);
  requestGeneration++;discoveryGeneration++;loadController?.abort();loading.value=false;supplementing.value=false;
  window.removeEventListener(DATA_REFRESH_EVENT, handleGlobalDataRefresh);
});
onBeforeUnmount(() => {
  loadController?.abort();requestGeneration++; discoveryGeneration++; translationGeneration++; translationActive=false; clearTimeout(translationTimer);
  containerObserver?.disconnect();
  readerObserver?.disconnect();
  window.removeEventListener("resize", measureContainer);
  window.removeEventListener(DATA_REFRESH_EVENT, handleGlobalDataRefresh);
});
watch(modelView,(isModel,wasModel)=>{if(isModel===wasModel)return;if(isModel&&!modelReaderActive.value){requestGeneration++;discoveryGeneration++;loadController?.abort();loading.value=false;supplementing.value=false;void loadModelStatuses();nextTick(checkReaderVisibility);}else void loadTopic(false);});
watch(locale, () => { translationGeneration++; discoveryGeneration++; result.value=null;toolStatuses.value=[];toolFeeds.value=[];statusCheckedAt.value=null; discoveryApplied.value=[]; discoveryFeeds.value=[]; discoveryCoverage.value={}; translationFailed.value=false;translationFeedback.value=''; if(modelView.value&&!modelReaderActive.value)void loadModelStatuses();else void loadTopic(false); });
</script>

<style scoped>
.sr-only{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.ai-panel-switch button,.ai-panel-switch>a{white-space:nowrap;flex-shrink:0}
@media(max-width:680px){.ai-panel-switch{flex-wrap:wrap;gap:4px}.ai-panel-switch button{padding-inline:8px;min-height:40px}.ai-panel-switch>a{font-size:11px}.ai-panel-switch .ai-language-choice :deep(.hover-menu-select){max-width:100px}}
.event-item.is-model-release .event-title{font-weight:650}

.ai-topic {
  --ai-gap: 20px; --ai-small-gap: 8px; --ai-radius: 8px; --ai-font: 16px; --ai-row-space: 12px;
  display: grid; gap: var(--ai-small-gap); width: 100%; min-width: 0; color: var(--ai-text); overflow-anchor:none;
}
.ai-topic.is-compact { --ai-font: 14px; --ai-row-space: 8px; }
.ai-brand{display:flex;gap:12px;align-items:center;min-width:0}.ai-brand-mark{width:38px;height:38px;flex:none;display:grid;place-items:center;color:var(--ai-action);background:color-mix(in srgb,var(--ai-action) 10%,var(--ai-panel));border-radius:8px;font-size:19px;line-height:1;font-weight:700;letter-spacing:-1px}.ai-panel-switch{display:flex;align-items:center;gap:4px;padding:8px 0 0;font-size:12px}.ai-panel-switch button{font:inherit;padding:7px 14px;border:0;border-radius:5px;background:transparent;color:var(--ai-muted);cursor:pointer}.ai-panel-switch button.active{background:color-mix(in srgb,var(--ai-action) 10%,transparent);color:var(--ai-action);font-weight:600}.ai-panel-switch>a{margin-left:auto;color:var(--ai-muted);text-decoration:none}.ai-row-number{flex:none;width:22px;align-self:flex-start;padding-top:2px;color:var(--ai-muted);font-size:14px;font-variant-numeric:tabular-nums}.ai-header { position:relative;overflow:hidden;background:color-mix(in srgb,var(--ai-action) 5%,var(--ai-panel));border:1px solid var(--ai-border); padding-inline:20px; border-radius:var(--ai-radius); display: flex; align-items: center; justify-content: space-between; gap: var(--ai-gap); padding-block: 14px; border-bottom: 1px solid var(--ai-border); }
.ai-header h1 { margin: 0; font-size: clamp(22px, 2vw, 28px); line-height: 1.3; }
.ai-header p { margin: 4px 0 0; font-size: 12px; line-height: 1.6; color: var(--ai-muted); }
.ai-status { display: flex; align-items: center; justify-content: flex-end; gap: var(--ai-small-gap); flex-wrap: wrap; font-size: 11px; color: var(--ai-muted); }
.ai-workspace { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--ai-gap); align-items: start; padding-top: 8px; }
.is-wide .ai-workspace { grid-template-columns: minmax(160px,17%) minmax(0,1fr) minmax(190px,20%); }
.ai-navigation { display: flex; overflow-x: auto; gap: 4px; padding-bottom: 4px; scrollbar-width: thin; min-width: 0; }
.ai-navigation button { display: flex; align-items: center; justify-content: space-between; flex: 0 0 auto; gap: 10px; min-height: 40px; padding: 7px 10px; border: 0; border-radius: var(--ai-radius); background: transparent; color: var(--ai-secondary); font: inherit; font-size: 13px; cursor: pointer; white-space: nowrap; }
.ai-navigation em { color: var(--ai-muted); font-size: 11px; font-style: normal; font-variant-numeric: tabular-nums; }
.ai-navigation button.active { color: var(--ai-action); background: color-mix(in srgb, var(--ai-action) 9%, transparent); font-weight: 600; }
.ai-navigation button.active em { color: inherit; }
.ai-navigation button:hover { background: var(--ai-hover); }
.is-wide .ai-navigation { position: sticky; top: calc(var(--site-header-height, 64px) + 18px); display: grid; overflow: visible; }
.ai-main { min-width:0; width:100%; }

.ai-feed-toolbar { display: flex; flex-wrap:wrap; justify-content: space-between; align-items: center; gap: 10px; min-height: 38px; margin-bottom: 4px; }
.ai-reader-time-filter{display:flex;align-items:center;gap:5px;font-size:12px;color:var(--ai-secondary);white-space:nowrap}
.ai-reader-time-filter :deep(.hover-menu-select){font-size:12px;max-width:140px;min-height:34px;padding:5px 9px;border:1px solid var(--ai-border);border-radius:7px;color:var(--ai-text);background:var(--ai-panel)}
.ai-reader-time-filter :deep(.hover-menu-select:focus-visible){outline:2px solid var(--ai-action);outline-offset:2px}
.ai-feed-toolbar > div { display: flex; align-items: center; gap: 8px; min-width: 0; flex-wrap: wrap; }
.ai-feed-toolbar h2 { margin: 0; font-size: 15px; font-weight: 600; }
.ai-feed-toolbar span { color: var(--ai-muted); font-size: 11px; }
.ai-settings-trigger, .reset-filter, .ai-updates button { min-height: 36px; padding: 5px 9px; border: 1px solid var(--ai-border); border-radius: var(--ai-radius); background: transparent; color: var(--ai-secondary); font: inherit; font-size: 12px; cursor: pointer; }
.reset-filter { border-color:color-mix(in srgb,var(--ai-danger) 25%,transparent); color:var(--ai-danger); }
.ai-settings { position: sticky; top: calc(var(--site-header-height, 64px) + 18px); padding-left: 16px; border-left: 1px solid var(--ai-border); min-width: 0; max-height: calc(100dvh - var(--site-header-height, 64px) - 40px); overflow-y: auto; scrollbar-width: thin; }
.ai-settings h2 { margin: 8px 0 16px; font-size: 13px; font-weight: 600; }
.ai-settings-popup { box-sizing: border-box; width: min(360px, calc(100vw - 32px)); max-height: calc(100dvh - 48px); overflow-y: auto; padding: 16px; border: 1px solid var(--ai-border); border-radius: 10px; background: var(--ai-panel); color: var(--ai-text); }
.ai-settings-popup-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.ai-settings-popup-heading h2 { font-size: 16px; margin: 0; }
.ai-settings-popup-heading button { min-width: 44px; min-height: 44px; font-size: 22px; color: var(--ai-secondary); background: transparent; border: 0; border-radius: 6px; cursor: pointer; }
.ai-settings-popup-heading button:focus-visible { outline: 2px solid var(--ai-action); outline-offset: 2px; }
.ai-updates { display: flex; gap: 8px; align-items: center; justify-content: space-between; padding: 8px 10px; margin-bottom: 8px; color: var(--ai-action); background: color-mix(in srgb, var(--ai-action) 6%, transparent); border-radius: var(--ai-radius); font-size: 12px; }
.ai-updates button { color: var(--ai-action); flex: 0 0 auto; }
.ai-filter-note { color: var(--ai-muted); font-size: 12px; line-height: 1.6; }
.event-list { border-top: 1px solid var(--ai-border); }
.event-item { position:relative;display: grid; grid-template-columns: 22px minmax(0, 1fr); align-items: start; gap: 4px 8px; padding-block: var(--ai-row-space); border-bottom: 1px solid var(--ai-border); }
.event-item.has-cover { grid-template-columns: 22px 88px minmax(0, 1fr); }
.event-cover { display: block; width: 88px; height: 68px; border-radius: 6px; }
.event-main { min-width: 0; }
.event-title { color: var(--ai-text); text-decoration: none; }
.event-title h3 { margin: 0; font-size: var(--ai-font); font-weight: 600; line-height: 1.4; overflow-wrap: anywhere; }
.event-title h3 > span[aria-hidden] { color: var(--ai-muted); font-size: 11px; white-space: nowrap; }
.event-title:hover { color: var(--ai-action); }
.event-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 2px 8px; margin-top: 5px; color: var(--ai-meta); font-size: 11px; line-height: 1.5; }
.event-source-line { display: inline-flex; gap: 4px; align-items: center; flex-wrap: wrap; }
.event-source-line img { width: 16px; height: 16px; object-fit: contain; }
.event-meta strong { color: var(--ai-secondary); font-weight: 500; }
.event-evidence { color: var(--ai-muted); font-size: 11px; line-height: 1.7; min-width: 0; }
.source-health summary { cursor: pointer; width: fit-content; padding: 2px 0; min-height: 20px; }
.event-evidence { margin-top:6px; padding: 8px 12px; background: var(--ai-hover); border-radius: var(--ai-radius); }
.event-evidence ul, .source-health ul { list-style: none; padding: 0; margin: 8px 0; }
.event-evidence li { display: grid; gap: 2px; margin-block: 8px; }
.event-evidence a { color: var(--ai-action); text-decoration: none; overflow-wrap: anywhere; }
.event-evidence a:hover { text-decoration: underline; }
.evidence-note, .event-author, .original-title { margin: 4px 0; color: var(--ai-muted); overflow-wrap: anywhere; line-height: 1.7; }
.original-title { font-size: 12px; }
.evidence-times { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 4px 12px; margin: 8px 0; }
.evidence-times dd { margin: 0; overflow-wrap: anywhere; }
.source-health { font-size: 11px; color: var(--ai-muted); }
.source-health p { margin: 4px 0; line-height: 1.7; }
.source-health ul { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%,230px), 1fr)); gap: 6px 20px; }
.source-health li { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 4px 10px; }
.event-pagination { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px; padding-block: 18px; color: var(--ai-muted); font-size: 12px; }
.ai-reader-announcement { position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%); }
.topic-empty { display: grid; justify-items: center; gap: 10px; padding-block: 48px; }
.topic-loading { padding-block: 20px; }
:is(button, a, summary, .ai-feed-heading):focus-visible { outline: 2px solid var(--ai-action); outline-offset: 3px; border-radius: 3px; }
.ai-settings-trigger:hover, .ai-updates button:hover, .reset-filter:hover { background: var(--ai-hover); }
.ai-diagnostics{display:grid;gap:8px;min-width:0;padding-top:8px}
.ai-service-statuses{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.ai-service-status{display:inline-flex;align-items:center;gap:4px;color:var(--ai-secondary);font-size:11px;text-decoration:none;min-height:32px;white-space:nowrap}
.ai-service-status>span{color:#1a9b68;font-size:8px}.ai-service-status.has-incident>span{color:#b87313}.ai-service-status.is-unknown>span{color:var(--ai-muted)}.ai-service-status:hover{color:var(--ai-action)}
.ai-page-settings-trigger{display:flex;align-items:center;justify-content:center;min-width:34px;min-height:34px;padding:0;border:1px solid var(--ai-border);border-radius:6px;background:transparent;color:var(--ai-secondary);cursor:pointer;font-size:16px}
.ai-page-settings{width:min(520px,calc(100vw - 32px))}
.ai-discovery-status{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;font-size:11px;color:var(--ai-muted);margin-bottom:12px}
.ai-discovery-status details{min-width:0}
.ai-discovery-status summary{cursor:pointer;min-height:32px;line-height:1.6;padding:6px 0}
.ai-discovery-status p{margin:4px 0;line-height:1.6}
.ai-discovery-status ul{max-height:160px;overflow:auto;margin:4px 0;padding-left:18px}
.ai-discovery-status button,.ai-translation-trigger{font:inherit;font-size:11px;color:var(--ai-action);border:1px solid var(--ai-border);background:var(--ai-panel);padding:6px 8px;min-height:32px;border-radius:6px;cursor:pointer;flex:none}
.ai-hide-source{font:inherit;font-size:10px;color:var(--ai-muted);background:transparent;border:0;padding:2px 4px;min-height:28px;cursor:pointer}
.ai-hide-source:hover{color:var(--ai-action)}
.event-evidence-trigger{font:inherit;color:inherit;white-space:nowrap;border:0;background:transparent;padding:2px 0;min-height:24px;cursor:pointer}.event-evidence-trigger:hover{color:var(--ai-action)}
.ai-translation-feedback{color:var(--ai-muted);font-size:11px;line-height:1.5;margin:4px 0}
.ai-undo-notice{position:fixed;right:24px;bottom:24px;z-index:1200;display:flex;align-items:center;gap:10px;max-width:calc(100vw - 32px);box-sizing:border-box;padding:8px 12px;background:var(--ai-panel);border:1px solid var(--ai-border);border-radius:var(--ai-radius);box-shadow:0 4px 16px #0002;font-size:12px;color:var(--ai-secondary)}
.ai-undo-notice>span{min-width:0;overflow-wrap:anywhere}.ai-undo-notice button{flex:none;font:inherit;min-height:32px;padding:2px 6px;border:0;background:transparent;color:var(--ai-action);cursor:pointer}.ai-undo-notice .undo-dismiss{color:var(--ai-muted);font-size:18px}
.ai-translated{font-size:10px;color:var(--ai-muted)}
@media(max-width:680px) {
  .event-evidence-trigger{min-height:44px}.ai-undo-notice{right:16px;bottom:16px}.ai-undo-notice button{min-height:44px}
  .ai-header { display:grid;grid-template-columns:minmax(0,1fr);justify-content:stretch;gap:8px; }
  .ai-page-settings-trigger{min-width:44px;min-height:44px}.ai-service-status{min-height:36px}.ai-discovery-status{flex-wrap:wrap}.ai-discovery-status summary,.ai-translation-trigger,.ai-hide-source{min-height:44px}
  .ai-status { display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:4px 8px;justify-content:start; }.ai-status>span{display:none}.ai-status :deep(.ai-service-statuses){grid-column:1/-1}.ai-status :deep(.n-button){min-height:44px}
  .ai-navigation button, .ai-settings-trigger, .reset-filter, .ai-updates button { min-height: 44px; }
  .source-health summary { min-height: 44px; line-height: 44px; }

  .event-item.has-cover { grid-template-columns: 22px 64px minmax(0, 1fr); }
  .event-cover { width: 64px; height: 64px; }
  .ai-updates { flex-wrap: wrap; }
}
@media(prefers-reduced-motion:reduce) { .ai-topic { scroll-behavior: auto; } }
:global(html[data-dailyhot-theme="dark"] .event-source-line img:is([src*="/logo/ai/openai"],[src*="/logo/ai/anthropic"])){filter:invert(1)}
.event-source-line img[src*="/people/"]{border-radius:50%}
</style>

<style scoped>
.ai-brand-mark{position:relative;width:52px;height:52px;background:transparent;color:var(--ai-action)}.ai-brand-mark>svg{width:38px;height:38px}
.ai-brand-mark::after{content:"";position:absolute;inset:0;border:1px solid color-mix(in srgb,var(--ai-action) 26%,transparent);border-radius:50%;box-shadow:0 0 0 5px color-mix(in srgb,var(--ai-action) 5%,transparent)}
.ai-banner-art{position:absolute;left:30%;top:50%;transform:translateY(-50%);width:360px;height:180px;color:var(--ai-action);opacity:.12;pointer-events:none}.ai-brand,.ai-status{position:relative;z-index:1}
.ai-header{isolation:isolate;padding:16px 18px;border-radius:14px;border-color:color-mix(in srgb,var(--ai-action) 18%,var(--ai-border));background:radial-gradient(circle at 5% -15%,color-mix(in srgb,var(--ai-action) 11%,transparent),transparent 40%),radial-gradient(circle at 90% 0%,color-mix(in srgb,#705ac8 7%,transparent),transparent 34%),var(--ai-panel)}
.radar-refresh{display:inline-flex;align-items:center;gap:6px;min-height:30px;padding:0 10px;border:1px solid color-mix(in srgb,var(--ai-action) 24%,var(--ai-border));border-radius:8px;background:color-mix(in srgb,var(--ai-action) 6%,var(--ai-panel));color:var(--ai-action);font:inherit;font-size:12px;font-weight:680;cursor:pointer}.radar-refresh:disabled{cursor:default;opacity:.62}.radar-refresh svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}.radar-refresh.is-loading svg{animation:ai-refresh-spin .8s linear infinite}@keyframes ai-refresh-spin{to{transform:rotate(360deg)}}
.ai-row-number[data-rank="1"]{color:#ea444d;font-weight:650}.ai-row-number[data-rank="2"]{color:#ed702d;font-weight:650}.ai-row-number[data-rank="3"]{color:#c69022;font-weight:650}
.ai-language-choice{font-size:11px;color:var(--ai-muted)}.ai-language-choice :deep(.hover-menu-select){font:inherit;color:var(--ai-secondary);background:var(--ai-panel);border:1px solid var(--ai-border);border-radius:5px;padding:5px 6px;max-width:160px}.ai-page-language{display:flex;gap:12px;justify-content:space-between;align-items:center;font-size:12px;margin:12px 0}.ai-page-language-select{flex:0 1 200px;min-width:0;max-width:60%;color:var(--ai-secondary)}.ai-page-language-select :deep(select){font:inherit;color:inherit;background:var(--ai-panel);border:1px solid var(--ai-border);border-radius:5px;padding-block:5px;padding-inline-start:6px;min-height:36px}.ai-item-language{font:inherit;font-size:11px;color:var(--ai-action);padding:0;border:0;background:transparent;cursor:pointer}
@media(max-width:480px){.ai-page-language{flex-direction:column;align-items:stretch;gap:7px}.ai-page-language-select{width:100%;max-width:100%;flex:0 0 auto}.ai-page-language-select :deep(select){min-height:44px;font-size:16px}}
.ai-topic-tag{font-size:10px;line-height:1.5;font-weight:680;padding:2px 6px;border-radius:4px;background:color-mix(in srgb,var(--topic-tone,var(--ai-action)) 13%,transparent);border:1px solid color-mix(in srgb,var(--topic-tone,var(--ai-action)) 19%,transparent)}:where(.ai-navigation button,.ai-topic-tag){--topic-tone:var(--ai-secondary)}.ai-navigation button[data-ai-topic],.ai-topic-tag[data-ai-topic]{color:var(--topic-tone)}
[data-ai-topic=models]{--topic-tone:#3776ed}[data-ai-topic=products]{--topic-tone:#079a80}[data-ai-topic=engineering]{--topic-tone:#7652d9}[data-ai-topic=research]{--topic-tone:#6b55db}[data-ai-topic=business]{--topic-tone:#cc7900}[data-ai-topic=safety]{--topic-tone:#e04357}
:global(html[data-dailyhot-theme=dark] .ai-topic [data-ai-topic=models]){--topic-tone:#93baff}:global(html[data-dailyhot-theme=dark] .ai-topic [data-ai-topic=products]){--topic-tone:#83c9b7}:global(html[data-dailyhot-theme=dark] .ai-topic :is([data-ai-topic=engineering],[data-ai-topic=research])){--topic-tone:#bea2e4}:global(html[data-dailyhot-theme=dark] .ai-topic [data-ai-topic=business]){--topic-tone:#dfbe87}:global(html[data-dailyhot-theme=dark] .ai-topic [data-ai-topic=safety]){--topic-tone:#e49da5}
.ai-navigation button.active{background:color-mix(in srgb,var(--topic-tone) 8%,var(--ai-panel))}
:is(select,.ai-item-language,.radar-refresh):focus-visible{outline:2px solid var(--ai-action);outline-offset:2px}
@media(max-width:680px){.ai-banner-art{left:auto;right:-30px;opacity:.08}.ai-header{padding:14px}.ai-language-choice :deep(.hover-menu-select),.ai-item-language{min-height:36px}.ai-brand-mark{width:44px;height:44px}.radar-refresh{min-height:36px}}
@media(prefers-reduced-motion:reduce){.radar-refresh.is-loading svg{animation:none}}
</style>

<style scoped>
/* Two-panel editorial hierarchy: identity, actions and board share the first
   surface; the separate long-form reader is the second surface. */
.topic-overview:is(.is-model-workspace,.is-intelligence-workspace){
  min-width:0;
  padding:0;
  border:0;
  border-radius:0;
  background:transparent;
}
:is(.is-model-workspace,.is-intelligence-workspace) .ai-header{
  display:flex;
  align-items:center;
  justify-content:space-between;
  min-height:65px;
  padding:6px 5px 11px;
  gap:16px;
  border:0;
  border-radius:0;
  background:transparent;
  box-shadow:none;
  overflow:visible;
}
:is(.is-model-workspace,.is-intelligence-workspace) .ai-brand{flex:1 1 37%;gap:10px;min-width:0}
:is(.is-model-workspace,.is-intelligence-workspace) .ai-header h1{font-size:clamp(19px,1.65vw,23px);line-height:1.3}
:is(.is-model-workspace,.is-intelligence-workspace) .ai-header p{margin-top:3px;font-size:11px;line-height:1.45}
:is(.is-model-workspace,.is-intelligence-workspace) .ai-brand-mark{width:36px;height:36px}
:is(.is-model-workspace,.is-intelligence-workspace) .ai-brand-mark>svg{width:30px;height:30px}
:is(.is-model-workspace,.is-intelligence-workspace) .ai-banner-art{width:130px;height:65px;opacity:.08;right:11%;pointer-events:none}
.ai-brand-metadata{display:flex;flex-wrap:wrap;align-items:center;gap:3px 10px;margin-top:5px;color:var(--ai-muted);font-size:11px;line-height:1.45;font-variant-numeric:tabular-nums}
.ai-brand-metadata time{white-space:nowrap}
.ai-header-right{display:flex;flex:0 1 64%;flex-direction:column;align-items:flex-end;justify-content:center;gap:8px;min-width:0}
.ai-header-right .ai-status{display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:9px}
.ai-header-right .ai-panel-switch{display:flex;flex-wrap:nowrap;align-items:center;justify-content:flex-end;min-width:0;max-width:100%;gap:8px;margin:0;padding:0;border:0;font-size:13px;font-weight:600;line-height:1.4}
.ai-header-right .ai-panel-switch button{flex:none;min-height:36px;padding:7px 11px;white-space:nowrap;font-size:13px;font-weight:650}
.ai-header-right .ai-panel-switch>a{flex:none;white-space:nowrap;margin-left:4px;font-size:13px;font-weight:600}
.ai-header-right .ai-language-choice{font-size:13px}.ai-header-right .ai-language-choice :deep(.hover-menu-select){min-height:36px;max-width:156px;padding:6px 8px;font-size:13px}
.ai-model-help,.ai-model-reset{display:grid;place-items:center;width:29px;height:29px;padding:4px;border:0;border-radius:6px;background:transparent;color:var(--ai-muted);cursor:pointer}
.ai-model-help:hover,.ai-model-reset:hover{background:var(--ai-hover);color:var(--ai-action)}
.ai-model-help svg,.ai-model-reset svg{display:block;width:16px;height:16px;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.ai-model-help-text{max-width:280px;margin:0;color:var(--ai-secondary);font-size:12px;line-height:1.7}
:is(.is-model-workspace,.is-intelligence-workspace) :deep(.model-boards),.is-intelligence-workspace :deep(.ai-board){margin:0}
.ai-topic:is(.is-model-panel,.is-intelligence-panel) .topic-reader{
  min-width:0;
  margin-top:12px;
  padding:12px;
  border:1px solid var(--ai-border);
  border-radius:12px;
  background:var(--ai-panel);
}
@media(max-width:1280px){
  :is(.is-model-workspace,.is-intelligence-workspace) .ai-header{display:grid;grid-template-columns:minmax(0,1fr);gap:7px}
  .ai-header-right{align-items:stretch;gap:4px}
  .ai-header-right .ai-status,.ai-header-right .ai-panel-switch{justify-content:flex-start}
  :is(.is-model-workspace,.is-intelligence-workspace) .ai-banner-art{display:none}
}
@media(max-width:680px){
  .topic-overview:is(.is-model-workspace,.is-intelligence-workspace){padding:0;border-radius:0}
  :is(.is-model-workspace,.is-intelligence-workspace) .ai-header{padding:5px 4px 9px;min-height:0;gap:6px}
  :is(.is-model-workspace,.is-intelligence-workspace) .ai-brand-mark{width:34px;height:34px}
  :is(.is-model-workspace,.is-intelligence-workspace) .ai-header h1{font-size:19px}
  .ai-header-right .ai-status{justify-content:flex-start;gap:4px}
  .ai-header-right .ai-panel-switch{justify-content:flex-start;overflow-x:auto;scrollbar-width:none;white-space:nowrap;max-width:100%}
  .ai-header-right .ai-panel-switch::-webkit-scrollbar{display:none}
  .ai-header-right .ai-panel-switch button{min-height:40px}
  .ai-topic:is(.is-model-panel,.is-intelligence-panel) .topic-reader{padding:9px;margin-top:10px}
}
@media(prefers-reduced-motion:reduce){.ai-model-reset svg{transition:none}}
</style>
