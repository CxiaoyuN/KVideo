export function getSourceName(sourceId: string): string {
  const sourceNames: Record<string, string> = {
    'dytt': '电影天堂',
    'ruyi': '如意',
    'baofeng': '暴风',
    'tianya': '天涯',
    'feifan': '非凡影视',
    'sanliuling': '360',
    'wolong': '卧龙',
    'jisu': '极速',
    'mozhua': '魔爪',
    'modu': '魔都',
    'zuida': '最大',
    'yinghua': '樱花',
    'baiduyun': '百度云',
    'wujin': '无尽',
    'wangwang': '旺旺',
    'ikun': 'iKun',
  };
  return sourceNames[sourceId] || sourceId;
}

export const SOURCE_IDS = [
  'dytt', 'ruyi', 'baofeng', 'tianya', 'feifan', 'sanliuling',
  'wolong', 'jisu', 'mozhua', 'modu', 'zuida', 'yinghua',
  'baiduyun', 'wujin', 'wangwang', 'ikun'
];
