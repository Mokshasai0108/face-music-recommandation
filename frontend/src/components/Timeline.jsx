import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const emotionColors = {
  happy: '#facc15',
  sad: '#60a5fa',
  angry: '#f87171',
  calm: '#4ade80',
  neutral: '#9ca3af',
  excited: '#c084fc'
};

const Timeline = ({ emotionHistory }) => {
  if (!emotionHistory || emotionHistory.length === 0) {
    return (
      <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-8 border border-cyan-500/10 flex items-center justify-center min-h-[300px]">
        <p className="text-gray-400">No emotion data yet. Start detecting!</p>
      </div>
    );
  }

  const labels = emotionHistory.map((_, index) => `${index * 3}s`);
  const emotions = ['happy', 'sad', 'angry', 'calm', 'neutral', 'excited'];

  const datasets = emotions.map(emotion => ({
    label: emotion.charAt(0).toUpperCase() + emotion.slice(1),
    data: emotionHistory.map(entry => entry.probabilities?.[emotion] || 0),
    borderColor: emotionColors[emotion],
    backgroundColor: `${emotionColors[emotion]}20`,
    borderWidth: 2,
    tension: 0.4,
    pointRadius: 3,
    pointHoverRadius: 5
  }));

  const data = {
    labels,
    datasets
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8',
          font: {
            size: 12,
            family: 'Inter, sans-serif'
          },
          padding: 15,
          usePointStyle: true
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#e2e8f0',
        bodyColor: '#cbd5e1',
        borderColor: '#22d3ee',
        borderWidth: 1,
        padding: 12,
        displayColors: true
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(34, 211, 238, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(34, 211, 238, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 11
          },
          callback: (value) => `${(value * 100).toFixed(0)}%`
        },
        min: 0,
        max: 1
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  return (
    <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/10">
      <h3 className="text-lg font-semibold text-white mb-4">Emotion Timeline</h3>
      <div className="h-[300px]">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default Timeline;
