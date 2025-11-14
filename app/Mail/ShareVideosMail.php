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

class ShareVideosMail extends Mailable
{
    use Queueable, SerializesModels;

    public $sender;
    public $videos;
    public $message;
    public $shareLinks;

    /**
     * Create a new message instance.
     */
    public function __construct(User $sender, array $videos, ?string $message = null)
    {
        $this->sender = $sender;
        $this->videos = $videos;
        $this->message = $message;
        
        // Generate share links for each video
        $this->shareLinks = [];
        foreach ($videos as $video) {
            $shareLink = \App\Models\ShareLink::firstOrCreate(
                [
                    'photo_id' => $video['id'],
                    'user_id' => $sender->id,
                ],
                [
                    'token' => \Illuminate\Support\Str::random(32),
                ]
            );
            $this->shareLinks[$video['id']] = route('share.show', $shareLink->token);
        }
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $videoCount = count($this->videos);
        $subject = $videoCount === 1 
            ? $this->sender->name . ' đã chia sẻ một video với bạn'
            : $this->sender->name . ' đã chia sẻ ' . $videoCount . ' video với bạn';
            
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
        $videoCount = count($this->videos);
        $videoText = $videoCount === 1 ? 'một video' : $videoCount . ' video';
        
        $videosGrid = '';
        foreach ($this->videos as $video) {
            $thumbnail = '';
            if (!empty($video['thumb_path'])) {
                $imageUrl = url('storage/' . $video['thumb_path']);
                $thumbnail = '<img src="' . htmlspecialchars($imageUrl) . '" alt="Video thumbnail" style="width: 100%; height: 150px; object-fit: cover;">';
            } else {
                $thumbnail = '<div style="width: 100%; height: 150px; background: #f0f0f0; display: flex; align-items: center; justify-content: center;"><span style="font-size: 48px;">🎬</span></div>';
            }
            
            $videosGrid .= '
                <div style="position: relative; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    ' . $thumbnail . '
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
        if ($videoCount === 1) {
            $link = $this->shareLinks[$this->videos[0]['id']] ?? '#';
            $linksHtml = '
                <a href="' . htmlspecialchars($link) . '" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 500;">Xem video</a>
            ';
        } else {
            $linksHtml = '<p>Bấm vào các link bên dưới để xem từng video:</p><ul>';
            $index = 1;
            foreach ($this->videos as $video) {
                $link = $this->shareLinks[$video['id']] ?? '#';
                $linksHtml .= '
                    <li>
                        <a href="' . htmlspecialchars($link) . '" style="display: block; text-decoration: none; color: #667eea; margin-top: 10px; font-size: 14px;">Xem video ' . $index . '</a>
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
    <title>Chia sẻ video</title>
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
        .video-grid {
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
        <h1 style="margin: 0; font-size: 24px;">🎬 Chia sẻ video</h1>
    </div>
    
    <div class="content">
        <p>Xin chào,</p>
        
        <p><strong>' . htmlspecialchars($this->sender->name) . '</strong> đã chia sẻ ' . $videoText . ' với bạn qua Photos Clone.</p>
        
        ' . $messageHtml . '
        
        <div class="video-grid">
            ' . $videosGrid . '
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
