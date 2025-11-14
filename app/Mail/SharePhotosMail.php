<?php

namespace App\Mail;

use App\Models\Photo;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SharePhotosMail extends Mailable
{
    use Queueable, SerializesModels;

    public $sender;
    public $photos;
    public $message;
    public $shareLinks;

    /**
     * Create a new message instance.
     */
    public function __construct(User $sender, array $photos, ?string $message = null)
    {
        $this->sender = $sender;
        $this->photos = $photos;
        $this->message = $message;
        
        // Generate share links for each photo
        $this->shareLinks = [];
        foreach ($photos as $photo) {
            $shareLink = \App\Models\ShareLink::firstOrCreate(
                [
                    'photo_id' => $photo['id'],
                    'user_id' => $sender->id,
                ],
                [
                    'token' => \Illuminate\Support\Str::random(32),
                ]
            );
            $this->shareLinks[$photo['id']] = route('share.show', $shareLink->token);
        }
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $photoCount = count($this->photos);
        $subject = $photoCount === 1 
            ? $this->sender->name . ' đã chia sẻ một ảnh với bạn'
            : $this->sender->name . ' đã chia sẻ ' . $photoCount . ' ảnh với bạn';
            
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
        $photoCount = count($this->photos);
        $photoText = $photoCount === 1 ? 'một ảnh' : $photoCount . ' ảnh';
        
        $photosGrid = '';
        foreach ($this->photos as $photo) {
            $imageUrl = url('storage/' . ($photo['thumb_path'] ?? $photo['path']));
            $photosGrid .= '
                <div style="position: relative; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <img src="' . htmlspecialchars($imageUrl) . '" alt="Ảnh" style="width: 100%; height: 150px; object-fit: cover;">
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
        if ($photoCount === 1) {
            $link = $this->shareLinks[$this->photos[0]['id']] ?? '#';
            $linksHtml = '
                <a href="' . htmlspecialchars($link) . '" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 500;">Xem ảnh</a>
            ';
        } else {
            $linksHtml = '<p>Bấm vào các link bên dưới để xem từng ảnh:</p><ul>';
            $index = 1;
            foreach ($this->photos as $photo) {
                $link = $this->shareLinks[$photo['id']] ?? '#';
                $linksHtml .= '
                    <li>
                        <a href="' . htmlspecialchars($link) . '" style="display: block; text-decoration: none; color: #667eea; margin-top: 10px; font-size: 14px;">Xem ảnh ' . $index . '</a>
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
    <title>Chia sẻ ảnh</title>
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
        .photo-grid {
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
        <h1 style="margin: 0; font-size: 24px;">📸 Chia sẻ ảnh</h1>
    </div>
    
    <div class="content">
        <p>Xin chào,</p>
        
        <p><strong>' . htmlspecialchars($this->sender->name) . '</strong> đã chia sẻ ' . $photoText . ' với bạn qua Photos Clone.</p>
        
        ' . $messageHtml . '
        
        <div class="photo-grid">
            ' . $photosGrid . '
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
