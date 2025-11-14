<?php

namespace App\Mail;

use App\Models\Album;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ShareAlbumsMail extends Mailable
{
    use Queueable, SerializesModels;

    public $sender;
    public $albums;
    public $message;
    public $shareLinks;

    /**
     * Create a new message instance.
     */
    public function __construct(User $sender, array $albums, ?string $message = null)
    {
        $this->sender = $sender;
        $this->albums = $albums;
        $this->message = $message;
        
        // Generate share links for each album
        $this->shareLinks = [];
        foreach ($albums as $album) {
            $shareLink = \App\Models\ShareLink::firstOrCreate(
                [
                    'album_id' => $album['id'],
                    'user_id' => $sender->id,
                ],
                [
                    'token' => \Illuminate\Support\Str::random(32),
                ]
            );
            $this->shareLinks[$album['id']] = route('share.show', $shareLink->token);
        }
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $albumCount = count($this->albums);
        $subject = $albumCount === 1 
            ? $this->sender->name . ' đã chia sẻ một album với bạn'
            : $this->sender->name . ' đã chia sẻ ' . $albumCount . ' album với bạn';
            
        return new Envelope(
            subject: $subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $html = $this->renderEmailHtml();
        
        return new Content(
            htmlString: $html,
        );
    }

    /**
     * Render email HTML from React component structure
     */
    private function renderEmailHtml(): string
    {
        $albumCount = count($this->albums);
        $albumText = $albumCount === 1 ? 'một album' : $albumCount . ' album';
        
        $albumsGrid = '';
        foreach ($this->albums as $album) {
            $coverImage = '';
            if (!empty($album['cover_photo'])) {
                $imageUrl = url('storage/' . ($album['cover_photo']['thumb_path'] ?? $album['cover_photo']['path']));
                $coverImage = '<img src="' . htmlspecialchars($imageUrl) . '" alt="' . htmlspecialchars($album['name']) . '" style="width: 100%; height: 150px; object-fit: cover;">';
            } else {
                $coverImage = '<div style="width: 100%; height: 150px; background: #f0f0f0; display: flex; align-items: center; justify-content: center;"><span style="font-size: 48px;">📁</span></div>';
            }
            
            $photosCount = $album['photos_count'] ?? 0;
            $albumsGrid .= '
                <div style="position: relative; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    ' . $coverImage . '
                    <div style="padding: 8px; background: #fff;">
                        <div style="font-size: 12px; font-weight: bold; margin-bottom: 4px;">' . htmlspecialchars($album['name']) . '</div>
                        <div style="font-size: 11px; color: #666;">' . $photosCount . ' ảnh</div>
                    </div>
                </div>
            ';
        }
        
        $messageHtml = '';
        if ($this->message) {
            $messageHtml = '
                <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; font-style: italic;">
                    <strong>Lời nhắn:</strong><br>
                    ' . nl2br(htmlspecialchars($this->message)) . '
                </div>
            ';
        }
        
        $linksHtml = '';
        if ($albumCount === 1) {
            $link = $this->shareLinks[$this->albums[0]['id']] ?? '#';
            $linksHtml = '
                <a href="' . htmlspecialchars($link) . '" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 500;">Xem album</a>
            ';
        } else {
            $linksHtml = '<p>Bấm vào các link bên dưới để xem từng album:</p><ul>';
            $index = 1;
            foreach ($this->albums as $album) {
                $link = $this->shareLinks[$album['id']] ?? '#';
                $linksHtml .= '
                    <li>
                        <a href="' . htmlspecialchars($link) . '" style="display: block; text-decoration: none; color: #667eea; margin-top: 10px; font-size: 14px;">Xem album ' . $index . ': ' . htmlspecialchars($album['name']) . '</a>
                    </li>
                ';
                $index++;
            }
            $linksHtml .= '</ul>';
        }
        
        return '
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chia sẻ album</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e0e0e0;
            border-top: none;
        }
        .album-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #e0e0e0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="margin: 0; font-size: 24px;">📁 Chia sẻ album</h1>
    </div>
    
    <div class="content">
        <p>Xin chào,</p>
        
        <p><strong>' . htmlspecialchars($this->sender->name) . '</strong> đã chia sẻ ' . $albumText . ' với bạn qua Photos Clone.</p>
        
        ' . $messageHtml . '
        
        <div class="album-grid">
            ' . $albumsGrid . '
        </div>
        
        ' . $linksHtml . '
        
        <p style="margin-top: 30px;">
            Trân trọng,<br>
            <strong>Photos Clone</strong>
        </p>
    </div>
    
    <div class="footer">
        <p style="margin: 4px 0;">Email này được gửi từ Photos Clone.</p>
        <p style="margin: 4px 0;">Nếu bạn không mong muốn nhận email này, vui lòng bỏ qua.</p>
    </div>
</body>
</html>
        ';
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
