export const PROTECTED_TRANSLATION_TERM_PATTERN =
  /\b(?:claude(?: code)?|Claude Code|Claude(?:\s+(?:(?:Opus|Sonnet|Haiku|Fable|Mythos)(?:\s+\d+(?:\.\d+)*)?|\d+(?:\.\d+)*(?:\s+(?:Opus|Sonnet|Haiku|Fable|Mythos))?))?|GPT(?:\s+Image(?:\s+\d+(?:\.\d+)*)?|-\d+(?:\.\d+)*(?:\s+(?:Sol|Luna|Terra))?|\s+(?:Sol|Luna|Terra))?|(?:ChatGPT|Sonnet|Opus|Haiku|Fable|Mythos|Gemini|Gemma|DiffusionGemma|GLM|Llama|Grok|Qwen|DeepSeek|Mistral|Mixtral|Kimi|ERNIE|Hunyuan|Doubao|Yi|Phi|Command|Aya)(?:[-\s]?\d+(?:\.\d+)*)?|Cohere|Anthropic|OpenAI|DeepMind|Hugging Face|OpenRouter|xAI|DALL[·-]E(?:[-\s]?\d+(?:\.\d+)*)?|Sora|Codex|Copilot|JDK|[Tt]okens?)|\b(?:AI|AGI|API|MCP|LLM)\b/g;

export const protectTranslationTerms = (text = "", tokenPrefix = "DHTERM") => {
  const terms = [];
  const protectedText = String(text || "").replace(
    PROTECTED_TRANSLATION_TERM_PATTERN,
    (term) => {
      const token = `${tokenPrefix}${terms.length}X`;
      terms.push([token, term]);
      return token;
    },
  );
  const restore = (value = "") =>
    terms.reduce(
      (nextValue, [token, term]) => nextValue.replaceAll(token, term).replace(new RegExp(tokenPrefix==='DHTERM' ? 'D\\s*H\\s*T\\s*E?\\s*R\\s*M\\s*'+token.match(/\d+/)[0]+'\\s*X' : token,'gi'),term),
      String(value || ""),
    );
  return { protectedText, restore };
};
