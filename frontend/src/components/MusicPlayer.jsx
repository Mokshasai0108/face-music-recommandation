import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, ThumbsUp, ThumbsDown, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';

const MusicPlayer = ({ song, onFeedback }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const audioRef = useRef(null);

  useEffect(() => {
    if (song?.preview_url && audioRef.current) {
      audioRef.current.src = song.preview_url;
      audioRef.current.load();
      // Auto-play new song
      if (song.preview_url) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    }
  }, [song]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!song) {
    return (
      <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-8 border border-cyan-500/10 flex items-center justify-center min-h-[400px]">
        <p className="text-gray-400">No song recommended yet. Start emotion detection!</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-600/5 rounded-2xl blur-2xl" />
      <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-cyan-500/20">
        {/* Album Art */}
        <div className="relative h-80 overflow-hidden">
          {song.image_url ? (
            <img
              src={song.image_url}
              alt={song.title}
              className="w-full h-full object-cover"
              data-testid="song-album-art"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
              <span className="text-6xl">🎵</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
        </div>

        {/* Song Info */}
        <div className="p-6 space-y-4">
          <div>
            <h3 data-testid="song-title" className="text-2xl font-bold text-white mb-1 line-clamp-1">
              {song.title}
            </h3>
            <p data-testid="song-artist" className="text-lg text-gray-400 line-clamp-1">
              {song.artist}
            </p>
            <p className="text-sm text-gray-500">{song.album}</p>
          </div>

          {/* Audio Features */}
          <div className="flex items-center space-x-4 text-xs">
            <div className="bg-cyan-500/10 px-3 py-1.5 rounded-full">
              <span className="text-cyan-400">Valence: {(song.valence * 100).toFixed(0)}%</span>
            </div>
            <div className="bg-blue-500/10 px-3 py-1.5 rounded-full">
              <span className="text-blue-400">Energy: {(song.energy * 100).toFixed(0)}%</span>
            </div>
          </div>

          {/* Progress Bar */}
          {song.preview_url && (
            <div className="space-y-2">
              <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-3">
              {song.preview_url ? (
                <Button
                  onClick={handlePlayPause}
                  data-testid="play-pause-button"
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </Button>
              ) : (
                <div className="text-xs text-gray-500">Preview not available</div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button
                onClick={() => onFeedback?.('like')}
                data-testid="like-button"
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-green-400 hover:bg-green-500/10"
              >
                <ThumbsUp className="w-5 h-5" />
              </Button>
              <Button
                onClick={() => onFeedback?.('dislike')}
                data-testid="dislike-button"
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-red-400 hover:bg-red-500/10"
              >
                <ThumbsDown className="w-5 h-5" />
              </Button>
              <Button
                onClick={() => onFeedback?.('skip')}
                data-testid="skip-button"
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10"
              >
                <SkipForward className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Open in Spotify */}
          <a
            href={song.url}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="open-spotify-link"
            className="flex items-center justify-center space-x-2 w-full py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
          >
            <span>Open in Spotify</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        data-testid="audio-player"
      />
    </div>
  );
};

export default MusicPlayer;
