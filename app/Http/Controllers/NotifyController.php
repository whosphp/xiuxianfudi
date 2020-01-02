<?php


namespace App\Http\Controllers;


use App\Notifications\TerminalBasic;
use App\Support\Helper;
use Illuminate\Http\Request;
use App\Notifications\SlackBot;

class NotifyController extends Controller
{
    public function index(Request $request)
    {
        $msg = $request->input('msg', 'none');

        \Notification::route('terminal', 'local')
            ->notify(new TerminalBasic([
                'message' => $msg,
            ]));

        if ($request->input('bark')) {
            \Notification::route('slack', env('LOG_SLACK_WEBHOOK_URL'))
                ->notify(new SlackBot([
                    'content' => $msg,
                ]));
        }
    }
}