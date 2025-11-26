import React, { useState, useEffect } from 'react';
import Timeline from '../components/Timeline';
import { getPlaylistStats } from '../utils/api';
import { Music, TrendingUp, Clock, BarChart3 } from 'lucide-react';

const Analytics = () => {
  const [playlistStats, setPlaylistStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const stats = await getPlaylistStats();
      setPlaylistStats(stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const emotionHistory = JSON.parse(localStorage.getItem('emotionHistory') || '[]');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-20 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-gray-400">Track your emotion patterns and playlist insights</p>
        </div>

        {/* Playlist Stats */}
        {playlistStats && playlistStats.cached && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Music className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{playlistStats.total_songs}</p>
                  <p className="text-sm text-gray-400">Total Songs</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{playlistStats.total_duration_hours.toFixed(1)}h</p>
                  <p className="text-sm text-gray-400">Total Duration</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-green-500/20">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{(playlistStats.average_valence * 100).toFixed(0)}%</p>
                  <p className="text-sm text-gray-400">Avg Valence</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{(playlistStats.average_energy * 100).toFixed(0)}%</p>
                  <p className="text-sm text-gray-400">Avg Energy</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mood Distribution */}
        {playlistStats && playlistStats.mood_distribution && (
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/10 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Playlist Mood Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(playlistStats.mood_distribution).map(([emotion, count]) => (
                <div key={emotion} className="text-center">
                  <div className="bg-slate-700/50 rounded-lg p-4 mb-2">
                    <p className="text-2xl font-bold text-cyan-400">{count}</p>
                  </div>
                  <p className="text-sm text-gray-400 capitalize">{emotion}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Emotion Timeline */}
        <div className="mb-8">
          <Timeline emotionHistory={emotionHistory} />
        </div>

        {/* Info Message */}
        {!playlistStats?.cached && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 text-center">
            <p className="text-yellow-400">
              Playlist not synced yet. Go to Settings to sync your Spotify playlist.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
