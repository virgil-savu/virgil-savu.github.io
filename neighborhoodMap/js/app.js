function myViewModel() {
  var self = this;
  var map;
  var service;
  var infowindow;
  var lat = '';
  var lng = '';
  var torino = new google.maps.LatLng(45.05, 7.666667);
  var markersArray = [];

  // array that holds the info for knockout
  self.allFoundPlaces = ko.observableArray([]);

  // string that holds forsquare information
  self.foursquareInfo = '';

  // Calculates the center of the map and gets the latitude and longitude coordinates
  function calculateCenter() {
    var latAndLng = map.getCenter();
      lat = latAndLng.lat();
      lng = latAndLng.lng();
  }


  /*
  This function loads the map, the search bar and the list.
  */
  function initialize() {
    map = new google.maps.Map(document.getElementById('map-canvas'), {
    center: torino,
    });
    getPlaces();
    calculateCenter();

    var list = (document.getElementById('list'));
    map.controls[google.maps.ControlPosition.RIGHT_CENTER].push(list);
    var input = (document.getElementById('search-input'));
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
    var searchBox = new google.maps.places.SearchBox(
      (input));
    google.maps.event.addListener(searchBox, 'places_changed', function() {
    //When a search is executed removes all markers and the info in allFoundPlaces.

      var places = searchBox.getPlaces();
      clearAll();
      self.allFoundPlaces.removeAll();
      var bounds = new google.maps.LatLngBounds();


      for(var i=0, place; i<10; i++){
        if (places[i] !== undefined){
          place = places[i];
          //After the search is completed, populate markers and allFoundPlaces.
          getallFoundPlaces(place);
          createMarker(place);
          bounds.extend(place.geometry.location);
        }
      }
      map.fitBounds(bounds);
      calculateCenter();
    });
    google.maps.event.addListener(map, 'bounds_changed', function(){
      var bounds = map.getBounds();
      searchBox.setBounds(bounds);
    });

  }
  // Tells the user that Google Maps fails to load.
  function failedToLoad() {
    $('#map-canvas').html("Google Maps Failed to Load");
  }

  /*
  Function that pre-populate the map
  */
  function getPlaces() {
    var request = {
      location: torino,
      radius: 500,
      types: ['pizza','ristorante', 'bar']
    };

    infowindow = new google.maps.InfoWindow();
    service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, callback);
  }

  /*
  Gets the callback from Google and creates a marker for each place.
  Sends info to getallFoundPlaces.
  */
  function callback(results, status){
    if (status == google.maps.places.PlacesServiceStatus.OK){
      bounds = new google.maps.LatLngBounds();
      results.forEach(function (place){
        place.marker = createMarker(place);
        bounds.extend(new google.maps.LatLng(
          place.geometry.location.lat(),
          place.geometry.location.lng()));
      });
      map.fitBounds(bounds);
      results.forEach(getallFoundPlaces);
    }
  }

  /*
  Function to create a marker at each place.

  */
  function createMarker(place) {
    var marker = new google.maps.Marker({
      map: map,
      name: place.name.toLowerCase(),
      position: place.geometry.location,
      place_id: place.place_id
    });
    var address;
    if (place.vicinity !== undefined) {
      address = place.vicinity;
    } else if (place.formatted_address !== undefined) {
      address = place.formatted_address;
    }
    var contentString = '<div style="font-weight: bold">' + place.name + '</div><div>' + address + '</div>' + self.foursquareInfo ;

    google.maps.event.addListener(marker, 'click', function() {
      infowindow.setContent(contentString);
      infowindow.open(map, this);
      map.panTo(marker.position);

    });

    markersArray.push(marker);
    return marker;
  }

  // Our Foursquare Credentials
  var clientID = 'WEBSQPECEG2Z0XV3V5ISFMCM5BQSBBPHHP4Z3C1Y23VUIEDW';
  var clientSecret = 'OLUQRDS2HZIEWPYP5FPJLXQSZUX1SOE5BZAPEWTIXGE4GT03';

  this.getFoursquareInfo = function(point) {
    // creats the foursquare URL
    var foursquareURL = 'https://api.foursquare.com/v2/venues/search?client_id=' + clientID + '&client_secret=' + clientSecret + '&v=20150620' + '&ll=' +lat+ ',' +lng+ '&query=\'' +point.name +'\'&limit=1';

    $.getJSON(foursquareURL)
      .done(function(response) {
        self.foursquareInfo = '<p>Info:<br>';
        var venue = response.response.venues[0];

        // Name
        var venueName = venue.name;
            if (venueName !== null && venueName !== undefined) {
                self.foursquareInfo += 'Name: ' +
                  venueName + '<br>';

            }
        // Phone Number
        var phoneNum = venue.contact.formattedPhone;
            if (phoneNum !== null && phoneNum !== undefined) {
                self.foursquareInfo += 'Tel.: ' +
                  phoneNum + '<br>';

            }

            if (checkIfVenues == 0){
                self.foursquareInfo = ''; // If no info is found it doesn't display the forsquare fields
            }

      });

  };

  /*
  Function that open the info window and pan to the position of the marker, when it's clicked.
  */
  self.clickMarker = function(place) {
    var marker;

    for(var e = 0; e < markersArray.length; e++) {
      if(place.place_id === markersArray[e].place_id) {
        marker = markersArray[e];
        break;
      }
    }
    self.getFoursquareInfo(place);
    map.panTo(marker.position);
    var currentMarkerLat = marker.position.lat();
    var currentMarkerLng = marker.position.lng();
    var streetviewImageURL = 'https://maps.googleapis.com/maps/api/streetview?size=300x150&location='+currentMarkerLat+','+currentMarkerLng+'&heading=0&pitch=0';
    streetviewImage = '<div><img src="'+streetviewImageURL+'" /></div>';
    var contentString = '<div style="font-weight: bold">' + place.name + '</div><div>' + place.address + '</div>' + self.foursquareInfo + streetviewImage;
    infowindow.setContent(contentString);
    infowindow.open(map, marker);


  };


  /*
  Function that gets the information from all the places that we are going to search and also pre-populate.
  */
  function getallFoundPlaces(place){
    var foundPlace = {};
    foundPlace.place_id = place.place_id;
    foundPlace.position = place.geometry.location.toString();
    foundPlace.name = place.name;

    var address;
    if (place.vicinity !== undefined) {
      address = place.vicinity;
    } else if (place.formatted_address !== undefined) {
      address = place.formatted_address;
    }
    foundPlace.address = address;

    self.allFoundPlaces.push(foundPlace);
  }


  /*
  Function that clears any markers in the markersArray.
  */
  function clearAll() {
    for (var i = 0; i < markersArray.length; i++ ) {
     markersArray[i].setMap(null);
    }
    markersArray.length = 0;
  }

  google.maps.event.addDomListener(window, 'load', initialize);
}

//Execute when all scripts are loaded
$( document ).ready(function() {
    ko.applyBindings(new myViewModel());
});