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
        'custom_0': '电影天堂',
        'custom_1': '如意',
        'custom_2': '暴风',
        'custom_3': '天涯',
        'custom_4': '非凡影视',
        'custom_5': '360',
        'custom_6': '卧龙',
        'custom_7': '极速',
        'custom_8': '魔爪',
        'custom_9': '魔都',
        'custom_10': '海外看',
        'custom_11': '新浪',
        'custom_12': '光速',
        'custom_13': '红牛',
        'custom_14': '樱花',
        'custom_15': '飞速',
      };
      return sourceNames[sourceId] || sourceId;
    };

    // Get all videos from all sources
    const allVideos = searchResults.flatMap(r => r.results);

    // Check each video individually
    const availableVideos = await checkMultipleVideos(allVideos, 10);

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
        'custom_0': '电影天堂',
        'custom_1': '如意',
        'custom_2': '暴风',
        'custom_3': '天涯',
        'custom_4': '非凡影视',
        'custom_5': '360',
        'custom_6': '卧龙',
        'custom_7': '极速',
        'custom_8': '魔爪',
        'custom_9': '魔都',
        'custom_10': '海外看',
        'custom_11': '新浪',
        'custom_12': '光速',
        'custom_13': '红牛',
        'custom_14': '樱花',
        'custom_15': '飞速',
      };
      return sourceNames[sourceId] || sourceId;
    };

    // Get all videos from all sources
    const allVideos = searchResults.flatMap(r => r.results);

    // Check each video individually
    const availableVideos = await checkMultipleVideos(allVideos, 10);

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
