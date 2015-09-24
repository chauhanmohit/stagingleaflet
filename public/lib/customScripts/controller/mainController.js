app.controller('mainController',['$scope','$http','$q','$timeout',function($scope,$http,$q,$timeout){
    var geocoder = new google.maps.Geocoder();
    var canceller ;
    $scope.newPlaceAddress = '' ;
    $scope.crimeType = ["THEFT","ASSAULT","BATTERY","ROBBERY"] ;
    $scope.search = {
	'lat' : 41.8838113,
	'lang' : -87.6317489,
	'radius' : 500,
	'zoomLevel':10,
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
    $scope.map = L.map('map', {center: latlng, zoom: 5, layers: [tiles]});
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
	$scope.search.zoomLevel = e.target.getZoom();
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
	//parseInt($scope.map.getZoom() ) < 10 ? $scope.search.zoomLevel = $scope.map.getZoom() : 10 ;
	$scope.search.zoomLevel = $scope.map.getZoom();
	$scope.search.radius = radius ;
    }
    
    
    /**
     *	marker onclick event get
     **/
//    $scope.markers.on('click',function(e){
//	console.log(e);
//	var layer = e.target;
//	var hazardIconHighlight = L.icon({
//	    iconUrl: "/map-icon/marker-icon.png",
//	    iconSize: [16, 16],
//	    iconAnchor: [8, 8],
//	    popupAnchor: [0, 0],
//	    shadowUrl: "/map-icon/marker-shadow.png",
//	    shadowSize: [24, 24],
//	    shadowAnchor: [12, 12]
//	});
//	layer.setIcon(layer.options.icon == arms ? stop : arms);
//	//var m = e.layer.options.icon.options.className ;
//	//m.className = 'marker-cluster-mystyleMarker' ;
//	//console.log(m, e.layer.options.icon.options.className);
//	//console.log(e);
//	//var mymarker = $scope.markers ;        
//	//var hazardIconHighlight = L.icon({
//	//    iconUrl: "/map-icon/marker-icon.png",
//	//    iconSize: [16, 16],
//	//    iconAnchor: [8, 8],
//	//    popupAnchor: [0, 0],
//	//    shadowUrl: "/map-icon/marker-shadow.png",
//	//    shadowSize: [24, 24],
//	//    shadowAnchor: [12, 12]
//	//});
//	//
//	//e.layer.setIcon(hazardIconHighlight);
//    });
    
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
					    iconSize:     [25, 41], // size of the icon
					    shadowSize:   [25, 41], // size of the shadow
					}
				    });
	var defaultIcon = new LeafIcon({iconUrl: '/map-icon/marker-icon.png'});
			

        $http.get('/api/web/data.json?lat='+$scope.search.lat+'&lang='+$scope.search.lang+'&radius='+$scope.search.radius+'&zoomLevel='+$scope.search.zoomLevel ,
	{ timeout: canceller.promise })
        .success(function(res,status,config,header){
	    if (parseInt($scope.map.getZoom()) < 11) {
		$scope.removeOldMarkers();
		$scope.serverData = res ;
		for (var i = 0; i < res.length; i++) {
		    if (res[i].center == undefined || res[i].center == null) {
			console.log("there is not undefined center");
		    }else {
			if((res[i].center.latitude &&  res[i].center.longitude) && (res[i].center.latitude !== null &&  res[i].center.longitude !== null)) {
			$scope.response = getContent(res[i]);
			var marker = L.marker(new L.LatLng(res[i].center.latitude, res[i].center.longitude),{icon:defaultIcon});
			var customOptions ={'maxWidth': '250','className' : 'customPopup'}
			marker.bindPopup($scope.response,customOptions);
			if (marker !== null) $scope.markers.removeLayer(marker);
			$scope.markers.addLayer(marker);   
			}
		    }
		}
		$scope.map.addLayer($scope.markers);
		$scope.showLoder = false ;
	    }else{
		console.log("length is",res.length);
		for(var i=0; i < res.length; i++){
		    $scope.removeOldMarkers();
		    $scope.serverData = res ;
		    for (var i = 0; i < res.length; i++) {
		        if (res[i].latitude == undefined || res[i].longitude == null) {
		    	console.log("there is not undefined center");
		        }else {
			    var response = res[i].type = 'sex_offender' ? getContent1(res[i]) : res[i].type = 'crime' ? getContent2(res[i]): 'No Data' ;
			    var marker = L.marker(new L.LatLng(res[i].latitude, res[i].longitude),{icon:defaultIcon});
			    marker.bindPopup(response);
			    if (marker !== null) $scope.markers.removeLayer(marker);
			    $scope.markers.addLayer(marker);   
		        }
		    }
		    $scope.map.addLayer($scope.markers);
		    $scope.showLoder = false ;    
		}
	    }
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
                                    '<div class="col-sm-6"><strong>Agency Name</strong>:</div>'+
                                    '<div class="col-sm-3">'+ data.agency_name + '</div>'+
                                '</div>' +
                                '<div class="row">'+
                                    '<div class="col-sm-6"><strong>City</strong>:</div>'+
                                    '<div class="col-sm-3">'+ data.city + '</div>'+
                                '</div>'+
                                '<div class="row">'+
                                    '<div class="col-sm-6"><strong>Agency Type</strong>:</div>'+
                                    '<div class="col-sm-3">'+ data.agency_type + '</div>'+
                                '</div>'+
                                '<div class="row">'+
                                    '<div class="col-sm-6"><strong>Agency Id</strong>:</div>'+
                                    '<div class="col-sm-6">'+ data.agency_id + '</div>'+
                                '</div>'+
                                '<div class="row">'+
                                    '<div class="col-sm-6"><strong>Email</strong>:</div>'+
                                    '<div class="col-sm-3">'+ data.email + '</div>'+
                                '</div>'+
                                '<div class="row">'+
                                    '<div class="col-sm-6"><strong>TipSoft Id</strong>:</div>'+
                                    '<div class="col-sm-3">'+ data.tipsoft_id + '</div>'+
                                '</div>'+
                                '<div class="row">'+
                                    '<div class="col-sm-6"><strong>State</strong>:</div>'+
                                    '<div class="col-sm-6">'+ data.state + '</div>'+
                                '</div>'+
                                '<div class="row">'+
                                    '<div class="col-sm-6"><strong>Zip code</strong>:</div>'+
                                    '<div class="col-sm-3">'+ data.zip + '</div>'+
                                '</div>'+
                                '<div class="row">'+
                                    '<div class="col-sm-6"><strong>center</strong>:</div>'+
                                    '<div class="col-sm-3">('+ data.center.latitude+','+data.center.longitude + ')</div>'+
                                '</div>'+
                            '</div>';
	return infoData ;
    }
    
    /**
     *  Customized the data for the onclick
     *  marke popup
     **/
    function getContent1(data) {

	var infoData = '<div class="CustomData">'+
                                '<div class="row">'+
                                    '<div class="col-sm-6"><strong>Type</strong>:</div>'+
                                    '<div class="col-sm-3">'+ data.type  + '</div>'+
                                '</div>' +				
                                '<div class="row">'+
                                    '<div class="col-sm-6"><strong>sex_offender id</strong>:</div>'+
                                    '<div class="col-sm-3">'+ data.sex_offender_id + '</div>'+
                                '</div>' +
                                '<div class="row">'+
                                    '<div class="col-sm-6"><strong>state_id</strong>:</div>'+
                                    '<div class="col-sm-3">'+ data.state_id + '</div>'+
                                '</div>'+
                                '<div class="row">'+
                                    '<div class="col-sm-6"><strong>name</strong>:</div>'+
                                    '<div class="col-sm-3">'+ data.name + '</div>'+
                                '</div>'+
                                '<div class="row">'+
                                    '<div class="col-sm-6"><strong>created_at</strong>:</div>'+
                                    '<div class="col-sm-6">'+ data.created_at + '</div>'+
                                '</div>'+
                                '<div class="row">'+
                                    '<div class="col-sm-6"><strong>address_1</strong>:</div>'+
                                    '<div class="col-sm-3">'+ data.address_1 + '</div>'+
                                '</div>'+
                                '<div class="row">'+
                                    '<div class="col-sm-6"><strong>photo_url</strong>:</div>'+
                                    '<div class="col-sm-3">'+ data.photo_url + '</div>'+
                                '</div>'+
                                '<div class="row">'+
                                    '<div class="col-sm-6"><strong>age</strong>:</div>'+
                                    '<div class="col-sm-6">'+ data.age + '</div>'+
                                '</div>'+
                            '</div>';
	return infoData ;
    }
    
    /**
     *  Customized the data for the onclick
     *  marke popup
     **/
    function getContent2(data) {
	var infoData = '<div class="CustomData">'+
				'<div class="row">'+
                                    '<div class="col-sm-6"><strong>Type</strong>:</div>'+
                                    '<div class="col-sm-3">'+ data.type + '</div>'+
                                '</div>' +
                                '<div class="row">'+
                                    '<div class="col-sm-6"><strong>arrest</strong>:</div>'+
                                    '<div class="col-sm-3">'+ data.arrest ? data.arrest : data.name + '</div>'+
                                '</div>' +
                                '<div class="row">'+
                                    '<div class="col-sm-6"><strong>case_number</strong>:</div>'+
                                    '<div class="col-sm-3">'+ data.case_number + '</div>'+
                                '</div>'+
                                '<div class="row">'+
                                    '<div class="col-sm-6"><strong>date</strong>:</div>'+
                                    '<div class="col-sm-3">'+ data.date + '</div>'+
                                '</div>'+
                                '<div class="row">'+
                                    '<div class="col-sm-6"><strong>description</strong>:</div>'+
                                    '<div class="col-sm-6">'+ data.description + '</div>'+
                                '</div>'+
                                '<div class="row">'+
                                    '<div class="col-sm-6"><strong>location_description</strong>:</div>'+
                                    '<div class="col-sm-3">'+ data.location_description ? data.location_description : data.address_1 + '</div>'+
                                '</div>'+
                                '<div class="row">'+
                                    '<div class="col-sm-6"><strong>id</strong>:</div>'+
                                    '<div class="col-sm-3">'+ data.id + '</div>'+
                                '</div>'+
                                '<div class="row">'+
                                    '<div class="col-sm-6"><strong>primary_type</strong>:</div>'+
                                    '<div class="col-sm-6">'+ data.primary_type + '</div>'+
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
