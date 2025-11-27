import React, { useState, useEffect, useRef } from 'react';
import Camera from '../components/Camera';

import MusicPlayer from '../components/MusicPlayer';
import EmotionDisplay from '../components/EmotionDisplay';
import { predictFaceEmotion, predictTextEmotion, fuseEmotions, recommendSong, logFeedback } from '../utils/api';
import { Send } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

const Home = () => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [confidence, setConfidence] = useState(0);
  const [modalityConfidences, setModalityConfidences] = useState({});
  const [currentSong, setCurrentSong] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [emotionHistory, setEmotionHistory] = useState([]);

  const faceResultRef = useRef(null);

  const textResultRef = useRef(null);
  const lastEmotionRef = useRef('neutral');

  // Handle face capture
  const handleFaceCapture = async (imageBase64) => {
    try {
      console.log('Face capture triggered, sending to backend...');
      const result = await predictFaceEmotion(imageBase64);
      console.log('Face prediction result:', result);
      faceResultRef.current = result;
      performFusion();
    } catch (error) {
      console.error('Face prediction error:', error);
      toast.error('Face detection failed: ' + error.message);
    }
  };


  // Perform modal fusion
  const performFusion = async () => {
    try {
      const face = faceResultRef.current;

      // Need at least one modality
      if (!face) return;

      const result = await fuseEmotions(face, null, 'late');
      console.log('Fusion result:', result);

      if (result && result.emotion_fused) {
        setCurrentEmotion(result.emotion_fused);
        setConfidence(result.confidence);
      } else {
        console.warn('Fusion result missing emotion_fused:', result);
      }

      // Update modality confidences
      const modConf = {};
      if (face) modConf.face = face.confidence;
      setModalityConfidences(modConf);

      // Add to history
      setEmotionHistory(prev => [...prev, {
        emotion: result.emotion_fused,
        confidence: result.confidence,
        probabilities: result.probabilities,
        timestamp: new Date().toISOString()
      }]);

      // Recommend song if emotion changed and confidence is high
      if (result.emotion_fused !== lastEmotionRef.current && result.confidence > 0.5) {
        await recommendSongByEmotion(result.emotion_fused);
        lastEmotionRef.current = result.emotion_fused;
      }
    } catch (error) {
      console.error('Fusion error:', error);
    }
  };

  // Recommend song based on emotion
  const recommendSongByEmotion = async (emotion) => {
    try {
      const song = await recommendSong(emotion, currentSong?.song_id);
      setCurrentSong(song);
      toast.success(`Recommended: ${song.title}`);
    } catch (error) {
      console.error('Recommendation error:', error);
      if (error.response?.status === 404) {
        toast.error('Playlist not loaded. Please sync Spotify playlist in Settings.');
      } else {
        toast.error('Failed to get recommendation: ' + (error.response?.data?.detail || error.message));
      }
    }
  };

  // Handle feedback
  const handleFeedback = async (rating) => {
    if (!currentSong) return;

    try {
      await logFeedback(currentSong.song_id, currentEmotion, confidence, rating);

      if (rating === 'like') {
        toast.success('Liked!');
      } else if (rating === 'dislike') {
        toast.success('Disliked');
      } else if (rating === 'skip') {
        // Recommend new song
        await recommendSongByEmotion(currentEmotion);
      }
    } catch (error) {
      console.error('Feedback error:', error);
    }
  };

  // Toggle detection
  const toggleDetection = () => {
    setIsDetecting(!isDetecting);
    if (!isDetecting) {
      toast.success('Emotion detection started');
    } else {
      toast.info('Emotion detection stopped');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-20 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Emotion-Based Music Recommendation
          </h1>
          <p className="text-gray-400 text-lg">Real-time emotion detection meets your Spotify playlist</p>
        </div>

        {/* Control Button */}
        <div className="flex justify-center mb-8">
          <Button
            onClick={toggleDetection}
            data-testid="toggle-detection-button"
            size="lg"
            className={`px-8 py-6 text-lg font-semibold rounded-xl transition-all ${isDetecting
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700'
              }`}
          >
            {isDetecting ? 'Stop Detection' : 'Start Detection'}
          </Button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - Camera & Emotion */}
          <div className="lg:col-span-2 space-y-6">
            {/* Camera */}
            <div className="aspect-video">
              <Camera onCapture={handleFaceCapture} isActive={isDetecting} />
            </div>

            {/* Current Emotion */}
            <EmotionDisplay
              emotion={currentEmotion}
              confidence={confidence}
              modalityConfidences={modalityConfidences}
            />


          </div>

          {/* Right Column - Music Player */}
          <div className="lg:col-span-3">
            <MusicPlayer song={currentSong} onFeedback={handleFeedback} />
          </div>
        </div>

        {/* Ground Truth Labeling */}
        {isDetecting && (
          <div className="mt-8 bg-slate-800/30 backdrop-blur-sm rounded-xl p-5 border border-cyan-500/10">
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Your Actual Emotion (for accuracy tracking)</h4>
            <div className="flex flex-wrap gap-2">
              {['happy', 'sad', 'angry', 'calm', 'neutral', 'excited'].map(emotion => (
                <Button
                  key={emotion}
                  data-testid={`ground-truth-${emotion}-button`}
                  variant="outline"
                  size="sm"
                  className="capitalize border-cyan-500/30 text-gray-300 hover:bg-cyan-500/20 hover:text-cyan-400"
                  onClick={() => toast.info(`Ground truth: ${emotion} recorded`)}
                >
                  {emotion}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
