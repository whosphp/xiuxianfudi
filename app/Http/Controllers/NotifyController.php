<?php


namespace App\Http\Controllers;


use App\Notifications\TerminalBasic;
use App\Support\Helper;
use App\Support\QqBot;
use Illuminate\Http\Request;
use App\Notifications\SlackBot;

class NotifyController extends Controller
{
    public function index(Request $request)
    {
        $msg = $request->input('msg', 'none');

        if ($request->input('qqbot')) {
            QqBot::create()
                ->sendGroupMessage([
                    "target"=> config('mirai.target_qq'),
                    "messageChain"=> [
                        [
                            "type"=> "Plain",
                            "text"=> "测试"
                        ]
                    ]
                ]);
        }
    }

    // old
    public function index2(Request $request)
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