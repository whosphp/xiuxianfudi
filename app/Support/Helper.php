<?php


namespace App\Support;


class Helper
{
    public static function terminalNotify($msg)
    {
        exec("/usr/local/bin/terminal-notifier -message ".escapeshellarg($msg), $output, $return_var);
        return $output;
    }
}