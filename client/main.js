var map;
var points;
var category;
var markers;
let markersArray = [];

// clears search markers from the map
function clearMarkers() {
  for (let i = 0; i < markersArray.length; i++) {
    markersArray[i].setMap(null);
  }
  markersArray.length = 0;
}

function initMap() {
  // method that calculates distance from a specific point
  google.maps.LatLng.prototype.distanceFrom = function (newLatLng) {
    const EarthRadiusMeters = 6378137.0; // meters
    const lat1 = this.lat();
    const lon1 = this.lng();
    const lat2 = newLatLng.lat();
    const lon2 = newLatLng.lng();
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180 ) * Math.cos(lat2 * Math.PI / 180 ) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = EarthRadiusMeters * c;
    return d;
  };

  // method which returns a GLatLng of a point a given distance along the path
  // returns null if the path is shorter than the specified distance
  google.maps.Polyline.prototype.GetPointAtDistance = function (metres) {
    // some awkward special cases
    if (metres === 0) return this.getPath().getAt(0);
    if (metres < 0) return null;
    if (this.getPath().getLength() < 2) return null;
    let dist = 0;
    let olddist = 0;
    for (let i = 1; (i < this.getPath().getLength() && dist < metres); i++) {
      olddist = dist;
      dist += this.getPath().getAt(i).distanceFrom(this.getPath().getAt(i - 1));
    }
    if (dist < metres) {
      return null;
    }
    const p1 = this.getPath().getAt(i - 2);
    const p2 = this.getPath().getAt(i - 1);
    const m = (metres - olddist) / (dist - olddist);
    return new google.maps.LatLng(p1.lat() + (p2.lat() - p1.lat()) * m, p1.lng() +
    (p2.lng() - p1.lng()) * m);
  };

  // method which returns an array of GLatLngs of points a given interval along the path
  google.maps.Polyline.prototype.GetPointsAtDistance = function (metres) {
    let next = metres;
    const points = [];
    // some awkward special cases
    if (metres <= 0) return points;
    let dist = 0;
    let olddist = 0;
    for (var i = 1; (i < this.getPath().getLength()); i++) {
      olddist = dist;
      dist += this.getPath().getAt(i).distanceFrom(this.getPath().getAt(i - 1));
      while (dist > next) {
        const p1 = this.getPath().getAt(i-1);
        const p2 = this.getPath().getAt(i);
        const m = (next - olddist) / (dist - olddist);
        points.push(new google.maps.LatLng(p1.lat() + (p2.lat()-p1.lat()) * m, p1.lng() +
        (p2.lng()- p1.lng()) * m));
        next += metres;
      }
    }
    return points;
  };

  // makes map black and white
  let styledMapType = new google.maps.StyledMapType(
    [
      {
        "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }]
      },
      {
        "elementType": "labels.icon", "stylers": [{ "visibility": "off" }]
      },
      {
        "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }]
      },
      {
        "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f5f5" }]
      },
      {
        "featureType": "administrative.land_parcel", "elementType": "labels.text.fill",
        "stylers": [{ "color": "#bdbdbd" }]
      },
      {
        "featureType": "poi", "elementType": "geometry",
        "stylers": [{ "color": "#eeeeee" }]
      },
      {
        "featureType": "poi", "elementType": "labels.text.fill",
        "stylers": [{ "color": "#757575" }]
      },
      {
        "featureType": "poi.park", "elementType": "geometry",
        "stylers": [{ "color": "#e5e5e5" }]
      },
      {
        "featureType": "poi.park", "elementType": "labels.text.fill",
        "stylers": [{ "color": "#9e9e9e" }]
      },
      {
        "featureType": "road", "elementType": "geometry",
        "stylers": [{ "color": "#ffffff" }]
      },
      {
        "featureType": "road.arterial", "elementType": "labels.text.fill",
        "stylers": [{ "color": "#757575" }]
      },
      {
        "featureType": "road.highway", "elementType": "geometry",
        "stylers": [{ "color": "#dadada" }]
      },
      {
        "featureType": "road.highway", "elementType": "labels.text.fill",
        "stylers": [{ "color": "#616161" }]
      },
      {
        "featureType": "road.local", "elementType": "labels.text.fill",
        "stylers": [{ "color": "#9e9e9e" }]
      },
      {
        "featureType": "transit.line", "elementType": "geometry",
        "stylers": [{ "color": "#e5e5e5" }]
      },
      {
        "featureType": "transit.station", "elementType": "geometry",
        "stylers": [{ "color": "#eeeeee" }]
      },
      {
        "featureType": "water", "elementType": "geometry",
        "stylers": [{ "color": "#c9c9c9" }]
      },
      {
        "featureType": "water", "elementType": "labels.text.fill",
        "stylers": [{ "color": "#9e9e9e" }]
      }
    ], { name: 'Styled Map' });

  // initiate map
  let origin_place_id = null;
  let destination_place_id = null;
  const travel_mode = google.maps.TravelMode.DRIVING;

  map = new google.maps.Map(document.getElementById('map'), {
    mapTypeControl: false,
    center: { lat: 34.0522, lng: -118.2437 },
    zoom: 14,
    disableDefaultUI: true,
    mapTypeControlOptions: {
      mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain',
          'styled_map'],
    },
  });

  // Associate the styled map with the MapTypeId and set it to display
  map.mapTypes.set('styled_map', styledMapType);
  map.setMapTypeId('styled_map');

  const directionsService = new google.maps.DirectionsService;
  // creates directions renderer and changes color of polyline
  const directionsDisplay = new google.maps.DirectionsRenderer({ suppressMarkers: true, polylineOptions: { strokeColor: '#E54D42' } });
  directionsDisplay.setMap(map);

  const origin_input = document.getElementById('origin-input');
  const destination_input = document.getElementById('destination-input');

  const origin_autocomplete = new google.maps.places.Autocomplete(origin_input);
  origin_autocomplete.bindTo('bounds', map);
  const destination_autocomplete = new google.maps.places.Autocomplete(destination_input);
  destination_autocomplete.bindTo('bounds', map);

  function expandViewportToFitPlace(map, place) {
    if (place.geometry.viewport) map.fitBounds(place.geometry.viewport);
    else {
      map.setCenter(place.geometry.location);
      map.setZoom(17);
    }
  }

  // autocomplete origin input
  origin_autocomplete.addListener('place_changed', function() {
    const place = origin_autocomplete.getPlace();
    if (!place.geometry) {
      window.alert("Autocomplete's returned place contains no geometry");
      return;
    }
    expandViewportToFitPlace(map, place);
    clearMarkers();
    // If the place has a geometry, store its place ID and route if we have
    // the other place ID
    origin_place_id = place.place_id;
    route(origin_place_id, destination_place_id, travel_mode,
          directionsService, directionsDisplay);
  });
  // autocomplete destination input box
  destination_autocomplete.addListener('place_changed', function() {
    const place = destination_autocomplete.getPlace();
    if (!place.geometry) {
      window.alert("Autocomplete's returned place contains no geometry");
      return;
    }
    expandViewportToFitPlace(map, place);
    clearMarkers();
    // If the place has a geometry, store its place ID and route if we have the other place ID
    destination_place_id = place.place_id;
    route(origin_place_id, destination_place_id, travel_mode,
          directionsService, directionsDisplay);
  });

  // create the route
  function route(origin_place_id, destination_place_id, travel_mode,
    directionsService, directionsDisplay) {
    if (!origin_place_id || !destination_place_id) return;

    directionsService.route({
      origin: { placeId: origin_place_id },
      destination: { placeId: destination_place_id },
      travelMode: travel_mode,
    }, function (response, status) {
      const path = new google.maps.Polyline({
        path: response.routes[0].overview_path,
      });

      const length = google.maps.geometry.spherical.computeLength(path.getPath());
      const remainingDist = length;
      const result = [];

      // this part adds points to map at specific interval
      // while (remainingDist > 0) {
      //   // result.push(path.GetPointAtDistance(1000*i));
      //   createMarker(map, path.GetPointAtDistance(1000*i), i+" km");
      //   remainingDist -= 1000;
      //   i++;
      // }
      // function createMarker(map, latlng, title) {
      //   var marker = new google.maps.Marker({
      //     position:latlng,
      //     map:map,
      //     title: title
      //     });
      //   }

      // grabs points at a specified distance into an array
      points = path.GetPointsAtDistance(1000);

      if (status === google.maps.DirectionsStatus.OK) directionsDisplay.setDirections(response);
      else window.alert('Directions request failed due to ' + status);
    });
  }
}

// handles search data and sends form data from front to server
$(document).ready(function () {
  // callback used to create info window on each point
  function getInfoCallback(map, content) {
    const infoWindow = new google.maps.InfoWindow({ content: content });
    return function () {
      infoWindow.setContent(content);
      infoWindow.open(map, this);
    };
  }
  // grabs data from third entry form area
  $('#submit').on('click', function () {
    const inputEl = $('#search-input');
    category = inputEl.val();
    points = JSON.stringify(points);
    // makes ajax call sending data from front end to server
    // success function receives yelp data back as response
    $.ajax({
      type: 'POST',
      url: "/",
      dataType: "json",
      data: { category: category, points: points },
      success: function(data) {
        for (var i = 0; i < data.length; i++) {
          let lat = JSON.parse(data[i].location).latitude;
          let ling = JSON.parse(data[i].location).longitude;
          let title = data[i].name;
          let latLing = new google.maps.LatLng(lat, ling);

          let contentString =
          "<div id=infoWindow>"+
          "<h2>"+data[i].name+"</h2>"+
          "<img src="+data[i].rating+"><br>"+
          "<a href="+data[i].url+">Visit the Yelp Page</a>"+
          "</div>";

          // define icon settings (size and image)
          let icon = {
            scaledSize: new google.maps.Size(50, 50),
            url: '../assets/marker1.svg',
          };
          // create markers
          const marker = new google.maps.Marker({
            position: latLing,
            map: map,
            title: data[i].name,
            animation: google.maps.Animation.DROP,
            icon: icon,
          });

          markersArray.push(marker);
          google.maps.event.addListener(marker, 'click', getInfoCallback(map, contentString));
        }
      },
    });
  });
});
