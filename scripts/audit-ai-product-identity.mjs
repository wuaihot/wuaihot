import assert from 'node:assert/strict';
import {canonicalProductHuntName} from '../src/utils/aiProductIdentity.mjs';
const ph=(title,originalTitle,url,confirmation)=>({title,...(originalTitle?{originalTitle}:{}),url,extra:{aiSignal:{primarySource:'producthunt-ai',confirmations:[{source:'producthunt-ai',title:confirmation||originalTitle||title,url}]}}});
const examples=[
  ['河西云','Hexis Cloud','https://www.producthunt.com/products/bevel-software','Hexis Cloud'],
  ['歧管MCP','Manifold MCP','https://www.producthunt.com/products/manifold-mcp','Manifold MCP'],
  ['熊联2.0','Bearconnect 2.0','https://www.producthunt.com/products/early-access-bearconnect-io','Bearconnect 2.0'],
];
for(const [translated,original,url,source] of examples)assert.equal(canonicalProductHuntName(ph(translated,original,url,source)),original,
  'product names must be taken from verified first-party title, not machine translation');
const item=ph('Incorrect invented name','Hexis Cloud','https://www.producthunt.com/products/bevel-software','Hexis Cloud');
assert.equal(canonicalProductHuntName(item),'Hexis Cloud','source-backed title takes precedence over altered snapshot title');
assert.equal(canonicalProductHuntName({...item,extra:{aiSignal:{primarySource:'hackernews-ai',confirmations:item.extra.aiSignal.confirmations}}}),'',
  'a different source must not inherit Product Hunt name protection');
assert.equal(canonicalProductHuntName({...item,url:'https://example.com/products/bevel-software'}),'',
  'lookalike domains must not claim Product Hunt authority');
assert.equal(canonicalProductHuntName({...item,url:'http://www.producthunt.com/products/bevel-software'}),'',
  'first-party identity requires https');
assert.equal(canonicalProductHuntName({...item,extra:{aiSignal:{primarySource:'producthunt-ai',confirmations:[{source:'producthunt-ai',title:'Faux',url:'https://www.producthunt.com/products/other'}]}}}),'Hexis Cloud',
  'a mismatched URL cannot supply the product name');
assert.equal(canonicalProductHuntName(ph('正确中文名',null,'https://www.producthunt.com/products/chinese-product','正确中文名')),'正确中文名',
  'source-native Chinese product names must remain unchanged');
console.log('AI_PRODUCT_IDENTITY_OK: 3 real product-name regressions, source identity, source URL and Chinese original protection');
