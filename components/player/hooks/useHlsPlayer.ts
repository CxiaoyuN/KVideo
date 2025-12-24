import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface UseHlsPlayerProps {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    src: string;
    autoPlay?: boolean;
    onAutoPlayPrevented?: (error: Error) => void;
    onError?: (message: string) => void;
}

export function useHlsPlayer({
    videoRef,
    src,
    autoPlay = false,
    onAutoPlayPrevented,
    onError
}: UseHlsPlayerProps) {
    const hlsRef = useRef<Hls | null>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !src) return;

        // Cleanup previous HLS instance
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        let hls: Hls | null = null;

        // Check if HLS is supported natively (Safari, Mobile Chrome)
        // We prefer native playback if available as it's usually more battery efficient
        const isNativeHlsSupported = video.canPlayType('application/vnd.apple.mpegurl');

        if (Hls.isSupported()) {
            // Use hls.js for browsers without native support (Desktop Chrome, Firefox, Edge)
            // OR if we want to force hls.js for better control (optional, but sticking to native first is safer)

            // Note: Some desktop browsers (like Safari) support native HLS.
            // We usually prefer native, BUT sometimes native implementation is buggy or lacks features.
            // For now, we follow the standard pattern: Native first, then HLS.js.
            // EXCEPT for Chrome on Desktop which reports canPlayType as '' (false).

            if (!isNativeHlsSupported) {
                hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: false, // Disable low latency for more stable playback
                    startFragPrefetch: false, // Don't prefetch - let browser handle buffering
                    // Use relaxed buffer settings
                    maxBufferLength: 30,
                    maxMaxBufferLength: 60,
                    fragLoadingMaxRetry: 3,
                    manifestLoadingMaxRetry: 3,
                    levelLoadingMaxRetry: 3,
                });
                hlsRef.current = hls;

                hls.loadSource(src);
                hls.attachMedia(video);

                hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
                    // Force play if we have the first segment and it's not playing yet
                    // detailed: data.frag.sn is the sequence number
                    if (autoPlay && video.paused && data.frag.start === 0) {
                        video.play().catch(console.warn);
                    }
                });

                hls.on(Hls.Events.MANIFEST_PARSED, () => {

                    // Check for HEVC/H.265 codec (limited browser support)
                    if (hls) {
                        const levels = hls.levels;
                        if (levels && levels.length > 0) {
                            const hasHEVC = levels.some(level =>
                                level.videoCodec?.toLowerCase().includes('hev') ||
                                level.videoCodec?.toLowerCase().includes('h265')
                            );
                            if (hasHEVC) {
                                console.warn('[HLS] ⚠️ HEVC/H.265 codec detected - may not play in all browsers');
                                console.warn('[HLS] Supported: Safari with hardware acceleration, some Edge versions');
                                console.warn('[HLS] Not supported: Most Chrome/Firefox versions');
                                // Notify parent about potential codec issues
                                onError?.('检测到 HEVC/H.265 编码，当前浏览器可能不支持');
                            }
                        }
                    }

                    if (autoPlay) {
                        video.play().catch((err) => {
                            console.warn('[HLS] Autoplay prevented:', err);
                            onAutoPlayPrevented?.(err);
                        });
                    }
                });

                let networkErrorRetries = 0;
                let mediaErrorRetries = 0;
                const MAX_RETRIES = 3;

                hls.on(Hls.Events.ERROR, (event, data) => {
                    if (data.fatal) {
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                networkErrorRetries++;
                                console.error(`[HLS] Network error (${networkErrorRetries}/${MAX_RETRIES}), trying to recover...`, data);
                                if (networkErrorRetries <= MAX_RETRIES) {
                                    hls?.startLoad();
                                } else {
                                    console.error('[HLS] Too many network errors, giving up');
                                    onError?.('网络错误：无法加载视频流');
                                    hls?.destroy();
                                }
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                mediaErrorRetries++;
                                console.error(`[HLS] Media error (${mediaErrorRetries}/${MAX_RETRIES}), trying to recover...`, data);
                                if (mediaErrorRetries <= MAX_RETRIES) {
                                    hls?.recoverMediaError();
                                } else {
                                    console.error('[HLS] Too many media errors, giving up');
                                    onError?.('媒体错误：视频格式不支持或已损坏');
                                    hls?.destroy();
                                }
                                break;
                            default:
                                console.error('[HLS] Fatal error, cannot recover:', data);
                                onError?.(`致命错误：${data.details || '未知错误'}`);
                                hls?.destroy();
                                break;
                        }
                    } else {
                        // Non-fatal errors
                        console.warn('[HLS] Non-fatal error:', data.type, data.details);
                    }
                });
            } else {
                // Native HLS support
                video.src = src;
            }
        } else if (isNativeHlsSupported) {
            // Fallback for environments where Hls.js is not supported but native is (e.g. iOS without MSE?)
            video.src = src;
        } else {
            console.error('[HLS] HLS not supported in this browser');
            onError?.('当前浏览器不支持 HLS 视频播放');
        }

        return () => {
            if (hls) {
                hls.destroy();
            }
        };
    }, [src, videoRef, autoPlay, onAutoPlayPrevented, onError]);
}
