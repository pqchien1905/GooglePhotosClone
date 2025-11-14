import React from 'react';

interface Photo {
  id: number;
  path: string;
  thumb_path?: string | null;
}

interface SharePhotosEmailPreviewProps {
  senderName: string;
  photos: Photo[];
  message?: string | null;
  shareLinks: Record<number, string>;
}

export default function SharePhotosEmailPreview({
  senderName,
  photos,
  message,
  shareLinks,
}: SharePhotosEmailPreviewProps) {
  const photoCount = photos.length;

  return (
    <div className="email-preview-container" style={{ maxWidth: '600px', margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      <style>{`
        .email-preview-container {
          line-height: 1.6;
          color: #333;
        }
        .email-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .email-content {
          background: #ffffff;
          padding: 30px;
          border: 1px solid #e0e0e0;
          border-top: none;
        }
        .email-photo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 15px;
          margin: 20px 0;
        }
        .email-photo-item {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .email-photo-item img {
          width: 100%;
          height: 150px;
          object-fit: cover;
        }
        .email-photo-link {
          display: block;
          text-decoration: none;
          color: #667eea;
          margin-top: 10px;
          font-size: 14px;
        }
        .email-message {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          font-style: italic;
        }
        .email-button {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
          font-weight: 500;
        }
        .email-footer {
          text-align: center;
          padding: 20px;
          color: #666;
          font-size: 12px;
          border-top: 1px solid #e0e0e0;
        }
      `}</style>

      <div className="email-header">
        <h1 style={{ margin: 0, fontSize: '24px' }}>📸 Chia sẻ ảnh</h1>
      </div>

      <div className="email-content">
        <p>Xin chào,</p>

        <p>
          <strong>{senderName}</strong> đã chia sẻ{' '}
          {photoCount === 1 ? 'một ảnh' : `${photoCount} ảnh`} với bạn qua Photos Clone.
        </p>

        {message && (
          <div className="email-message">
            <strong>Lời nhắn:</strong>
            <br />
            {message}
          </div>
        )}

        <div className="email-photo-grid">
          {photos.map((photo) => (
            <div key={photo.id} className="email-photo-item">
              <img
                src={`/storage/${photo.thumb_path || photo.path}`}
                alt="Ảnh"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/storage/' + photo.path;
                }}
              />
            </div>
          ))}
        </div>

        {photoCount === 1 ? (
          <a
            href={shareLinks[photos[0].id]}
            className="email-button"
            target="_blank"
            rel="noopener noreferrer"
          >
            Xem ảnh
          </a>
        ) : (
          <>
            <p>Bấm vào các link bên dưới để xem từng ảnh:</p>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {photos.map((photo, index) => (
                <li key={photo.id} style={{ marginBottom: '8px' }}>
                  <a
                    href={shareLinks[photo.id]}
                    className="email-photo-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Xem ảnh {index + 1}
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}

        <p style={{ marginTop: '30px' }}>
          Trân trọng,
          <br />
          <strong>Photos Clone</strong>
        </p>
      </div>

      <div className="email-footer">
        <p style={{ margin: '4px 0' }}>Email này được gửi từ Photos Clone.</p>
        <p style={{ margin: '4px 0' }}>Nếu bạn không mong muốn nhận email này, vui lòng bỏ qua.</p>
      </div>
    </div>
  );
}

