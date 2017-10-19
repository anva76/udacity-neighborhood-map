
/*global ko*/
/*global google*/

// The central location for the Google Map
const MAIN_LOCATION = {lat: 1.3271906, lng: 103.8449238}; // Singapore

// Custom map markers
const BLUE_MARKER = "images/blue_marker.png";
const ORANGE_MARKER = "images/orange_marker.png";

// Initial data for map locations
// *****************************************************************************************
const LOCATIONS = [

 { name: 'National Museum', lat: 1.2966375, lng: 103.8486646, wikiPage: "National_Museum_of_Singapore",
    gPlaceId: 'ChIJD1u-EaMZ2jERaLhNfFkR45I' },


 { name: 'Singapore Zoo', lat: 1.4043485, lng: 103.79302299999995, wikiPage: "Singapore_Zoo",
    gPlaceId: 'ChIJr9wqENkT2jERkRs7pMj6FLQ' },


 { name: 'Gardens by the Bay', lat: 1.2815683, lng: 103.86361320000003, wikiPage: "Gardens_by_the_Bay",
    gPlaceId: 'ChIJMxZ-kwQZ2jERdsqftXeWCWI' },


 { name: 'Singapore Flyer', lat: 1.2892988, lng: 103.8631368, wikiPage: "Singapore_Flyer",
    gPlaceId: 'ChIJzVHFNqkZ2jERboLN2YrltH8' },


 { name: 'Sentosa', lat: 1.2494041, lng: 103.83032090000006, wikiPage: "Sentosa",
    gPlaceId: 'ChIJRYMSeKwe2jERAR2QXVU39vg' },


 { name: 'Marina Bay', lat: 1.283949, lng: 103.85884599999997, wikiPage: "Marina_Bay,_Singapore",
    gPlaceId: 'ChIJ63Hk2AUZ2jERWTUPLfbWx4I' },


 { name: 'Raffles Hotel', lat: 1.2948829, lng: 103.85447909999993, wikiPage: "Raffles_Hotel",
    gPlaceId: 'ChIJwUTKu6UZ2jERwt5ctkU4f2Q' },


 { name: 'Clarke Quay', lat: 1.2906024, lng: 103.84647419999999, wikiPage: "Clarke_Quay",
    gPlaceId: 'ChIJnXwAOKAZ2jERAs-MHs1aDgI' },


 { name: 'Universal Studios Singapore', lat: 1.2540421, lng: 103.82380839999996,
    wikiPage: "Universal_Studios_Singapore",
    gPlaceId: 'ChIJQ6MVplUZ2jERn1LmNH0DlDA' },


 { name: 'Buddha Tooth Relic Temple and Museum', lat: 1.2813993, lng: 103.84426840000003,
    wikiPage: "Buddha_Tooth_Relic_Temple_and_Museum",
    gPlaceId: 'ChIJ0bwmznIZ2jEREOCMNggtIBk' }
];
// **************************************************************************************************

// Info Window HTML content
let infoWindowHTML=`
<div id="info-window" data-bind="template: { name: 'info-window-template', data: viewModel.infoWindow }"></div>
`;
// *****************************************************************************************

// Map location data model
function Location(name, placeId, lat, lng, wikiPage=null, marker=null) {
    this.name = name;
    this.placeId = placeId;
    this.marker = marker;
    this.wikiPage = wikiPage;
    this.lat = lat;
    this.lng = lng;
}

// Info Window view model
function InfoWindowViewModel() {
    var self = this;

    self.infoHeader = ko.observable("");
    self.infoSubHeader = ko.observable("");
    self.infoContent = ko.observableArray("");

    // Initialize the Info Window instance
    self.init = function () {
        self.infoWindow = new google.maps.InfoWindow({
            content: infoWindowHTML
        });
        var isInfoWindowLoaded = false;

        google.maps.event.addListener(self.infoWindow, 'domready', function () {
            if (!isInfoWindowLoaded) {
                ko.applyBindings(self, $("#info-window")[0]);
                isInfoWindowLoaded = true;
           }
        });
    };

    self.close = function () {
        self.infoWindow.close();
    };

    self.open = function(map,marker) {

        self.infoWindow.open(map,marker);
    };

}

// **********************************************************************
// Modal Window view model
function ModalWindowViewModel() {
    var self = this;

    self.modalHeader = ko.observable("");
    self.modalSubHeader = ko.observable("");
    self.modalContent =  ko.observable("");
    self.modalContentRows = ko.observableArray([]);
    self.templateName = ko.observable();

    self.showModal = function() {
       $('#info-modal2').modal('show');
    };

    self.init = function () {
      // Scrolling the content to the top when the modal opens
      $('#info-modal2').on('shown.bs.modal', function () {
          $('#info-content').scrollTop(0);
      });

      ko.applyBindings(self, $("#info-modal2")[0]);
    };

}

// **********************************************************************

// Knockout view model for the Neighborhood Map application
function MapViewModel() {
    var self = this;

    self.mapLocations = [];
    self.detailsData = {};
    self.curMarker = null;

    self.selectedLocation = ko.observable();
    self.locationFilter = ko.observable();
    self.filteredLocations = ko.observableArray();

    self.modalHeader = ko.observable("");
    self.modalContent = ko.observable("");

    // Info Window view object
    self.infoWindow = new InfoWindowViewModel();

    // Modal Window view object
    self.modalWindow = new ModalWindowViewModel();

    // Do the necessary actions if the filter field changes
    self.locationFilter.subscribe(function(newFilter) {

        if (!newFilter) {
            self.filteredLocations(self.mapLocations);

        } else {

            let locs = ko.utils.arrayFilter(self.mapLocations, function (loc) {
                return loc.name.toLowerCase().includes(self.locationFilter().toLowerCase());
            });
            self.filteredLocations(locs);
        }
        self.map.panTo(MAIN_LOCATION);
        self.map.setZoom(12);
        self.selectedLocation(null);
        self.updateMarkers();

    }, self);

    // Update markers according to the search filter
    self.updateMarkers = function () {
        self.curMarker = null;
        self.infoWindow.close();
        for (var i=0; i < self.mapLocations.length; i++) {
            self.mapLocations[i].marker.setMap(null);
            self.mapLocations[i].marker.setIcon(BLUE_MARKER);
            self.mapLocations[i].marker.setAnimation(null);
        }

        for (i=0; i < self.filteredLocations().length; i++) {
            self.filteredLocations()[i].marker.setMap(self.map);
        }

    };

    // Update markers according to the updated selected location
    self.changeCurMarker = function(newLoc) {
        if (self.curMarker !== null) {
            self.curMarker.setIcon(BLUE_MARKER);
            self.curMarker.setAnimation(null);
        }

        if ( (newLoc !== null) && (typeof newLoc !== 'undefined') ) {
            self.curMarker = newLoc.marker;
            self.map.panTo(newLoc.marker.getPosition());
            newLoc.marker.setIcon(ORANGE_MARKER);
            newLoc.marker.setAnimation(google.maps.Animation.BOUNCE);
        } else {
            self.curMarker = null;
        }
    };

    // Do the necessary actions if the selected location changes
    self.selectedLocation.subscribe(function(newLoc) {
        self.changeCurMarker(newLoc);

        if ( (newLoc !== null) && (typeof newLoc !== 'undefined') ) {

            self.getDetailsAndShowInfo(newLoc);
        } else {
            self.infoWindow.close();
        }

    }, self);

    // Initialize map locations
    self.initPlaces = function (){

        for (var i = 0; i < LOCATIONS.length; i++) {
            self.createMapLocation(LOCATIONS[i]);
        }

        // Initialize filtered locations
        self.filteredLocations(self.mapLocations);
    };

    // Create a location and a map marker
    self.createMapLocation = function (loc) {
        let placeLoc = {lat: loc.lat, lng: loc.lng};

        let marker = new google.maps.Marker({
          map: self.map,
          position: placeLoc,
          icon: BLUE_MARKER,
          title: loc.name
        });

        let mapLocation = new Location (loc.name, loc.gPlaceId, loc.lat, loc.lng,
                                    loc.wikiPage, marker);

        marker.mapLoc = mapLocation;
        self.mapLocations.push(mapLocation);

        // Do the necessary actions if a marker is clicked
        google.maps.event.addListener(marker, 'click', function() {

            self.selectedLocation(marker.mapLoc);
            //self.getDetailsAndShowInfo(marker.mapLoc);
        });
    };

    // Request Google details info and open the Info window
    self.getDetailsAndShowInfo = function(location) {

        // Check if Google places data is already present
        if ( location.placeId in self.detailsData) {
            // Open the Info Window
            self.showInfoWindow(location.marker);
            self.updateInfoWindowBody(location.placeId);

        } else {

            let request = { placeId: location.placeId};
            // Get the corresponding Google places data
            self.service.getDetails(request,
              function (place, status) {

                if (status === google.maps.places.PlacesServiceStatus.OK) {

                    // Save the place details
                    let placeId = place.place_id;
                    self.detailsData[placeId] = place;
                    console.log("Google Places info received successfully");

                    // Open the Info Window
                    self.showInfoWindow(location.marker);
                    self.updateInfoWindowBody(placeId);
                } else {

                    let errMsg = "Failed to load Google Places info";
                    alert(errMsg);
                    console.log(errMsg+": "+ place.error_message);
                }
              }
            );
        }

    };


    // Get Google Places user images for the selected location
    self.getGooglePlacesImages = function () {

        let placeId = self.selectedLocation().placeId;

        let imgUrl, extUrl;
        let len = self.detailsData[placeId].photos.length;

        let contentRows = [];
        for (var i=0; i < len; i++ ) {
            imgUrl = self.detailsData[placeId].photos[i].getUrl({'maxWidth': 500, 'maxHeight': 500});
            extUrl = self.detailsData[placeId].photos[i].getUrl({'maxWidth': 1600, 'maxHeight': 1600});
            contentRows.push({imgUrl: imgUrl, extUrl: extUrl, imgTitle: "" });
        }
        // Activate the modal window with the results
        self.modalWindow.modalContentRows([]);

        self.modalWindow.templateName("modal-window-images-template");
        self.modalWindow.modalHeader(self.selectedLocation().name);
        self.modalWindow.modalSubHeader("Google Places user images");
        self.modalWindow.modalContentRows(contentRows);
        self.modalWindow.showModal();

    };

    // Get Wikipedia data for a specific location
    self.getWikiPage = function() {

        let wikiPage = self.selectedLocation().wikiPage;

        // Prepare a url for an ajax request
        let wikiUrl = "https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&redirects=true&titles=";
        wikiUrl += wikiPage+"&callback=?";

        // Make an ajax request to obtain data from Wikipedia
        $.ajax({
            type: "GET",
            url: wikiUrl,
            contentType: "application/json; charset=utf-8",
            timeout : 10000,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {

                let pageKey = Object.keys(data.query.pages)[0];
                let content = data.query.pages[pageKey].extract;

                // Activate the modal window with the content
                self.modalWindow.modalContentRows([]);

                self.modalWindow.templateName("modal-window-text-template");
                self.modalWindow.modalHeader(self.selectedLocation().name);
                self.modalWindow.modalSubHeader("Wikipedia article");
                self.modalWindow.modalContent(content);
                self.modalWindow.showModal();

            },

            error: function (jqXHR, textStatus, errorThrown) {
                let errMsg = "Failed to load Wikipedia data";
                alert(errMsg);
                console.log(errMsg+": "+textStatus);
            }
        });
    };

    // Get the related list of Foursquare venues
    self.getFoursquareInfo = function() {

        // Foursuare credentials for making json requests
        let fsqClientId = "PY3F5WM2VU1YE55GJRB3NAWPUF5BLJCM1AA1ZMF2CHLMYDLT";
        let fsqClientSec = "JXYRM44BDVXGGXDAVKE3MQ5AJSYL5R0DVZBED5KSDTRGQ54J";

        let lat = self.selectedLocation().lat;
        let lng = self.selectedLocation().lng;

        // Prepare a url for an ajax request
        let tempUrl = "https://api.foursquare.com/v2/venues/explore?ll={0},{1}&limit=24&client_id={2}&client_secret={3}&v=20171001";
        let fsqUrl = tempUrl.printf(lat,lng,fsqClientId,fsqClientSec);

        // Perform an ajax request to obtain venue data from Foursquare
        $.ajax({
            type: "GET",
            contentType: "application/json; charset=utf-8",
            dataType: "jsonp",
            timeout : 10000,
            cache: false,
            url: fsqUrl,
            success: function(result, textStatus, jqXHR){
                let data = result.response.groups[0].items;

                let contentRows = [];

                $.each(data, function(index){

                    let name = data[index].venue.name;
                    if (name.length > 20) name = name.substring(0,18)+"...";

                    let iconUrl = '{0}64{1}'.printf(data[index].venue.categories[0].icon.prefix,
                                                    data[index].venue.categories[0].icon.suffix);

                    let extUrl = "https://foursquare.com/v/"+data[index].venue.id;

                    contentRows.push({imgUrl: iconUrl, extUrl: extUrl, imgTitle: name});

                });

                // Activate the modal window with results
                self.modalWindow.modalContentRows([]);

                self.modalWindow.templateName("modal-window-icons-template");
                self.modalWindow.modalHeader(self.selectedLocation().name);
                self.modalWindow.modalSubHeader("Foursquare Venues in this area");
                self.modalWindow.modalContentRows(contentRows);
                self.modalWindow.showModal();

            },
            error: function (jqXHR, textStatus, errorThrown) {
                let errMsg = "Failed to load Foursquare data";
                alert(errMsg);
                console.log(errMsg+": "+textStatus);
            }
        });

    };

    // Get Flickr images for the selected location
    self.getFlickrImages = function () {

        let tempUrl = "https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=f05ce2432c3d3adc2d403eaf67d5d8bd&per_page=30&lat={0}&lon={1}&radius=2&media=photos&format=json&text={2}&jsoncallback=?";

        let lat = self.selectedLocation().lat;
        let lng = self.selectedLocation().lng;
        let text = self.selectedLocation().name;

        // Prepre a url for an ajax request
        let flickrUrl = tempUrl.printf(lat,lng,text);

        // Make the ajax request to obtain Flickr data
        $.ajax({
            type: "GET",
            contentType: "application/json; charset=utf-8",
            dataType: "jsonp",
            timeout: 10000,
            cache: false,
            url: flickrUrl,

            success: function(data, textStatus, jqXHR){

                let contentRows = [];
                for (var i=0;i< data.photos.photo.length;i++) {

                    // Prepare a Flickr image url
                    let tempUrl = "https://farm{0}.staticflickr.com/{1}/{2}_{3}_z.jpg";
                    let imgUrl = tempUrl.printf(data.photos.photo[i].farm,
                                                    data.photos.photo[i].server,
                                                    data.photos.photo[i].id,
                                                    data.photos.photo[i].secret );


                    // Prepare a url for the corresponding Flickr image page
                    tempUrl = "https://www.flickr.com/photos/{0}/{1}";
                    let extUrl = tempUrl.printf(data.photos.photo[i].owner,
                                                data.photos.photo[i].id);

                    let title = data.photos.photo[i].title;
                    if (title.length > 42) title = title.substring(0,40)+" ...";

                    // Add data to the output
                    contentRows.push({ imgUrl: imgUrl, extUrl: extUrl, imgTitle: title });

                }

                // Activate the modal window with results
                self.modalWindow.modalContentRows([]);

                self.modalWindow.templateName("modal-window-images-template");
                self.modalWindow.modalHeader(self.selectedLocation().name);
                self.modalWindow.modalSubHeader("Flickr images");
                self.modalWindow.modalContentRows(contentRows);
                self.modalWindow.showModal();

            },

            error: function (jqXHR, textStatus, errorThrown) {
                let errMsg = "Failed to load Flickr data";
                alert(errMsg);
                console.log(errMsg+": "+textStatus);
            }
        });
    };

    // Open the Google Map info window with a predefined conent and marker
    self.showInfoWindow = function(marker) {
        self.infoWindow.open(self.map, marker);
    };

    // Prepare the content of the Info Window
    self.updateInfoWindowBody = function(placeId) {

        let phoneNum = self.detailsData[placeId].international_phone_number;

        if (!phoneNum) {
            phoneNum = "";
        } else {
            phoneNum = "Tel: "+phoneNum;
        }

        let weekDay="";
        if ( typeof self.detailsData[placeId].opening_hours !== 'undefined') {
            let wd = self.detailsData[placeId].opening_hours.weekday_text;

            for (var i=0;i < wd.length; i++) {
                            weekDay += wd[i]+"<br/>";
            }
        }

        let address = self.detailsData[placeId].formatted_address;
        if (!address) {
            address = "";
        }

        self.infoWindow.infoHeader(self.detailsData[placeId].name);
        self.infoWindow.infoSubHeader(address+"<br/>"+phoneNum);
        self.infoWindow.infoContent(weekDay);
    };

    // Initialize the Google Map object and locations
    self.initMap = function() {
        self.map = new google.maps.Map(document.getElementById('map'), {
             center: MAIN_LOCATION,
             zoom: 12
            });

        self.service = new google.maps.places.PlacesService(self.map);

        self.initPlaces();
        self.infoWindow.init();
        self.modalWindow.init();
        console.log("=> Map created");
    };
}
// *******************************************************************************************
function mapOnError() {
    let msg = "Failed to load Google MAP API";
    alert(msg);
    console.log(msg);
}

// Initialize the application Knockout model
var viewModel = new MapViewModel();
ko.applyBindings(viewModel,$("#left-group")[0]);
