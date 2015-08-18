$(document).ready(function(){
        var geocoder = new google.maps.Geocoder();
        var tiles = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        maxZoom: 35,
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors, Points &copy 2012 LINZ'
                }),
                latlng = L.latLng(41.8838113, -87.6317489);
        var map = L.map('map', {center: latlng, zoom: 13, layers: [tiles]});
        var markers = L.markerClusterGroup({ chunkedLoading: true });
        
        showData(map,markers);
        
        map.on('dragend',function(e){
            console.log("the lat long is:",e.target._animateToCenter.lat, e.target._animateToCenter.lng , e.distance );
            showData(map,markers,e.target._animateToCenter.lat, e.target._animateToCenter.lng , e.distance)
        });

    
        $('#addrBtn').click(function(){
            var addr = $('#addr').val();
            var address = addr ? addr : "Chicago" ;
            geocoder.geocode( { 'address': address}, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                    var pos = results[0].geometry.location ;
                    map.panTo(new L.LatLng(pos.lat(), pos.lng()));
                    showData(map,markers, pos.lat(), pos.lng());
                } else {
                    alert("Geocode was not successful for the following reason: " + status);
                }
            });   
        });  
        
 });

    function showData(map,markers, lat, lng, limit){
        $("#showOverlay").show(function(){
            $("#showLoder").show();       
        });
        if ( typeof lat == undefined || !lat ) lat = 41.8838113  ;
        if ( typeof lng == undefined || !lng ) lng = -87.6317489 ;
        if (typeof limit == undefined || !limit ) limit = 500 ;
        $.getJSON('/showData?lat='+lat+'&lang='+lng+'&limit='+limit,function(res){
            for (var i = 0; i < res.length; i++) {
                var response = getContent(res[i]);
                var marker = L.marker(new L.LatLng(res[i].latitude, res[i].longitude), response);
                marker.bindPopup(response);
                markers.addLayer(marker);
            }
            map.addLayer(markers);
            $("#showOverlay").hide(function(){
                $("#showLoder").hide();       
            });
        });
    }
    
    function getContent(data) {
	var infoData = '<div class="CustomData">'+
                                '<div class="row">'+
                                    '<div class="col-sm-6"><strong>Arrest</strong>:</div>'+
                                    '<div class="col-sm-3">'+ data.arrest + '</div>'+
                                '</div>' +
                                '<div class="row">'+
                                    '<div class="col-sm-6"><strong>Beat</strong>:</div>'+
                                    '<div class="col-sm-3">'+ data.beat + '</div>'+
                                '</div>'+
                                '<div class="row">'+
                                    '<div class="col-sm-6"><strong>Case Number</strong>:</div>'+
                                    '<div class="col-sm-3">'+ data.case_number + '</div>'+
                                '</div>'+
                                '<div class="row">'+
                                    '<div class="col-sm-6"><strong>Date</strong>:</div>'+
                                    '<div class="col-sm-6">'+ new Date(data.date) + '</div>'+
                                '</div>'+
                                '<div class="row">'+
                                    '<div class="col-sm-6"><strong>Description</strong>:</div>'+
                                    '<div class="col-sm-3">'+ data.description + '</div>'+
                                '</div>'+
                                '<div class="row">'+
                                    '<div class="col-sm-6"><strong>Domestic</strong>:</div>'+
                                    '<div class="col-sm-3">'+ data.domestic + '</div>'+
                                '</div>'+
                                '<div class="row">'+
                                    '<div class="col-sm-6"><strong>Fbi Code</strong>:</div>'+
                                    '<div class="col-sm-3">'+ data.fbi_code + '</div>'+
                                '</div>'+
                                '<div class="row">'+
                                    '<div class="col-sm-6"><strong>Description</strong>:</div>'+
                                    '<div class="col-sm-3">'+ data.description + '</div>'+
                                '</div>'+
                                '<div class="row">'+
                                    '<div class="col-sm-6"><strong>Primary Type</strong>:</div>'+
                                    '<div class="col-sm-3">'+ data.primary_type + '</div>'+
                                '</div>'+
                                '<div class="row">'+
                                    '<div class="col-sm-6"><strong>Year</strong>:</div>'+
                                    '<div class="col-sm-3">'+ data.arrest + '</div>'+
                                '</div>'+
                            '</div>';
	return infoData ;
    }
