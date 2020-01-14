<?php

use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::resource('users', 'UsersController');
Route::get('getFactionTasksValued', 'ApiController@getFactionTasksValued');
Route::get('getUserInfo/{name}', 'ApiController@getUserInfo');
Route::get('getUserGoods/{name}', 'ApiController@getUserGoods');
Route::post('log', 'LogController@deal');
Route::get('test', 'LogController@test');

Route::middleware('auth:api')->get('/user', function (Request $request) {
    return $request->user();
});
