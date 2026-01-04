
import React from 'react';
import { Impression } from '../types';

interface ImpressionCardProps {
  impression: Impression;
  onShare: (impression: Impression) => void;
}

export const ImpressionCard: React.FC<ImpressionCardProps> = ({ impression, onShare }) => {
  return (
    <div className="glass rounded-2xl overflow-hidden shadow-2xl transition-all hover:scale-[1.02] group">
      <div className="relative aspect-square">
        <img 
          src={impression.imageUrl} 
          alt={`Impression for ${impression.handle}`} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
          <p className="text-white text-sm font-medium leading-relaxed">
            {impression.description}
          </p>
        </div>
      </div>
      <div className="p-4 flex items-center justify-between bg-white/5">
        <div>
          <h3 className="text-blue-400 font-bold text-lg">@{impression.handle}</h3>
          <p className="text-gray-400 text-xs">
            {new Date(impression.timestamp).toLocaleDateString()}
          </p>
        </div>
        <button 
          onClick={() => onShare(impression)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors"
        >
          Share
        </button>
      </div>
    </div>
  );
};
