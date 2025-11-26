import React, { useState, useEffect } from 'react';
import { fetchSpotifyPlaylist, getPlaylistStats } from '../utils/api';
import { RefreshCw, Music, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Slider } from '../components/ui/slider';
import { toast } from 'sonner';

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [playlistStats, setPlaylistStats] = useState(null);
  const [fusionWeights, setFusionWeights] = useState({
    face: 40,
    speech: 30,
    text: 30
  });
  const [confidenceThreshold, setConfidenceThreshold] = useState(70);

  useEffect(() => {
    loadStats();
    loadSettings();
  }, []);

  const loadStats = async () => {
    try {
      const stats = await getPlaylistStats();
      setPlaylistStats(stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadSettings = () => {
    const savedWeights = localStorage.getItem('fusionWeights');
    const savedThreshold = localStorage.getItem('confidenceThreshold');

    if (savedWeights) {
      setFusionWeights(JSON.parse(savedWeights));
    }
    if (savedThreshold) {
      setConfidenceThreshold(parseFloat(savedThreshold));
    }
  };

  const saveSettings = () => {
    localStorage.setItem('fusionWeights', JSON.stringify(fusionWeights));
    localStorage.setItem('confidenceThreshold', confidenceThreshold.toString());
    toast.success('Settings saved!');
  };

  const handleSyncPlaylist = async () => {
    setLoading(true);
    try {
      const result = await fetchSpotifyPlaylist();

      if (result.status === 'error') {
        throw new Error(result.message || 'Failed to sync playlist');
      }

      toast.success(`Successfully synced ${result.songs_cached} songs!`);
      await loadStats();
    } catch (error) {
      console.error('Sync error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to sync playlist';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleWeightChange = (modality, value) => {
    const newWeights = { ...fusionWeights, [modality]: value[0] };

    // Auto-normalize to 100%
    const total = Object.values(newWeights).reduce((a, b) => a + b, 0);
    if (total !== 100) {
      const factor = 100 / total;
      Object.keys(newWeights).forEach(key => {
        newWeights[key] = Math.round(newWeights[key] * factor);
      });
    }

    setFusionWeights(newWeights);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-20 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Configure your emotion detection and Spotify integration</p>
        </div>

        {/* Spotify Integration */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2 flex items-center space-x-2">
                <Music className="w-5 h-5 text-green-500" />
                <span>Spotify Playlist</span>
              </h2>
              <p className="text-sm text-gray-400">Sync your playlist for emotion-based recommendations</p>
            </div>
            <Button
              onClick={handleSyncPlaylist}
              disabled={loading}
              data-testid="sync-playlist-button"
              className="bg-green-600 hover:bg-green-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Syncing...' : 'Sync Playlist'}
            </Button>
          </div>

          {playlistStats && playlistStats.cached ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <p className="text-green-400 font-medium">Playlist Synced</p>
                <p className="text-sm text-gray-400 mt-1">
                  {playlistStats.total_songs} songs • {playlistStats.total_duration_hours.toFixed(1)} hours
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Average Valence: {(playlistStats.average_valence * 100).toFixed(0)}% |
                  Energy: {(playlistStats.average_energy * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <p className="text-yellow-400 font-medium">Playlist Not Synced</p>
                <p className="text-sm text-gray-400 mt-1">
                  Add your Spotify credentials to backend/.env and click "Sync Playlist"
                </p>
                <div className="mt-2 text-xs text-gray-500 font-mono bg-slate-900/50 p-2 rounded">
                  SPOTIFY_CLIENT_ID=your_id<br />
                  SPOTIFY_CLIENT_SECRET=your_secret<br />
                  SPOTIFY_PLAYLIST_ID=your_playlist_id
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Confidence Threshold */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Confidence Threshold</h2>
          <p className="text-sm text-gray-400 mb-6">
            Minimum confidence required to change song recommendations
          </p>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">Threshold</label>
              <span className="text-cyan-400 font-semibold">{confidenceThreshold}%</span>
            </div>
            <Slider
              value={[confidenceThreshold]}
              onValueChange={(value) => setConfidenceThreshold(value[0])}
              min={50}
              max={100}
              step={5}
              className="w-full"
              data-testid="confidence-threshold-slider"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={saveSettings}
            data-testid="save-settings-button"
            size="lg"
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
