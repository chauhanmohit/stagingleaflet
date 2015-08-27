app.controller('mainController',['$scope','$http','$q','$timeout',function($scope,$http,$q,$timeout){
    var geocoder = new google.maps.Geocoder();
    var canceller ;
    $scope.newPlaceAddress = '' ;
    $scope.crimeType = ["THEFT","ASSAULT","BATTERY","ROBBERY"] ;
    $scope.search = {
	'lat' : 41.8838113,
	'lang' : -87.6317489,
	'radius' : 500,
	'from' : '2012-09-14',
	'to' : '2012-12-25',
	'type': ["THEFT","ASSAULT","BATTERY","ROBBERY"],
	'arrest': 'true', 
     } ;

    /**
     *	using mapbox.js server tiles for the Map
     **/
    var tiles = L.tileLayer('http://{s}.tiles.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiY2hhdWhhbm1vaGl0IiwiYSI6IjE0YTljYTgyY2IzNDVlMmI0MTZhNzMwOGRkMzI4MGY3In0.vNQxFF8XYPTbbjm7fD72mg',{
                maxZoom: 21,
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors, Points &copy 2012 LINZ'
                        }),latlng = L.latLng($scope.search.lat, $scope.search.lang);
    $scope.map = L.map('map', {center: latlng, zoom: 16, layers: [tiles]});
    $scope.markers = L.markerClusterGroup({ chunkedLoading: true });
    
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
		    $scope.search.lat = pos.lat() ;
		    $scope.search.lang = pos.lng();
                    $scope.map.panTo(new L.LatLng(pos.lat(), pos.lng()));
		    $scope.map.setZoom(16);
		    $scope.$apply();
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
    
    $scope.map.on('dragend',function(e){
	$scope.search.lat = e.target.getCenter().lat;
	$scope.search.lang = e.target.getCenter().lng;
	$scope.search.radius = e.distance < 1000 ? e.distance = 1000 : e.distance ;
	$scope.$apply();
    });

    /**
     *	get the map Zoom changed event and
     *	get the Latlng to pass the getData
     *	method to hit the api again .
     **/
    $scope.map.on('zoomend', function(e){
	var ne = e.target.getBounds()._northEast ;
	var center = {'lat':e.target.getCenter().lat, 'lng': e.target.getCenter().lng}
	var distance = getDistance(center, ne);
	$scope.search.lat = e.target.getCenter().lat;
	$scope.search.lang = e.target.getCenter().lng;
	$scope.search.radius = distance < 1000 ? distance = 1000 : distance ;
	$scope.$apply();
    });
    
    /**
     *	get the radius according to the viewport
     *	on initial map load
     **/
    $scope.getRadiusOnLoad = function(){
	var ne = $scope.map.getBounds()._northEast ;
	var pos = $scope.map.getCenter();
	var center = {'lat':pos.lat, 'lng': pos.lng}
	var distance = getDistance(center, ne);
	var cal = parseFloat((distance*10)/100) ;
	var radius = parseFloat(distance + cal) ;
	$scope.search.radius = radius ;
    }
    
    /**
     *  function to get Data from Scorata Api 
     *  and resturn response as required
     **/
    $scope.getData = function (){
	$scope.getRadiusOnLoad();
        if (typeof $scope.search.lat == undefined || !$scope.search.lat ) $scope.search.lat = 41.8838113  ;
        if (typeof $scope.search.lang == undefined || !$scope.search.lang ) $scope.search.lang = -87.6317489 ;
        if (typeof $scope.search.radius == undefined || !$scope.search.radius ) $scope.search.radius = 500 ;
	if (typeof $scope.search.from == undefined || !$scope.search.from) $scope.search.from = '2012-09-14' ;
	if (typeof $scope.search.to == undefined || !$scope.search.to) $scope.search.to = '2012-12-25';
	if (canceller) canceller.resolve("User Intrupt");
	
	//creating the defered object
	 
	canceller = $q.defer();
	$scope.showLoder = true ;
	var LeafIcon = L.Icon.extend({
					options: {
					    shadowUrl: '/map-icon/marker-shadow.png',
					    iconSize:     [45, 45], // size of the icon
					    shadowSize:   [41, 41], // size of the shadow
					}
				    });
	var greenIcon = new LeafIcon({iconUrl: '/map-icon/mark1.png'}),
			redIcon = new LeafIcon({iconUrl: '/map-icon/mark2.png'}),
			orangeIcon = new LeafIcon({iconUrl: '/map-icon/mark3.png'}),
			purpleIcon = new LeafIcon({iconUrl: '/map-icon/mark4.png'}),
			defaultIcon = new LeafIcon({iconUrl: '/map-icon/marker-icon.png'});
			
	//$http.post('/api/web/data.json', { 'data': $scope.search })
        $http.get('/api/web/data.json?lat='+$scope.search.lat+'&lang='+$scope.search.lang+'&radius='+$scope.search.radius+'&from='+$scope.search.from+'&to='+$scope.search.to+'&type='+$scope.search.type+'&arrest='+$scope.search.arrest ,
	{ timeout: canceller.promise })
        .success(function(res,status,config,header){
	    $scope.removeOldMarkers();
            for (var i = 0; i < res.length; i++) {
                var response = getContent(res[i]);
		var image = res[i].primary_type == 'ASSAULT' ? redIcon : res[i].primary_type == 'ROBBERY' ? orangeIcon : res[i].primary_type == 'BATTERY' ? purpleIcon : res[i].primary_type == 'BATTERY' ? defaultIcon: greenIcon ;
                var marker = L.marker(new L.LatLng(res[i].latitude, res[i].longitude),{icon: image});
                marker.bindPopup(response);
		if (marker !== null) $scope.markers.removeLayer(marker);
                $scope.markers.addLayer(marker);
            }
            $scope.map.addLayer($scope.markers);
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
     * remove all the previous markers from
     * the map before loading new markers
     **/
    
    $scope.removeOldMarkers = function(){
	$scope.markers.clearLayers();
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
                                    '<div class="col-sm-3">'+ data.year + '</div>'+
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
    
    /**
     *	jquery code for the Date rage picker slider
     **/
    $("#slider").dateRangeSlider();
    $('#slider').bind('valuesChanged',function(e, data){
	var f = new Date(data.values.min);
	var t = new Date(data.values.max);
	var from = f.toISOString().slice(0,10);
	var to = t.toISOString().slice(0,10);
	$scope.search.from = from ;
	$scope.search.to = to ;
	$scope.$apply();
    });
    
    // watcher for  search change
    $scope.$watchCollection('search' , function(n,o){
	if(n !== o ){
	    $scope.getData();
	}
    });
    
    $scope.$watchCollection('search.type' , function(n,o){
	if(n !== o ){
	    $scope.getData();
	}
    });
    
}]); 