'use client';

import { useState, useEffect } from 'react';
import { Activity, Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import { getServerStats, type ServerStats } from '@/lib/api';

export default function ServerStats() {
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const serverStats = await getServerStats();
        setStats(serverStats);
      } catch (error) {
        console.error('Failed to fetch server stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (!stats) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="mb-2 p-2 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-800 transition-colors"
        title="Server Statistics"
      >
        <Activity className="w-4 h-4" />
      </button>
      
      {isVisible && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-64">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Server Status</h3>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-gray-600">Active Jobs</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{stats.active_jobs}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">Completed</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{stats.completed_jobs}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-gray-600">Failed</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{stats.failed_jobs}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600">Max Workers</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{stats.max_workers}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-gray-600">Queue Size</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{stats.queue_size}</span>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              Total Jobs: {stats.total_jobs}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
