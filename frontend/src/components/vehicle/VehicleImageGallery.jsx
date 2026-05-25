import { useState } from 'react';

export default function VehicleImageGallery({ images = [], fallback }) {
  const gallery = images.length ? images : [{ image_url: fallback, id: 'fallback' }];
  const [activeImage, setActiveImage] = useState(gallery[0]?.image_url);

  return (
    <div className="space-y-4">
      <img src={activeImage} alt="Vehicle" className="h-[420px] w-full rounded-[2rem] object-cover shadow-soft" />
      <div className="grid grid-cols-4 gap-3">
        {gallery.map((image) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setActiveImage(image.image_url)}
            className={`overflow-hidden rounded-2xl border-2 transition ${activeImage === image.image_url ? 'border-brand' : 'border-transparent'}`}
          >
            <img src={image.image_url} alt="Vehicle preview" className="h-24 w-full object-cover" loading="lazy" />
          </button>
        ))}
      </div>
    </div>
  );
}
