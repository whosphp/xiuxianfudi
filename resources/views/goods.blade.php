<html>
<head>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@3.3.7/dist/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous">
    <style>

    </style>
</head>
<body>
<div class="container-fluid">
    <button class="btn btn-default filters-button-group" data-filter="*">All</button>
    @foreach($goodsTypes as $key => $value)
        <button class="btn btn-success filters-button-group" type="button" data-filter="{{ $key }}">{{ $value }}</button>
    @endforeach
    <div class="grid">
        @foreach($goods as $gs)
            <div class="grid-item {{ $gs['goods']['goods_type'] }}" style="{{ $gs['goods']['style'] }}">{{ $gs['goods']['name'] }} x {{ $gs['count'] }} {{ $gs['nickname'] }}</div>
        @endforeach
    </div>
</div>
<script src="https://cdn.bootcss.com/jquery/3.4.1/jquery.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@3.3.7/dist/js/bootstrap.min.js" integrity="sha384-Tc5IQib027qvyjSMfHjOMaLkfuWVxZxUPnCJA7l2mCWNIpG9mGCD8wGNIcPD7Txa" crossorigin="anonymous"></script>
<script src="https://unpkg.com/isotope-layout@3/dist/isotope.pkgd.min.js"></script>
<script>
    // init Isotope
    var $grid = $('.grid').isotope({
        itemSelector: '.grid-item',
        masonry: {
            columnWidth: 200
        }
    });

    // bind filter button click
    $('.filters-button-group').on( 'click', function() {
        var filterValue = $( this ).attr('data-filter');
        let filter
        if (filterValue === '*') {
            filter = '*';
        } else {
            filter = "."+filterValue
        }
        $grid.isotope({ filter: filter });
    });
</script>
</body>
</html>