/* place MODEL holds all information for the Places to be displayed*/
var Places = function () {

  var self = this;

  self.Places = ko.observableArray();
  self.apiError = ko.observable(false);

  //IIFE to load data and set up Places Array
  self.loadData = (function () {

    //Get the top 20 restaurants in Turin (Italy)
    var clientID = 'WEBSQPECEG2Z0XV3V5ISFMCM5BQSBBPHHP4Z3C1Y23VUIEDW';
    var clientSecret = 'OLUQRDS2HZIEWPYP5FPJLXQSZUX1SOE5BZAPEWTIXGE4GT03';
    var lat = '45.05';
    var lng = '7.666667';
    var foursquareURL = 'https://api.foursquare.com/v2/venues/search?client_id='+clientID+'&client_secret='+clientSecret+'&v=20150628&ll='+lat+','+lng+'&categoryId=4d4b7105d754a06374d81259&query=Restaurant&limit=20';

    $.getJSON(foursquareURL)
            .done(function(data) {

        var venues = data.response.venues;

        $.each(data.response.venues, function(i, venues){
          //add marker for this place

          var marker = new google.maps.Marker({
                        position: { lat: venues.location.lat , lng : venues.location.lng },
                        title : venues.name,
                        place_id: venues.id
                      });
          //add info window to this place
          var streetviewImageURL = 'https://maps.googleapis.com/maps/api/streetview?size=300x150&location=' + venues.location.lat + ',' + venues.location.lng + '&heading=0&pitch=0';
              streetviewImage = '<div><img src="' + streetviewImageURL + '" /></div>';
          var contentString = '<p><strong>'+venues.name+ '</strong></p>';

          if (venues.location.formattedAddress !== null && venues.location.formattedAddress !== undefined) {
                        contentString += '<p>'+venues.location.formattedAddress+'</p>';
                    }

          if (venues.contact.formattedPhone !== null && venues.contact.formattedPhone !== undefined) {
                        contentString += '<p>Phone: '+venues.contact.formattedPhone+'</p>';
                    }

              contentString += streetviewImage;


                                      //'<p>'+data.response.groups[0].items[i].venue.menu.url+'</p>'+

          var infoWindow = new google.maps.InfoWindow ( {
                            content : contentString
                            });

          self.Places.push({
              'venue' : venues,
              'name' : venues.name,
              'address' : venues.location.formattedAddress,
              'marker': marker,
              'infowindow' : infoWindow
          });
        });

        self.apiError(false);

      }).fail(function(jqxhr, textStatus, error) {
            var err = textStatus + ", " + error;
            console.log("Forsquare Request Failed: " + err);
        });
    })();

};


var myViewModel = function () {

    var self = this;
    var map;
    var service;
    var infowindow;
    var lat = '';
    var lng = '';
    var torino = new google.maps.LatLng(45.05, 7.666667);



  //array of all the places and all info pretaining to each place such as marker, info window etc
  self.place = ko.observable(new Places());

  self.searchTerm = ko.observable('');

  //controls if list is hidden or displayed
  self.toggleListBoolean = ko.observable(true);

  /* MAP */
  self.mapOptions = {
        //center map to Torino - Italy
        center: torino,
        zoom: 14
  };

  // Make sure that Google Maps API is loaded.
  if (typeof google === 'object'  && typeof google.maps === 'object') {

    self.map =  new google.maps.Map(document.getElementById('map-canvas'), self.mapOptions);


    self.map.setCenter({ lat: 45.05, lng: 7.666667});



    self.lastInfoWindow = ko.observable ('');

    /* Display Filtered List, computed based on the search term*/
    self.displayList = ko.computed ( function ( ) {

        var allPlaces = self.place().Places();

        if (self.searchTerm() === '') { //display default list i.e all Places

          //setmap of all markers. (add all makers to this map)
          for (var i = 0; i < allPlaces.length; i++) {

              allPlaces[i].marker.setMap(this.map);

              //event listener to trigger opening of infowindow
              google.maps.event.addListener ( allPlaces[i].marker, 'click', (function(allPlacesCopy) {

                return function () {

                  //check if an info window is not open set this window as last open window
                  if(self.lastInfoWindow() === ''){
                    self.lastInfoWindow(allPlacesCopy.infowindow);
                    allPlacesCopy.infowindow.open( self.map,this);
                    self.map.setCenter(this.getPosition());
                  }
                  //lastinfowindow open close this and set current info window as lastwindow open for the next iteration
                  else {

                    self.lastInfoWindow().close();
                    allPlacesCopy.infowindow.open( self.map,this);
                    self.map.setCenter(this .getPosition());
                    self.lastInfoWindow(allPlacesCopy.infowindow);
                  }

                };
            })(allPlaces[i]) );

          }
          google.maps.event.trigger(self.map, 'resize');
          return allPlaces;
        }
        //search term given, filter according to this term
        else {

          var filteredList = [];
          //search for places matching the search term
          for (var j = 0; j<allPlaces.length; j++) {

            if ( allPlaces[j]['name'].toLowerCase().indexOf(self.searchTerm().toLowerCase()) != -1 ) {

                filteredList.push(allPlaces[j]);

            }
            else { //hide the marker since this is not a display list item

              allPlaces[j].marker.setMap(null);
            }

          }
        }

        return filteredList; //display list will be this filtered list

      },self);
      //handle click events in the list
    self.displayInfo = function () {

      google.maps.event.trigger(this.marker, 'click');

    };

    //set the bounds of the map on window resize to ensure all markers are displayed
     // make sure the map bounds get updated on page resize
    google.maps.event.addDomListener(window, "resize", function() {

      var boundbox = new google.maps.LatLngBounds();
      for ( var i = 0; i < self.place().Places().length; i++ )
      {
        boundbox.extend(self.place().Places()[i].marker.getPosition());
      }
      self.map.setCenter(boundbox.getCenter());
      self.map.fitBounds(boundbox);

    });


  }
  // Tells the user that Google Maps fails to load.
  else
  {
   alert("Google Maps Failed to Load");
  }




};

ko.applyBindings(new myViewModel());