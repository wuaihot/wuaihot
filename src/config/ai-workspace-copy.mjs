const make = (title, description, navLabel, lenses, fields) => ({
  title, description, navLabel, lenses: Object.fromEntries(["all","official","repositories","models","papers","discussion"].map((key,i)=>[key,lenses[i]])), ...fields,
});
export const AI_WORKSPACE_COPY = {
  "zh-CN": make("AI 热点雷达", "全网一手AI信息源监控，追踪新发布与重要变化", "AI 内容导航",
    ["全部动态","官方动态","开源项目","模型收录","论文研究","社区讨论"], {
      moreFilters:"更多筛选", moreDisplay:"更多显示选项", readerScope:"仅影响下方阅读", settings:"浏览设置", display:"显示内容", summaries:"摘要", images:"图片", original:"显示原标题", compact:"紧凑阅读",
      resetReader:"恢复阅读设置", upstreamTypes:"上游类型", apply:"应用更新", pending:"新增 {added} · 更新 {updated} · 移除 {removed}",
      reordered:"排序有变化", publicationGap:"当前记录尚无明确发布时间；该排序不能表示最新发布。",
      emptyData:"当前来源尚无内容，请查看来源状态或稍后刷新。", unavailable:"当前筛选没有可用条目，条件已保留。",
      filterHint:"来源筛选含关联链接；内容导航仅按主来源。", snapshot:"检索当前聚合记录", fullSummary:"展开完整摘要", readerLocal:"阅读设置仅保存在当前设备。",
    }),
  en: make("AI Hotspot Radar", "AI dashboard · First-hand sources across the web, in one view", "AI content navigation",
    ["All updates","Official updates","Open source","Model listings","Papers","Community"], {
      moreFilters:"More filters", moreDisplay:"More display options", readerScope:"Applies to the reader below", settings:"Reading settings", display:"Display", summaries:"Summaries", images:"Images", original:"Show original titles", compact:"Compact reading",
      resetReader:"Reset reading settings", upstreamTypes:"Upstream type", apply:"Apply updates", pending:"New {added} · Changed {updated} · Removed {removed}",
      reordered:"Order changed", publicationGap:"These records have no verified publication time; this order cannot indicate the latest releases.",
      emptyData:"No content is available. Check source status or refresh later.", unavailable:"No items match. Your filters are preserved.",
      filterHint:"Source filters include linked evidence; navigation uses the primary channel only.", snapshot:"Search current aggregate", fullSummary:"Read full summary", readerLocal:"Reading settings are saved on this device only.",
    }),
  "zh-TW": make("AI 熱點雷達", "AI聚合看板 一屏看盡全網一手資訊來源", "AI 內容導覽",
    ["全部動態","官方動態","開源專案","模型收錄","論文研究","社群討論"], {
      moreFilters:"更多篩選", moreDisplay:"更多顯示選項", readerScope:"僅影響下方閱讀", settings:"瀏覽設定", display:"顯示內容", summaries:"摘要", images:"圖片", original:"顯示原標題", compact:"精簡閱讀",
      resetReader:"恢復閱讀設定", upstreamTypes:"上游類型", apply:"套用更新", pending:"新增 {added} · 更新 {updated} · 移除 {removed}",
      reordered:"排序有變化", publicationGap:"目前紀錄尚無明確發布時間；此排序不能表示最新發布。",
      emptyData:"目前來源尚無內容，請查看來源狀態或稍後更新。", unavailable:"目前篩選沒有可用項目，條件已保留。",
      filterHint:"來源篩選含關聯連結；內容導覽僅按主要來源。", snapshot:"搜尋目前彙整紀錄", fullSummary:"展開完整摘要", readerLocal:"閱讀設定僅儲存在目前裝置。",
    }),
  ja: make("AI動向", "AIダッシュボード · 世界の一次情報をひと目で", "AIコンテンツナビゲーション",
    ["すべて","公式情報","オープンソース","モデル一覧","論文","コミュニティ"], {
      moreFilters:"その他の絞り込み", moreDisplay:"その他の表示設定", readerScope:"下の閲覧欄に適用", settings:"閲覧設定", display:"表示内容", summaries:"要約", images:"画像", original:"原題を表示", compact:"コンパクト表示",
      resetReader:"閲覧設定をリセット", upstreamTypes:"提供元の分類", apply:"更新を適用", pending:"新規 {added} · 変更 {updated} · 削除 {removed}",
      reordered:"順序が変更されました", publicationGap:"公開時刻が確認できないため、この順序は最新の公開順を示しません。",
      emptyData:"情報がありません。情報源の状態を確認するか、後で更新してください。", unavailable:"該当項目はありません。条件は保持されています。",
      filterHint:"情報源の絞り込みは関連リンクを含み、ナビゲーションは主な情報源を使います。", snapshot:"現在の集計を検索", fullSummary:"要約の全文を読む", readerLocal:"閲覧設定はこの端末だけに保存されます。",
    }),
  ko: make("AI 동향", "AI 대시보드 · 전 세계 1차 정보를 한눈에", "AI 콘텐츠 탐색",
    ["전체 동향","공식 소식","오픈 소스","모델 목록","논문","커뮤니티"], {
      moreFilters:"추가 필터", moreDisplay:"추가 표시 옵션", readerScope:"아래 읽기 영역에 적용", settings:"읽기 설정", display:"표시 내용", summaries:"요약", images:"이미지", original:"원제 표시", compact:"간결한 보기",
      resetReader:"읽기 설정 초기화", upstreamTypes:"제공자 유형", apply:"업데이트 적용", pending:"신규 {added} · 변경 {updated} · 삭제 {removed}",
      reordered:"순서 변경", publicationGap:"확인된 게시 시각이 없어 이 정렬은 최신 게시 순서를 의미하지 않습니다.",
      emptyData:"콘텐츠가 없습니다. 출처 상태를 확인하거나 나중에 새로고침하세요.", unavailable:"일치하는 항목이 없습니다. 필터는 유지됩니다.",
      filterHint:"출처 필터는 연결된 근거를 포함하고 콘텐츠 탐색은 주 출처만 사용합니다.", snapshot:"현재 집계 검색", fullSummary:"전체 요약 읽기", readerLocal:"읽기 설정은 이 기기에만 저장됩니다.",
    }),
};
