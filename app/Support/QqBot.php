<?php


namespace App\Support;


use GuzzleHttp\Client;

class QqBot
{
    protected $host;
    protected $authKey;
    protected $client;
    protected static $instance = null;
    protected static $sessionKey;

    public function __construct($host, $authKey)
    {
        $this->host = $host;
        $this->authKey = $authKey;

        $this->client = new Client([
            'base_uri' => $host,
        ]);
    }


    public function auth()
    {
        return cache()->rememberForever('qqbot_session_1', function () {

            $res = $this->client->post('auth', [
                'json' => [
                    'authKey' => $this->authKey
                ]
            ]);

            $data = json_decode($res->getBody()->__toString(), 1);

            if ($data['code'] === 0) {
                return $data['session'];
            } else {
                \Log::warning($res->getBody()->__toString());
                throw new \Exception('qqbot auth failed');
            }
        });
    }

    public function verify($sessionKey, $qq)
    {
        return cache()->rememberForever('qqbot_verify_1', function () use ($sessionKey, $qq) {
            $res = $this->client->post('verify', [
                'json' => [
                    'sessionKey' => $sessionKey,
                    'qq' => $qq,
                ]
            ]);

            $data = json_decode($res->getBody()->__toString(), 1);

            if ($data['code'] === 0) {
                return true;
            } else {
                \Log::warning($res->getBody()->__toString());
                throw new \Exception('qqbot verify failed');
            }
        });
    }

    public function sendGroupMessage($params)
    {
        if (! isset($params['sessionKey'])) {
            $params['sessionKey'] = static::$sessionKey;
        }

        $this->client->post('sendGroupMessage', [
            'json' => $params
        ]);
    }

    /**
     * @return QqBot
     */
    public static function create()
    {
        if (is_null(static::$instance)) {
            static::$instance = new QqBot(
                config('mirai.host'),
                config('mirai.auth_key')
            );

            static::$sessionKey = static::$instance->auth();

            static::$instance->verify(static::$sessionKey, config('mirai.bot_qq'));
        }

        return static::$instance;
    }
}