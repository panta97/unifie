import React from 'react';

interface LoadingModalProps {
    isOpen: boolean;
    message?: string;
    progress?: number;
}

const LoadingModal: React.FC<LoadingModalProps> = ({
    isOpen,
    message = 'Procesando...',
    progress = 0
}) => {
    if (!isOpen) return null;

    const hasProgress = progress > 0;
    const progressPercentage = Math.min(100, Math.max(0, progress));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

            <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative w-20 h-20">
                        <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>

                        {hasProgress && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-lg font-bold text-blue-600">
                                    {progressPercentage}%
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="text-center">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                            {message}
                        </h3>
                        <p className="text-sm text-slate-600">
                            Por favor espera, esto puede tomar unos momentos...
                        </p>
                    </div>

                    <div className="w-full">
                        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                            {hasProgress ? (
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out"
                                    style={{ width: `${progressPercentage}%` }}
                                >
                                    <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                                </div>
                            ) : (
                                <div className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 animate-progress-bar"></div>
                            )}
                        </div>

                        {hasProgress && (
                            <p className="text-center text-xs text-slate-600 mt-2 font-medium">
                                {progressPercentage < 100
                                    ? `Procesando... ${progressPercentage}% completado`
                                    : 'Finalizando...'
                                }
                            </p>
                        )}
                    </div>

                    <p className="text-xs text-slate-500 text-center">
                        No cierres esta ventana ni actualices la página
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoadingModal;