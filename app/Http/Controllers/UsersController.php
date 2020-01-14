<?php


namespace App\Http\Controllers;


use App\Models\User;

class UsersController extends Controller
{
    public function index()
    {
        return User::all();
    }

    public function store()
    {
        return User::create([
            'uuid' => request('uuid'),
            'cookie' => request('cookie'),
        ]);
    }
}