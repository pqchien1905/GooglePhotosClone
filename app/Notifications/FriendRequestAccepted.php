<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class FriendRequestAccepted extends Notification
{
    use Queueable;

    protected $acceptorName;
    protected $acceptorEmail;

    public function __construct($acceptorName, $acceptorEmail)
    {
        $this->acceptorName = $acceptorName;
        $this->acceptorEmail = $acceptorEmail;
    }

    public function via($notifiable)
    {
        return ['database'];
    }

    public function toDatabase($notifiable)
    {
        return [
            'message' => "{$this->acceptorName} đã chấp nhận lời mời kết bạn của bạn",
            'acceptor_name' => $this->acceptorName,
            'acceptor_email' => $this->acceptorEmail,
            'type' => 'friend_accepted',
        ];
    }
}
