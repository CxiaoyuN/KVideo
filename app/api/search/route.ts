/**
 * Search API Route
 * Handles video search requests and aggregates results from multiple sources
 * Now with automatic source availability detection
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchVideos } from '@/lib/api/client';
import { getEnabledSources, getSourceById } from '@/lib/api/video-sources';
import { checkMultipleVideos } from '@/lib/utils/source-checker';
import type { SearchRequest, SearchResult } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json();
    const { query, sources: sourceIds, page = 1 } = body;

    // Validate input
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid or missing query parameter' },
        { status: 400 }
      );
    }

    if (!sourceIds || !Array.isArray(sourceIds) || sourceIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one source must be specified' },
        { status: 400 }
      );
    }

    // Get source configurations
    const sources = sourceIds
      .map((id: string) => getSourceById(id))
      .filter((source): source is NonNullable<typeof source> => source !== undefined);

    if (sources.length === 0) {
      return NextResponse.json(
        { error: 'No valid sources found' },
        { status: 400 }
      );
    }

    // Perform parallel search across sources
    const searchResults = await searchVideos(query.trim(), sources, page);

    // Get source name mapping
    const getSourceName = (sourceId: string): string => {
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
    };

    // Get all videos from all sources
    const allVideos = searchResults.flatMap(r => r.results);

    // Check each video individually with improved accuracy (reduced concurrency)
    const availableVideos = await checkMultipleVideos(allVideos, 8);

    // Group available videos by source
    const videosBySource = new Map<string, any[]>();
    for (const video of availableVideos) {
      const sourceId = video.source;
      if (!videosBySource.has(sourceId)) {
        videosBySource.set(sourceId, []);
      }
      videosBySource.get(sourceId)!.push(video);
    }

    // Build response with actual video counts per source
    const response: SearchResult[] = Array.from(videosBySource.entries()).map(([sourceId, videos]) => ({
      results: videos,
      source: sourceId,
      responseTime: searchResults.find(sr => sr.source === sourceId)?.responseTime,
    }));

    // Calculate source statistics
    const sourceStats = sourceIds.map(sourceId => {
      const count = videosBySource.get(sourceId)?.length || 0;
      return {
        sourceId,
        sourceName: getSourceName(sourceId),
        count,
      };
    });

    return NextResponse.json({
      success: true,
      query: query.trim(),
      page,
      sources: response,
      totalResults: availableVideos.length,
      sourceStats, // Include real counts per source
    });
  } catch (error) {
    console.error('Search API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Support GET method for simple queries
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || searchParams.get('query');
    const sourcesParam = searchParams.get('sources');
    const page = parseInt(searchParams.get('page') || '1', 10);

    if (!query) {
      return NextResponse.json(
        { error: 'Missing query parameter' },
        { status: 400 }
      );
    }

    // Use all enabled sources if not specified
    const sourceIds = sourcesParam
      ? sourcesParam.split(',')
      : getEnabledSources().map(s => s.id);

    // Get source configurations
    const sources = sourceIds
      .map((id: string) => getSourceById(id))
      .filter((source): source is NonNullable<typeof source> => source !== undefined);

    if (sources.length === 0) {
      return NextResponse.json(
        { error: 'No valid sources found' },
        { status: 400 }
      );
    }

    // Perform search
    const searchResults = await searchVideos(query.trim(), sources, page);

    // Get source name mapping
    const getSourceName = (sourceId: string): string => {
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
    };

    // Get all videos from all sources
    const allVideos = searchResults.flatMap(r => r.results);

    // Check each video individually with improved accuracy (reduced concurrency)
    const availableVideos = await checkMultipleVideos(allVideos, 8);

    // Group available videos by source
    const videosBySource = new Map<string, any[]>();
    for (const video of availableVideos) {
      const sourceId = video.source;
      if (!videosBySource.has(sourceId)) {
        videosBySource.set(sourceId, []);
      }
      videosBySource.get(sourceId)!.push(video);
    }

    // Build response with actual video counts per source
    const response: SearchResult[] = Array.from(videosBySource.entries()).map(([sourceId, videos]) => ({
      results: videos,
      source: sourceId,
      responseTime: searchResults.find(sr => sr.source === sourceId)?.responseTime,
    }));

    // Calculate source statistics
    const sourceStats = sourceIds.map(sourceId => {
      const count = videosBySource.get(sourceId)?.length || 0;
      return {
        sourceId,
        sourceName: getSourceName(sourceId),
        count,
      };
    });

    return NextResponse.json({
      success: true,
      query: query.trim(),
      page,
      sources: response,
      totalResults: availableVideos.length,
      sourceStats, // Include real counts per source
    });
  } catch (error) {
    console.error('Search API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
