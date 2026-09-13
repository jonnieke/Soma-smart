import React, { useState } from 'react';
import { allowedPaperImageSource } from '../../../services/paperImageAssets';

function PaperImage({ source, description }: { source: string; description: string }) {
  const [failed, setFailed] = useState(false);
  if (failed || !allowedPaperImageSource(source)) {
    return <p data-paper-image-error role="alert" className="text-sm text-red-700">{description} could not be loaded. Restore the attachment before printing or exporting.</p>;
  }
  return <img src={source} alt={description} referrerPolicy="no-referrer" crossOrigin="anonymous"
    onError={() => setFailed(true)} className="block max-w-full h-auto max-h-[650px] object-contain my-3" />;
}

export function PaperImages({ sources = [], required = false, description }: { sources?: string[]; required?: boolean; description: string }) {
  if (required && !sources.length) return <p data-paper-image-error role="alert" className="text-sm text-red-700">Diagram missing. Restore the image attachment before printing or exporting.</p>;
  return <>{sources.map((source, index) => <PaperImage key={`${source}-${index}`} source={source} description={`${description} ${index + 1}`} />)}</>;
}
