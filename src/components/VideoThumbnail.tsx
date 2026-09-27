import React, { useState } from 'react';
export default function VideoThumbnail({ id, eager = false }: { id: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <span className="video-thumbnail-fallback">Somo Smart · Video</span>
  ) : (
    <img
      className="video-thumbnail"
      src={`https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`}
      alt=""
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      width="480"
      height="360"
      referrerPolicy="strict-origin-when-cross-origin"
      onError={() => setFailed(true)}
    />
  );
}
