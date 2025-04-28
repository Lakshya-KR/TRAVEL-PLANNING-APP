const PhotoGallery = ({ photos }) => {
  if (!photos || photos.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
        No photos available for this destination.
      </div>
    );
  }

  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Photo Gallery</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {photos.map((photo, index) => (
          <div
            key={index}
            className="relative group rounded-xl overflow-hidden aspect-square"
          >
            <img
              src={photo.url}
              alt={`Photo ${index + 1}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-sm">
                Photo by{' '}
                <a
                  href={photo.photographer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-gray-200"
                >
                  {photo.photographer}
                </a>
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PhotoGallery;