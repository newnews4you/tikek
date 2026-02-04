import React from 'react';
import { LiturgyCard } from './LiturgyCard';
import { LiturgyData } from '../../services/liturgyService';

interface LiturgyModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: LiturgyData | null;
    onAsk: () => void;
}

export const LiturgyModal: React.FC<LiturgyModalProps> = ({ isOpen, onClose, data, onAsk }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative z-10 w-full max-w-lg animate-in zoom-in-95 duration-200">
                <LiturgyCard
                    data={data}
                    onAskAboutGospel={() => {
                        onAsk();
                        onClose();
                    }}
                    className="mb-0 shadow-2xl ring-1 ring-stone-900/5"
                />
                <div className="mt-4 text-center">
                    <button
                        onClick={onClose}
                        className="text-stone-300 hover:text-white text-sm transition-colors"
                    >
                        Uždaryti
                    </button>
                </div>
            </div>
        </div>
    );
};
