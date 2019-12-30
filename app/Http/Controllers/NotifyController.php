<?php


namespace App\Http\Controllers;


use App\Support\Helper;
use Illuminate\Http\Request;
use App\Notifications\SlackBot;

class NotifyController extends Controller
{
    public function index(Request $request)
    {
        $msg = $request->input('msg', 'none');

        if ($request->input('bark')) {
            \Notification::route('slack', env('LOG_SLACK_WEBHOOK_URL'))
                ->notify(new SlackBot([
                    'content' => $msg,
                ]));
        }

        return [
            'output' => Helper::terminalNotify($msg),
        ];
    }
}