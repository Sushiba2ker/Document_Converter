'use client';

import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  progress?: number;
}

export default function LoadingSpinner({ message = 'Converting...', progress }: LoadingSpinnerProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-8">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </div>
  );
}
