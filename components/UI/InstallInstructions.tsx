import React from 'react';
import { Share, PlusSquare, X, Monitor } from 'lucide-react';

interface InstallInstructionsProps {
    isOpen: boolean;
    onClose: () => void;
    isIOS: boolean;
}

export const InstallInstructions: React.FC<InstallInstructionsProps> = ({ isOpen, onClose, isIOS }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 relative animate-in zoom-in-95 duration-200">

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors"
                >
                    <X size={20} />
                </button>

                <h3 className="text-xl font-cinzel font-bold text-stone-800 mb-4 pr-8">
                    Kaip įdiegti programėlę?
                </h3>

                {isIOS ? (
                    <div className="space-y-4 text-stone-600">
                        <p className="text-sm">
                            „Apple“ įrenginiuose įdiegimas atliekamas per kelis žingsnius:
                        </p>
                        <ol className="space-y-3 text-sm font-medium">
                            <li className="flex items-start gap-3">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-stone-100 text-stone-500 text-xs shrink-0 mt-0.5">1</span>
                                <span>
                                    Paspauskite apačioje esantį <Share className="inline w-4 h-4 mx-1 text-blue-500" /> <b>Bendrinti</b> mygtuką.
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-stone-100 text-stone-500 text-xs shrink-0 mt-0.5">2</span>
                                <span>
                                    Slinkite meniu žemyn ir pasirinkite <br />
                                    <span className="inline-flex items-center gap-1 bg-stone-100 px-1.5 py-0.5 rounded text-stone-800 mt-1">
                                        <PlusSquare className="w-4 h-4" /> Pridėti prie pagrindinio ekrano
                                    </span>
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-stone-100 text-stone-500 text-xs shrink-0 mt-0.5">3</span>
                                <span>
                                    Patvirtinkite paspausdami <b>Pridėti</b>.
                                </span>
                            </li>
                        </ol>
                    </div>
                ) : (
                    <div className="space-y-4 text-stone-600">
                        <p className="text-sm">
                            Naršyklėse diegimas yra paprastas:
                        </p>
                        <div className="flex items-center gap-3 bg-amber-50 p-3 rounded-lg border border-amber-100">
                            <Monitor className="text-amber-600 shrink-0" size={24} />
                            <span className="text-sm text-amber-900">
                                Ieškokite adreso juostoje arba meniu punkto <b>„Diegti programėlę“</b> (Install App).
                            </span>
                        </div>
                        <p className="text-xs text-stone-500 italic mt-2">
                            Jei nematote diegimo mygtuko, patikrinkite naršyklės nustatymus.
                        </p>
                    </div>
                )}

                <div className="mt-8 flex justify-center">
                    <button
                        onClick={onClose}
                        className="bg-stone-900 text-stone-50 px-6 py-2 rounded-xl text-sm font-medium hover:bg-stone-800 transition-colors"
                    >
                        Supratau
                    </button>
                </div>
            </div>
        </div>
    );
};
