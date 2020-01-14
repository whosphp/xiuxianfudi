<?php


namespace App\Http\Controllers;


use App\Models\Task;
use App\Support\Xx;

class ApiController extends Controller
{
    public function getFactionTasksValued()
    {
        return Task::where('task_type', 4)
            ->where('who_task_value', 1)
            ->select('uuid')
            ->get()
            ->pluck('uuid');
    }

    public function getUserInfo($name)
    {
        return Xx::getUserInfo($name);
    }

    public function getUserGoods($name)
    {
        return Xx::getUserGoods($name);
    }
}