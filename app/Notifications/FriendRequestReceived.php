<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class FriendRequestReceived extends Notification
{
    use Queueable;

    protected $senderName;
    protected $senderEmail;
    protected $requestId;

    public function __construct($senderName, $senderEmail, $requestId)
    {
        $this->senderName = $senderName;
        $this->senderEmail = $senderEmail;
        $this->requestId = $requestId;
    }

    public function via($notifiable)
    {
        return ['database'];
    }

    public function toDatabase($notifiable)
    {
        return [
            'message' => "{$this->senderName} ({$this->senderEmail}) đã gửi lời mời kết bạn",
            'sender_name' => $this->senderName,
            'sender_email' => $this->senderEmail,
            'request_id' => $this->requestId,
            'type' => 'friend_request',
        ];
    }
}
