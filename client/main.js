// function App(options) {
//   $(options.root).text(options.text);
//   $(options.root).css('background', options.background);
// }

var map;
var searchpoints = 0;
var points;
var category;
var markers;

function initMap() {

  // method that calculates distance from
  google.maps.LatLng.prototype.distanceFrom = function(newLatLng) {
    var EarthRadiusMeters = 6378137.0; // meters
    var lat1 = this.lat();
    var lon1 = this.lng();
    var lat2 = newLatLng.lat();
    var lon2 = newLatLng.lng();
    var dLat = (lat2-lat1) * Math.PI / 180;
    var dLon = (lon2-lon1) * Math.PI / 180;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180 ) * Math.cos(lat2 * Math.PI / 180 ) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = EarthRadiusMeters * c;
    return d;
  }

  // method which returns a GLatLng of a point a given distance along the path
  // returns null if the path is shorter than the specified distance
  google.maps.Polyline.prototype.GetPointAtDistance = function(metres) {
    // some awkward special cases
    if (metres == 0) return this.getPath().getAt(0);
    if (metres < 0) return null;
    if (this.getPath().getLength() < 2) return null;
    var dist=0;
    var olddist=0;
    for (var i=1; (i < this.getPath().getLength() && dist < metres); i++) {
      olddist = dist;
      dist += this.getPath().getAt(i).distanceFrom(this.getPath().getAt(i-1));
    }
    if (dist < metres) {
      return null;
    }
    var p1= this.getPath().getAt(i-2);
    var p2= this.getPath().getAt(i-1);
    var m = (metres-olddist)/(dist-olddist);
    return new google.maps.LatLng( p1.lat() + (p2.lat()-p1.lat())*m, p1.lng() + (p2.lng()-p1.lng())*m);
  }

  // method which returns an array of GLatLngs of points a given interval along the path
  google.maps.Polyline.prototype.GetPointsAtDistance = function(metres) {
    var next = metres;
    var points = [];
    // some awkward special cases
    if (metres <= 0) return points;
    var dist=0;
    var olddist=0;
    for (var i=1; (i < this.getPath().getLength()); i++) {
      olddist = dist;
      dist += this.getPath().getAt(i).distanceFrom(this.getPath().getAt(i-1));
      while (dist > next) {
        var p1= this.getPath().getAt(i-1);
        var p2= this.getPath().getAt(i);
        var m = (next-olddist)/(dist-olddist);
        points.push(new google.maps.LatLng( p1.lat() + (p2.lat()-p1.lat())*m, p1.lng() + (p2.lng()-p1.lng())*m));
        next += metres;
      }
    }
    return points;
  }

  // initiate map
  var origin_place_id = null;
  var destination_place_id = null;
  var travel_mode = google.maps.TravelMode.DRIVING;

  map = new google.maps.Map(document.getElementById('map'), {
    mapTypeControl: false,
    center: {lat: 34.0522, lng: -118.2437},
    zoom: 14,
    disableDefaultUI: true,
  });


  var directionsService = new google.maps.DirectionsService;
  var directionsDisplay = new google.maps.DirectionsRenderer;
  directionsDisplay.setMap(map);

  var origin_input = document.getElementById('origin-input');
  var destination_input = document.getElementById('destination-input');

  var origin_autocomplete = new google.maps.places.Autocomplete(origin_input);
  origin_autocomplete.bindTo('bounds', map);
  var destination_autocomplete =
      new google.maps.places.Autocomplete(destination_input);
  destination_autocomplete.bindTo('bounds', map);

  function expandViewportToFitPlace(map, place) {
    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      map.setCenter(place.geometry.location);
      map.setZoom(17);
    }
  }

  // autocompletes origin input
  origin_autocomplete.addListener('place_changed', function() {
    var place = origin_autocomplete.getPlace();
    if (!place.geometry) {
      window.alert("Autocomplete's returned place contains no geometry");
      return;
    }
    expandViewportToFitPlace(map, place);

    // If the place has a geometry, store its place ID and route if we have
    // the other place ID
    origin_place_id = place.place_id;
    route(origin_place_id, destination_place_id, travel_mode,
          directionsService, directionsDisplay);
  });

  // autocompletes destination input
  destination_autocomplete.addListener('place_changed', function() {
    var place = destination_autocomplete.getPlace();
    if (!place.geometry) {
      window.alert("Autocomplete's returned place contains no geometry");
      return;
    }
    expandViewportToFitPlace(map, place);

    // If the place has a geometry, store its place ID and route if we have
    // the other place ID
    destination_place_id = place.place_id;
    route(origin_place_id, destination_place_id, travel_mode,
          directionsService, directionsDisplay);
  });

  // create the route
  function route(origin_place_id, destination_place_id, travel_mode,
                 directionsService, directionsDisplay) {
    if (!origin_place_id || !destination_place_id) {
      return;
    }

    directionsService.route({
      origin: {'placeId': origin_place_id},
      destination: {'placeId': destination_place_id},
      travelMode: travel_mode
    }, function(response, status) {

      console.log(response);
      // let path = response.routes[0].overview_path.map(function(item) {
      //   let lat = item.lat();
      //   let ling = item.lng();
      //   return new google.maps.LatLng(lat, ling);
      // });
      let i = 1;
      let path = new google.maps.Polyline({
        path: response.routes[0].overview_path,
      });

      let length = google.maps.geometry.spherical.computeLength(path.getPath());
      console.log(length);

      let remainingDist = length;
      let result = [];

      // adds points to map at specific interval
      while (remainingDist > 0) {
        // result.push(path.GetPointAtDistance(1000*i));
        createMarker(map, path.GetPointAtDistance(1000*i), i+" km");
        remainingDist -= 1000;
        i++;
      }
      function createMarker(map, latlng, title){
        var marker = new google.maps.Marker({
          position:latlng,
          map:map,
          title: title
          });
        }

      // grabs points at a specified distance into an array
      points = path.GetPointsAtDistance(1000);
      console.log(points);

      // let distance = response.routes[0].legs[0].distance.value;
      // console.log('distance '+distance);
      // console.log('steps ', JSON.stringify(steps));
      // points = [];
      // let increment = Math.round(steps.length/5);
      //
      // if (distance < 500) {
      //   points.push(steps[Math.round(steps.length/2)]);
      // } else {
      //   // points.push(steps[0]);
      //   for (var i = 1; i < steps.length; i += increment) {
      //     console.log(steps[i])
      //     points.push(steps[i]);
      //   }
      //   // points = JSON.stringify(points);
      // }
      // console.log(points);
      // console.log(points.length);
      // for (var i = 0; i < points.length; i++) {
      //   lat = points[i].lat();
      //   ling = points[i].lng();
      //
      //   latLing = new google.maps.LatLng(lat, ling);
      //   console.log(JSON.stringify(latLing));
      //
      //   marker = new google.maps.Marker({
      //     position: latLing,
      //     map: map,
      //     title: 'Yelp Business',
      //   });
      // }

      if (status === google.maps.DirectionsStatus.OK) {
        directionsDisplay.setDirections(response);
      } else {
        window.alert('Directions request failed due to ' + status);
      }
    });
  }
}


$(document).ready(function(){

  $("#search-input").on("keydown", function(event) {
    if (event.which === 13) {
      var inputEl = $("#search-input");
      category = inputEl.val();
      inputEl.val('');
      points = JSON.stringify(points);
      console.log(points);

        $.ajax({
    	    type: 'POST',
    	    url: "/",
    	    dataType: "json",
    	    data: { category: category, points: points },
    	    success: function(data) {
    	    	// var marker;
    	    	// var latLing = {lat: 33.8381996154785, lng: -117.870178222656};
    	    	// var lat;
    	    	// var ling;
    	    	console.log("data from frontend "+JSON.stringify(data));
            //
    	    	// for (var i = 0; i < data.length; i++){
    	    	// 	// console.log(i)
    	    	// 	// console.log(data[i].location.latitude);
    	    	// 	// console.log(data[i].location.longitude)
            //
    	    	// 	// latLing = {}
    	    	// 	lat = data[i].location.latitude;
    	    	// 	ling = data[i].location.longitude;
    	    	// 	// latLing.lat = lat;
    	    	// 	// latLing.lng = ling;
    	    	// 	// console.log(latLing);
            //   latLing = new google.maps.LatLng(lat, ling);
            //   console.log(JSON.stringify(latLing));
            //
    	    	// 	marker = new google.maps.Marker({
    	    	// 		position: latLing,
            // 		map: map,
            //     title: 'Yelp Business',
    	    	// 	});
    	    	// }
    	    }
        });
      }
    });
});
