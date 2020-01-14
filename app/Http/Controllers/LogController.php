<?php


namespace App\Http\Controllers;


use App\Models\Task;
use App\Models\User;
use App\Support\Xx;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

class LogController extends Controller
{
    public function deal(Request $request)
    {
        $data = json_decode($request->input('data'), 1);
        if (Arr::get($data, 'type') == 'task') {
            foreach ($data['data'] as $item) {
                \DB::connection('mongodb')->collection('tasks')
                    ->where('uuid', $item['_id'])
                    ->update(array_merge(
                        [
                            'uuid' => $item['_id'],
                        ],
                        $item
                    ), ['upsert' => true]);
            }
        }
    }

    public function test()
    {

    }
}