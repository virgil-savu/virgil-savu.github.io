/* Create the model to hold all the informations about the locations that will be displayed*/
var Places = function() {

    var self = this;

    self.places = ko.observableArray();


    //Immediately-Invoked Function Expression to set up the places array
    self.loadData = (function() {

        //Get the top 20 restaurants in Turin (Italy)
        var clientID = 'WEBSQPECEG2Z0XV3V5ISFMCM5BQSBBPHHP4Z3C1Y23VUIEDW';
        var clientSecret = 'OLUQRDS2HZIEWPYP5FPJLXQSZUX1SOE5BZAPEWTIXGE4GT03';
        var lat = '45.05';
        var lng = '7.666667';
        var foursquareURL = 'https://api.foursquare.com/v2/venues/search?client_id=' + clientID + '&client_secret=' + clientSecret + '&v=20150628&ll=' + lat + ',' + lng + '&categoryId=4d4b7105d754a06374d81259&query=Restaurant&limit=20';

        $.getJSON(foursquareURL)
            .done(function(data) {

                var venues = data.response.venues;

                $.each(data.response.venues, function(i, venues) {
                    //Create a marker for each place

                    var marker = new google.maps.Marker({
                        position: {
                            lat: venues.location.lat,
                            lng: venues.location.lng
                        },
                        title: venues.name,
                        place_id: venues.id
                    });
                    //Information about the place
                    var streetviewImageURL = 'https://maps.googleapis.com/maps/api/streetview?size=300x150&location=' + venues.location.lat + ',' + venues.location.lng + '&heading=0&pitch=0';
                    streetviewImage = '<div><img src="' + streetviewImageURL + '" /></div>';
                    var contentString = '<p><strong>' + venues.name + '</strong></p>';

                    if (venues.location.formattedAddress !== null && venues.location.formattedAddress !== undefined) {
                        contentString += '<p>' + venues.location.formattedAddress + '</p>';
                    }

                    if (venues.contact.formattedPhone !== null && venues.contact.formattedPhone !== undefined) {
                        contentString += '<p>Phone: ' + venues.contact.formattedPhone + '</p>';
                    }

                    contentString += streetviewImage;

                    var infoWindow = new google.maps.InfoWindow({
                        content: contentString
                    });

                    self.places.push({
                        'venue': venues,
                        'name': venues.name,
                        'address': venues.location.formattedAddress,
                        'marker': marker,
                        'infowindow': infoWindow
                    });
                });



            }).fail(function(jqxhr, textStatus, error) {
                var err = textStatus + ", " + error;
                console.log("Forsquare Request Failed: " + err);

            });
    })();

};

/*My View Model - to display the map, the list and the search input*/
var myViewModel = function() {

    var self = this;



    //Array of all the places
    self.place = ko.observable(new Places());

    self.searchTerm = ko.observable('');

    //controls if list is hidden or displayed
    self.toggleListBoolean = ko.observable(true);

    /* MAP Options*/
    self.mapOptions = {
        //Center the map to Turin ITALY

        center: {
            lat: 45.05,
            lng: -117.823056
        },
        zoom: 14
    };

    if (typeof google === 'object' && typeof google.maps === 'object') {

        self.map = new google.maps.Map(document.getElementById('map-canvas'), self.mapOptions);

        self.map.setCenter({
            lat: 45.05,
            lng: 7.666667
        });
        self.lastInfoWindow = ko.observable('');

        //Diplay the filtered list
        self.displayList = ko.computed(function() {

            var allPlaces = self.place().places();

            if (self.searchTerm() === '') { //Default diplay all places

                //Add all markers to the map
                for (var i = 0; i < allPlaces.length; i++) {

                    allPlaces[i].marker.setMap(this.map);

                    //Event trigger to open infoWindow
                    google.maps.event.addListener(allPlaces[i].marker, 'click', (function(allPlacesCopy) {

                        return function() {

                            //Check if an info window is not open set this window as last open window
                            if (self.lastInfoWindow() === '') {
                                self.lastInfoWindow(allPlacesCopy.infowindow);
                                allPlacesCopy.infowindow.open(self.map, this);
                                self.map.setCenter(this.getPosition());
                            }
                            //lastinfowindow open close this and set current info window as lastwindow open
                            else {

                                self.lastInfoWindow().close();
                                allPlacesCopy.infowindow.open(self.map, this);
                                self.map.setCenter(this.getPosition());
                                self.lastInfoWindow(allPlacesCopy.infowindow);
                            }

                        };
                    })(allPlaces[i]));

                }
                google.maps.event.trigger(self.map, 'resize');
                return allPlaces;
            }
            //Filter the list according to the search term
            else {

                var filteredList = [];
                //Search for matching
                for (var j = 0; j < allPlaces.length; j++) {

                    if (allPlaces[j]['name'].toLowerCase().indexOf(self.searchTerm().toLowerCase()) != -1) {

                        filteredList.push(allPlaces[j]);

                    } else { //Hide the marker

                        allPlaces[j].marker.setMap(null);
                    }

                }
            }
            //Display yhefiltered list
            return filteredList;

        }, self);
        //Display infoWindow when click item in the list
        self.displayInfo = function() {

            google.maps.event.trigger(this.marker, 'click');

        };

        //Set the bounds of the map on window resize to ensure all markers are displayed
        // make sure the map bounds get updated on page resize
        google.maps.event.addDomListener(window, "resize", function() {

            var boundbox = new google.maps.LatLngBounds();
            for (var i = 0; i < self.place().places().length; i++) {
                boundbox.extend(self.place().places()[i].marker.getPosition());
            }
            self.map.setCenter(boundbox.getCenter());
            self.map.fitBounds(boundbox);

        });
        //no error

    }
    //Error on map loading
    else {
        document.getElementById('map-canvas').html("Google Maps Failed to Load");

    }

    //Hide or display list
    self.toggleList = function() {

        self.toggleListBoolean() ? self.toggleListBoolean(false) : self.toggleListBoolean(true);

    };


};

ko.applyBindings(new myViewModel());
