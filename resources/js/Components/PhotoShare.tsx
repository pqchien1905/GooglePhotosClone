import React, { useState } from 'react';
import ShareButton from '@/Components/ShareButton';

export default function PhotoShare({ photoId }: { photoId: number }) {
  return (
    <div className="mb-4">
      <ShareButton type="photo" id={photoId} />
    </div>
  );
}
