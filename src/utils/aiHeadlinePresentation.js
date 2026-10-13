// Headline-only presentation for first-party attributed AI author posts.
// Keep the canonical post, originalTitle, reviewed text, and source provenance intact.
export function conciseAiAuthorHeadline(item, title, locale='zh-CN') {
  if (!String(locale).startsWith('zh') ||
      item?.extra?.aiSignal?.primarySource !== 'ai-author-thsottiaux' ||
      typeof title !== 'string') return title;

  // Only simplify if the headline itself ALREADY identifies Tibo up front.
  // Do not strip subject names from titles where no byline prefix exists.
  const match=/^(Tibo(?:\s*[·・]\s*Day\s*\d{1,3})?)\s*([：:])\s*(.+)$/iu.exec(title.trim());
  if (!match) return title;
  const [,byline,separator,body]=match;
  let focus=body.replace(
    /^(?:OpenAI\s*(?:员工|員工|成員)\s*)?Tibo\s*(?:宣布|表示|称|稱|指出|透露|介绍|介紹|分享|确认|確認|证实|證實|发文|發文|发布了|發布了|发布|發布)\s*[：:，,]?\s*/iu,
    '',
  );
  // No semantic rewrite if there was no redundant source attribution.
  if (focus===body || !focus.trim()) return title;

  // These two edits use only the already stated facts. Relative 'today' on a
  // stored article must refer to the announcement day, not the reading day.
  focus=focus.replace(/默认上下文长度提升至/gu,'默认上下文升至');
  focus=focus.replace(/^今日结束前进行全球\s*token\s*重置$/iu,'全球 Token 重置计划于当日结束前完成')
    .replace(/^今日結束前進行全球\s*token\s*重置$/iu,'全球 Token 重置計劃於當日結束前完成');

  return byline+separator+focus.trim();
}
