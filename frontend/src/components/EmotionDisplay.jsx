import React from 'react';
import { Smile, Frown, Angry, Wind, Meh, Zap } from 'lucide-react';

const emotionIcons = {
  happy: { icon: Smile, color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Happy' },
  sad: { icon: Frown, color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Sad' },
  angry: { icon: Angry, color: 'text-red-400', bg: 'bg-red-500/20', label: 'Angry' },
  calm: { icon: Wind, color: 'text-green-400', bg: 'bg-green-500/20', label: 'Calm' },
  neutral: { icon: Meh, color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'Neutral' },
  excited: { icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/20', label: 'Excited' }
};

const EmotionDisplay = ({ emotion, confidence, modalityConfidences }) => {
  const emotionData = emotionIcons[emotion] || emotionIcons.neutral;
  const Icon = emotionData.icon;

  return (
    <div className="space-y-6">
      {/* Main Emotion Display */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-2xl blur-xl" />
        <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-cyan-500/20">
          <div className="flex flex-col items-center space-y-4">
            <div className={`w-24 h-24 rounded-full ${emotionData.bg} flex items-center justify-center`}>
              <Icon className={`w-14 h-14 ${emotionData.color}`} />
            </div>
            
            <div className="text-center">
              <h3 data-testid="current-emotion-text" className="text-3xl font-bold text-white mb-2">
                {emotionData.label}
              </h3>
              <p data-testid="emotion-confidence" className="text-lg text-gray-400">
                Confidence: <span className="text-cyan-400 font-semibold">{(confidence * 100).toFixed(1)}%</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modality Breakdown */}
      {modalityConfidences && Object.keys(modalityConfidences).length > 0 && (
        <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-5 border border-cyan-500/10">
          <h4 className="text-sm font-semibold text-gray-300 mb-4">Modality Confidence</h4>
          <div className="space-y-3">
            {Object.entries(modalityConfidences).map(([modality, conf]) => (
              <div key={modality} className="flex items-center justify-between">
                <span className="text-sm text-gray-400 capitalize">{modality}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500"
                      style={{ width: `${conf * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-cyan-400 w-12 text-right">
                    {(conf * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmotionDisplay;
