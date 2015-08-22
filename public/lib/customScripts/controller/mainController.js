app.controller('mainController',['$scope','$http','$q','$timeout',function($scope,$http,$q,$timeout){
    var geocoder = new google.maps.Geocoder();
    var canceller ;

    /**
     *	using mapbox.js server tiles for the Map
     **/
    var tiles = L.tileLayer('http://{s}.tiles.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiY2hhdWhhbm1vaGl0IiwiYSI6IjE0YTljYTgyY2IzNDVlMmI0MTZhNzMwOGRkMzI4MGY3In0.vNQxFF8XYPTbbjm7fD72mg',{
                maxZoom: 21,
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors, Points &copy 2012 LINZ'
                        }),latlng = L.latLng(41.8838113, -87.6317489);
    var map = L.map('map', {center: latlng, zoom: 16, layers: [tiles]});
    var markers = L.markerClusterGroup({ chunkedLoading: true });
    
    /**
     * On page load hit the method to get
     * Data from api and show the map
     **/
    getData(map,markers);
    
    /**
     *  Get latlang on click of showlocation button
     *  and show the location on map.
     **/
    $scope.getAddress = function(){
        if ($scope.newPlaceAddress != null || $scope.newPlaceAddress !== undefined) {
            var address = $scope.newPlaceAddress ? $scope.newPlaceAddress : "Chicago" ;
            geocoder.geocode( { 'address': address}, function(results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    var pos = results[0].geometry.location ;
                    map.panTo(new L.LatLng(pos.lat(), pos.lng()));
                    getData(map,markers, pos.lat(), pos.lng());
                } else {
                    alert("Geocode was not successful for the following reason: " + status);
                }
            });
        }
    }
    
    /**
     *  get the map Dragend event and get
     *  The latlng to pass the getData method
     *  to hit the api again
     **/
    
    map.addEventListener('dragend',function(e){
        var lat = e.target.getCenter().lat;
        var lng = e.target.getCenter().lng;
        var distance = e.distance ;
        getData(map,markers,lat,lng, distance);
    });
    
    
    /**
     *	get the map Zoom changed event and
     *	get the Latlng to pass the getData
     *	method to hit the api again .
     **/
    map.addEventListener('zoomend', function(e){
	var lat = e.target.getCenter().lat;
        var lng = e.target.getCenter().lng;
	var ne = e.target.getBounds()._northEast ;
	var center = {'lat':e.target.getCenter().lat, 'lng': e.target.getCenter().lng}
	var distance = getDistance(center, ne);
	getData(map,markers,lat,lng, distance);
    });    

    
    /**
     *  function to get Data from Scorata Api 
     *  and resturn response as required
     **/
    function getData(map,markers, lat, lng, limit){

        if ( typeof lat == undefined || !lat ) lat = 41.8838113  ;
        if ( typeof lng == undefined || !lng ) lng = -87.6317489 ;
        if (typeof limit == undefined || !limit ) limit = 500 ;
        
	if (canceller) canceller.resolve("User Intrupt");
	//creating the defered object
	canceller = $q.defer();
	$scope.showLoder = true ;
        
        $http.get('/showData?lat='+lat+'&lang='+lng+'&limit='+limit, { timeout: canceller.promise })
        .success(function(res,status,config,header){
            for (var i = 0; i < res.length; i++) {
                var response = getContent(res[i]);
                var marker = L.marker(new L.LatLng(res[i].latitude, res[i].longitude), response);
                marker.bindPopup(response);
                markers.addLayer(marker);
            }
            map.addLayer(markers);
	    $scope.showLoder = false ;
	}).error(function(err,status,config,header){
	    $scope.showLoder = false ;
	    $timeout(function(){
		$scope.showLoder = true ;
	    },500);
	    console.log("Error comes in this section", err,status);
	});
    }
    
    
    /**
     *  Customized the data for the onclick
     *  marke popup
     **/
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
                                    '<div class="col-sm-6"><strong>Domestic</strong>:</div>'+
                                    '<div class="col-sm-3">'+ data.domestic + '</div>'+
                                '</div>'+
                                '<div class="row">'+
                                    '<div class="col-sm-6"><strong>Fbi Code</strong>:</div>'+
                                    '<div class="col-sm-3">'+ data.fbi_code + '</div>'+
                                '</div>'+
                                '<div class="row">'+
                                    '<div class="col-sm-6"><strong>Description</strong>:</div>'+
                                    '<div class="col-sm-6">'+ data.description + '</div>'+
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
    
    rad = function(x) {
    	return x * Math.PI / 180;
    };

    getDistance = function(p1, p2) {
	var R = 6378137; // Earth?s mean radius in meter
	var dLat = rad(p2.lat - p1.lat);
	var dLong = rad(p2.lng - p1.lng);
	var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(rad(p1.lat)) * Math.cos(rad(p2.lat)) *
		Math.sin(dLong / 2) * Math.sin(dLong / 2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	var d = (R * c) ;
	return d; // returns the distance in meters
    }
}]);