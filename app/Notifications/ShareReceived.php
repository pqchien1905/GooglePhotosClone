<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\DatabaseMessage;

class ShareReceived extends Notification
{
    use Queueable;

    protected $share;
    protected $senderName;
    protected $itemType;
    protected $itemName;

    public function __construct($share, $senderName, $itemType, $itemName)
    {
        $this->share = $share;
        $this->senderName = $senderName;
        $this->itemType = $itemType;
        $this->itemName = $itemName;
    }

    public function via($notifiable)
    {
        return ['database'];
    }

    public function toDatabase($notifiable)
    {
        return [
            'message' => "{$this->senderName} đã chia sẻ {$this->itemType} \"{$this->itemName}\" với bạn",
            'sender_name' => $this->senderName,
            'share_id' => $this->share->id,
            'type' => 'share_received',
            'item_type' => $this->itemType,
            'item_name' => $this->itemName,
        ];
    }

    public function toArray($notifiable)
    {
        return [
            'message' => "{$this->senderName} đã chia sẻ {$this->itemType} \"{$this->itemName}\" với bạn",
            'sender_name' => $this->senderName,
            'share_id' => $this->share->id,
            'type' => 'share_received',
        ];
    }
}
