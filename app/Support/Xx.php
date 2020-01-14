<?php


namespace App\Support;


use App\Models\User;
use GuzzleHttp\Client;
use Illuminate\Support\Arr;

class Xx
{
    /**
     * @var null|Client[]
     */
    protected static $client = [];

    public static function getClient($name)
    {
        if (! isset(static::$client[$name])) {
            static::$client[$name] = new Client([
                'base_uri' => 'http://joucks.cn:3344/',
                'headers' => [
                    'Cookie' => User::where('uuid', $name)->first()->cookie
                ],
            ]);
        }

        return static::$client[$name];
    }

    public static function getUserInfo($name)
    {
        return json_decode(static::getClient($name)->get('/api/getUserInfo')->getBody()->__toString(), 1);
    }

    public static function getUserGoods($name)
    {
        $goods = [];
        foreach (range(1, 10) as $page) {
            $temp = json_decode(static::getClient($name)->get('/api/getUserGoods', [
                'query' => [
                    'page' => $page
                ],
            ])->getBody()->__toString(), 1);

            if (! Arr::get($temp, 'data')) {
                break;
            } else {
                $goods[$page] = $temp;
            }
        }

        return $goods;
    }
}