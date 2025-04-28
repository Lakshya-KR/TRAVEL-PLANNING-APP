import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function SearchSuggestion({ place, isHovered, onHover, onLeave }) {
  return (
    <Card
      className="bg-gray-800/50 backdrop-blur-sm text-white hover:shadow-yellow-400/20 shadow-lg 
        rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 
        hover:scale-[1.02] hover:bg-gray-800/70 border border-gray-700/50"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <CardHeader className="p-0 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
        {isHovered ? (
          <video
            src={place.thumbnailVideo}
            autoPlay
            muted
            loop
            className="w-full h-64 object-cover transition-opacity duration-500"
          />
        ) : (
          <img
            src={place.coverPhoto}
            alt={place.name}
            className="w-full h-64 object-cover transition-opacity duration-500"
          />
        )}
      </CardHeader>
      <CardContent className="p-6 relative z-20">
        <CardTitle className="text-2xl font-bold mb-2">{place.name}</CardTitle>
        <CardDescription className="text-gray-300">
          A beautiful destination worth exploring. Discover local culture, cuisine, and breathtaking views.
        </CardDescription>
      </CardContent>
      <CardFooter className="p-6 pt-0 text-sm text-gray-400 flex items-center gap-2">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Suggested based on your search
      </CardFooter>
    </Card>
  );
}