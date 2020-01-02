<?php


namespace App\Channels;

use App\Support\Helper;
use Illuminate\Notifications\Notification;

class TerminalChannel
{
    /**
     * Send the given notification.
     *
     * @param  mixed  $notifiable
     * @param  \Illuminate\Notifications\Notification  $notification
     * @return void
     */
    public function send($notifiable, Notification $notification)
    {
        $message = $notification->toTerminal($notifiable);

        Helper::terminalNotify($message);
    }
}