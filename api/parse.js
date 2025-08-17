// api/parse.js - Vercel Serverless Function
export default async function handler(req, res) {
  // 设置CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url, platform } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    let result;
    if (platform === 'douyin' || url.includes('douyin.com')) {
      result = await parseDouyin(url);
    } else if (platform === 'kuaishou' || url.includes('kuaishou.com')) {
      result = await parseKuaishou(url);
    } else {
      return res.status(400).json({ error: 'Unsupported platform' });
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ 
      error: 'Parse failed', 
      message: error.message 
    });
  }
}

// 抖音解析
async function parseDouyin(url) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 8.0.0; SM-G955U Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  };
  
  const response = await fetch(url, { headers });
  const content = await response.text();
  
  const routerDataMatch = content.match(/_ROUTER_DATA\s*=\s*(\{.*?\})</);
  if (!routerDataMatch) {
    throw new Error('无法提取视频数据');
  }
  
  const videoData = JSON.parse(routerDataMatch[1]);
  const videoInfo = videoData.loaderData['video_(id)/page'].videoInfoRes.item_list[0];
  
  let videoUrl;
  if (videoInfo.aweme_type === 2) {
    videoUrl = videoInfo.video.cover.url_list[0];
  } else {
    videoUrl = videoInfo.video.play_addr.url_list[0].replace('playwm', 'play');
  }
  
  return {
    platform: 'douyin',
    videoId: videoInfo.aweme_id,
    authorName: videoInfo.author.nickname,
    uniqueId: videoInfo.author.unique_id || videoInfo.author.short_id,
    authorAvatar: videoInfo.author.avatar_thumb.url_list[0],
    title: videoInfo.author.signature,
    cover: videoInfo.video.cover.url_list[videoInfo.video.cover.url_list.length - 1],
    videoUrl: videoUrl,
    createdTime: new Date(videoInfo.create_time * 1000).toISOString(),
    desc: videoInfo.desc,
    diggCount: videoInfo.statistics.digg_count,
    collectCount: videoInfo.statistics.collect_count,
    commentCount: videoInfo.statistics.comment_count,
    shareCount: videoInfo.statistics.share_count,
    viewCount: videoInfo.statistics.play_count || 0,
    duration: videoInfo.video.duration || 0
  };
}

// 快手解析
async function parseKuaishou(url) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 8.0.0; SM-G955U Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  };
  
  const locationResponse = await fetch(url, { 
    headers,
    redirect: 'manual'
  });
  
  let finalUrl = url;
  if (locationResponse.headers.get('location')) {
    finalUrl = locationResponse.headers.get('location');
  }
  
  const videoPageUrl = finalUrl.replace(
    'https://www.kuaishou.com/short-video', 
    'https://m.gifshow.com/fw/photo'
  );
  
  const videoResponse = await fetch(videoPageUrl, { headers });
  const videoContent = await videoResponse.text();
  
  const photoMatch = videoContent.match(/"photo":\s*\{(.*?)\},\s*"serialInfo"/);
  if (!photoMatch) {
    throw new Error('无法提取快手视频数据');
  }
  
  const photoData = JSON.parse('{' + photoMatch[1] + '}');
  
  return {
    platform: 'kuaishou',
    videoId: photoData.manifest?.videoId || photoData.photoId,
    authorName: photoData.userName || '未知用户',
    uniqueId: photoData.userId || '',
    authorAvatar: photoData.headUrl || '',
    title: photoData.caption || '',
    cover: photoData.coverUrls?.[0]?.url || '',
    videoUrl: photoData.mainMvUrls?.[0]?.url || '',
    createdTime: new Date(photoData.timestamp || Date.now()).toISOString(),
    desc: photoData.caption || '',
    diggCount: photoData.likeCount || 0,
    collectCount: 0,
    commentCount: photoData.commentCount || 0,
    shareCount: photoData.shareCount || 0,
    viewCount: photoData.viewCount || 0,
    duration: photoData.duration || 0
  };
}
