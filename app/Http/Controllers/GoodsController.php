<?php


namespace App\Http\Controllers;


use App\Models\User;
use App\Support\Xx;
use Illuminate\Support\Arr;

class GoodsController extends Controller
{
    public function index()
    {
        $goods = cache()->remember('goods_4', 1800, function () {
            $goods = [];
            foreach (User::all() as $user) {
                $temp = [];

                $userGoods = cache()->remember($user->uuid.':user_goods', 120, function () use ($user) {
                    return Xx::getUserGoods($user->uuid);
                });

                foreach ($userGoods as $data) {
                    $temp = array_merge($temp, Arr::get($data, 'data') ?: []);
                }

                $goods[$user->nickname] = $temp;
                sleep(1);
            }
            return $goods;
        });

        $goodsNew = [];
        foreach ($goods as $nickname => $data) {
            foreach ($data as $gs) {
                if (! isset($gs['goods'])) {
                    continue;
                }
                $gs['nickname'] = $nickname;
                $goodsNew[] = $gs;
            }
        }
        $goods = collect($goodsNew)->sortBy(function ($data) {
            return $data['goods']['name'];
        });

        $goodsTypes = [];
        foreach ($goods as $data) {
            $goodsTypes[] = $data['goods']['goods_type'];
        }

        $goodsTypeNames = [
            '5db663be0d0236567c02b9b2' => '装备类',
            '5db663ba4682c5567589308c' => '装备类',
            '5e0abd35b91dcf09dbdde780' => '强化类',
            '5db663e94682c55675893091' => '其他类',
            '5db663b34682c5567589308b' => '材料类',
            '5db663c84682c5567589308d' => '打造书',
            '5db663d04682c5567589308e' => '打造铁',
            '5db663e24682c55675893090' => '宠物类',
            '5dbd0bec43a0da0d3f4b1001' => '皮毛类',
            '5dd4f2e69d78d6163b6fd556' => '植物类',
            '5dedb5a0f21c607ea82ba0a3' => '技能书',
            '5df08747f4147a6cfaf6e2ad' => '烹饪类',
            '5df08765af0ec237e0bfcbb6' => '炼药类',
        ];

        $goodsTypes = array_unique($goodsTypes);

        $temp = [];
        foreach ($goodsTypes as $goodsType) {
            $temp[$goodsType] = Arr::get($goodsTypeNames, $goodsType, $goodsType);
        }
        $goodsTypes = $temp;

        return view('goods', compact('goods', 'goodsTypes'));
    }
}