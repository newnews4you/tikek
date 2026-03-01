import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { InstallInstructions } from './InstallInstructions';

export const PWAInstallButton: React.FC = () => {
    const { isInstallable, installPWA, isIOS, supportsNativeInstall } = usePWAInstall();
    const [showInstructions, setShowInstructions] = useState(false);

    if (!isInstallable) {
        return null;
    }

    const handleClick = () => {
        if (supportsNativeInstall) {
            installPWA();
        } else {
            // If no native prompt (iOS, or browser didn't fire event yet), show manual instructions
            setShowInstructions(true);
        }
    };

    return (
        <>
            <button
                onClick={handleClick}
                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
                title="Įsidiegti programėlę"
            >
                <Download size={14} />
                <span>Įsidiegti</span>
            </button>

            <InstallInstructions
                isOpen={showInstructions}
                onClose={() => setShowInstructions(false)}
                isIOS={isIOS}
            />
        </>
    );
};
