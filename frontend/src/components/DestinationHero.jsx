import { useNavigate } from 'react-router-dom';

const DestinationHero = ({ destination }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="relative h-96">
        <img
          src={destination.image}
          alt={destination.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?q=80&w=1000';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <h1 className="text-4xl font-bold text-white mb-2">{destination.name}</h1>
          <p className="text-white/90 text-lg">
            {destination.city}, {destination.country}
          </p>
        </div>
      </div>
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 flex items-center text-white hover:text-gray-200 transition-colors"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Search
      </button>
    </div>
  );
};

export default DestinationHero;