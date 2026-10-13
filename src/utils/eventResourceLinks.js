import { getSourceLogo } from "./sourceLogos";
export const eventResourceKey = url => {
  try {
    const host = new URL(url).hostname;
    if (host === "huya.com" || host.endsWith(".huya.com")) return "huya";
    if (host === "bilibili.com" || host.endsWith(".bilibili.com")) return "bilibili";
    if (host === "lpl.qq.com" || host === "lol.qq.com") return "lpl";
    if (host === "lolesports.com" || host.endsWith(".riotgames.com")) return "lol";
  } catch { /* Invalid optional destination: show its label without an icon. */ }
  return "";
};
export const eventResourceLogo = url => ({
  huya:getSourceLogo("huya-live"), bilibili:getSourceLogo("bilibili"),
  lol:getSourceLogo("lol-esports"), lpl:"/assets/lol-series/lpl-official.png",
}[eventResourceKey(url)] || "");
