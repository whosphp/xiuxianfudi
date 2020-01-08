<?php


namespace App\Models;


use Jenssegers\Mongodb\Eloquent\Model;

class Base extends Model
{
    protected $connection = 'mongodb';
}