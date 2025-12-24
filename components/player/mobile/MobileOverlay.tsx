import React from 'react';
import { Icons } from '@/components/ui/Icon';

interface MobileOverlayProps {
    isLoading: boolean;
    showToast: boolean;
    toastMessage: string | null;
}

export function MobileOverlay({
    isLoading,
    showToast,
    toastMessage
}: MobileOverlayProps) {
    return (
        <>
            {/* Loading Spinner - Glass Effect */}
            {isLoading && (
                <div className="loading-overlay-glass">
                    <div className="spinner-glass"></div>
                </div>
            )}

            {/* Toast Notification */}
            {showToast && toastMessage && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[200] animate-slide-up" style={{ transform: 'translate(-50%, 0) translateZ(0)' }}>
                    <div className="bg-[rgba(28,28,30,0.95)] backdrop-blur-[25px] rounded-[var(--radius-2xl)] border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.6)] px-6 py-3 flex items-center gap-3 min-w-[200px] max-w-[90vw]">
                        <Icons.Check size={18} className="text-[#34c759] flex-shrink-0" />
                        <span className="text-white text-sm font-medium">{toastMessage}</span>
                    </div>
                </div>
            )}
        </>
    );
}
