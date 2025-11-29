'use client';

import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icon';

interface VideoPlayerErrorProps {
    error: string;
    onBack: () => void;
    onRetry: () => void;
    retryCount: number;
    maxRetries: number;
}

export function VideoPlayerError({
    error,
    onBack,
    onRetry,
    retryCount,
    maxRetries,
}: VideoPlayerErrorProps) {
    return (
        <div className="aspect-video bg-black rounded-[var(--radius-2xl)] flex items-center justify-center">
            <div
                className="text-center text-white max-w-md px-4"
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
            >
                <Icons.AlertTriangle size={48} className="mx-auto mb-4 text-red-500" />
                <p className="text-lg font-semibold mb-2">播放失败</p>
                <p className="text-sm text-gray-300 mb-4">{error}</p>
                <div className="flex gap-2 justify-center flex-wrap">
                    <Button
                        variant="secondary"
                        onClick={onBack}
                        className="flex items-center gap-2"
                    >
                        <Icons.ChevronLeft size={16} />
                        <span>返回</span>
                    </Button>
                    {retryCount < maxRetries && (
                        <Button
                            variant="primary"
                            onClick={onRetry}
                            className="flex items-center gap-2"
                        >
                            <Icons.RefreshCw size={16} />
                            <span>重试 ({retryCount}/{maxRetries})</span>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
