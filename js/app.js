
// The central location for the Google Map
const main_location = {lat: 1.3271906, lng: 103.8449238}; // Singapore

// Custom map markers 
const blue_marker = "images/blue_marker.png";
const orange_marker = "images/orange_marker.png";

// Initial data for map locations
// *****************************************************************************************
const locations = [
  
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

// Some html templates for the modal and info windows
// ******************************************************************************************************
let modalHeader =`
<div class='info-header'>{0}</div>
<div class='sub-info-header'>{1}</div>
`;

let wikiModalBody = `
<div class='info-text'>{0}</div>
`;

let fsqModalBodyBegin=`
<div class='row'>
`;

let fsqModalBody =`
<div class="col-md-4">
 <a href='https://foursquare.com/v/{0}' target="_blank">
 <img class='info-icon' src='{1}' width='64' height='64'>
 <h5>{2}</h5>
 </a>
</div>
`;

let fsqModalBodyEnd=`
</div>
`;

let placesModalBodyBegin=`
<div class='row'>
`;

let placesModalBody=`
<div class="col-md-12 places-img">
<a href='{0}' target="_blank">
  <img src='{1}' width='460'>
</a>
</div>
`;

let placesModalBodyEnd=`
</div>
`;

let flrModalBodyBegin=`
<div class='row'>
`;

let flrModalBody=`
<div class="col-md-12 places-img">
 <a href='{0}' target="_blank">
  <img src='{1}' width='460'>
  <h5>{2}</h5>
 </a>
</div>
`;

let flrModalBodyEnd=`
</div>
`;

let infoWindowBody=`
<div class='info-header'>{0}</div>
<div class='sub-info-header margin-bottom-5'>{1}<br/>{2}</div>
<p>{3}</p>
<hr/>
<button type='button' class='btn btn-default btn-sm' onclick='viewModel.getFoursquareInfo()'>Foursquare</button>
<button type='button' class='btn btn-default btn-sm' onclick='viewModel.getGooglePlacesImages(viewModel.selectedLocation().placeId)'>Google Places</button>
<button type='button' class='btn btn-default btn-sm' onclick='viewModel.getWikiPage()'>Wikipedia</button>
<button type='button' class='btn btn-default btn-sm' onclick='viewModel.getFlickrImages()'>Flickr</button>
`;
// *****************************************************************************************

// Scroll the content to the top when the modal opens
$('#info-modal').on('shown.bs.modal', function () {
    $('#info-content').scrollTop(0);
});

// Map location data model
function Location(name, placeId, lat, lng, wikiPage=null, marker=null) {
    this.name = name;
    this.placeId = placeId;
    this.marker = marker;
    this.wikiPage = wikiPage;
    this.lat = lat;
    this.lng = lng;
}

// Knockout view model for the Neighborhood Map application
function MapViewModel() {
    var self = this;

    self.mapLocations = [];
    self.detailsData = {};
    self.curMarker = null;

    self.selectedLocation = ko.observable();
    self.locationFilter = ko.observable();

    self.filteredLocations = ko.observableArray();
        
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
        self.map.panTo(main_location);
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
            self.mapLocations[i].marker.setIcon(blue_marker);
            self.mapLocations[i].marker.setAnimation(null);
        }

        for (i=0; i < self.filteredLocations().length; i++) {
            self.filteredLocations()[i].marker.setMap(self.map);
        }

    };

    // Update markers according to the updated selected location
    self.changeCurMarker = function(newLoc) {
        if (self.curMarker !== null) {
            self.curMarker.setIcon(blue_marker);
            self.curMarker.setAnimation(null);
        }

        if ( (newLoc !== null) && (typeof newLoc !== 'undefined') ) {
            self.curMarker = newLoc.marker;
            self.map.panTo(newLoc.marker.getPosition());
            newLoc.marker.setIcon(orange_marker);
            newLoc.marker.setAnimation(google.maps.Animation.BOUNCE);
        } else {
            self.curMarker = null;
        }
    };

    // Do the necessary actions if the selected location changes
    self.selectedLocation.subscribe(function(newLoc) {
        self.changeCurMarker(newLoc);

        if ( (newLoc !== null) && (typeof newLoc !== 'undefined') ) {
            self.showDetailsInfoWindow(self.curMarker.mapLoc);
        } else {
            self.infoWindow.close();
        }

    }, self);

    // Initialize map locations
    self.initPlaces = function (){

        for (var i = 0; i < locations.length; i++) {
            self.createMapLocation(locations[i]);
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
          icon: blue_marker,
          title: loc.name
        });

        let mapLocation = new Location (loc.name, loc.gPlaceId, loc.lat, loc.lng, 
                                    loc.wikiPage, marker);

        marker.mapLoc = mapLocation;
        self.mapLocations.push(mapLocation);

        // Do the necessary actions if a marker is clicked
        google.maps.event.addListener(marker, 'click', function() {

            self.selectedLocation(marker.mapLoc);
            self.showDetailsInfoWindow(marker.mapLoc);
        });
    };

    // Request Google details info and open the Info window
    self.showDetailsInfoWindow = function(location) {

        // Check if Google places data is already present
        if ( location.placeId in self.detailsData) {
            // Open the Info Window
            self.showInfoWindow(self.prepareInfoWindowBody(location.placeId), location.marker);
                
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
                    self.showInfoWindow(self.prepareInfoWindowBody(placeId), location.marker);
                } else {

                    let errMsg = "Failed to load Google Places info";
                    alert(errMsg);
                    console.log(errMsg);
                }
              }
            );
        }

    };

    // Open the Google Map info window with a predefined conent and marker
    self.showInfoWindow = function(content, marker) {
        self.infoWindow.setContent(content);
        self.infoWindow.open(self.map, marker);
    };

    // Prepare the content of the Info Window
    self.prepareInfoWindowBody = function(placeId) {

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

        return infoWindowBody.printf(self.detailsData[placeId].name, 
                                           self.detailsData[placeId].formatted_address,
                                           phoneNum, weekDay);

    };

    // Get Google Places user images for the selected location
    self.getGooglePlacesImages = function (placeId) {
        let imgUrl, imgUrl2;
        let len = self.detailsData[placeId].photos.length;
        
        let output = "";
        for (var i=0; i < len; i++ ) {
            imgUrl = self.detailsData[placeId].photos[i].getUrl({'maxWidth': 500, 'maxHeight': 500});
            imgUrl2 = self.detailsData[placeId].photos[i].getUrl({'maxWidth': 1600, 'maxHeight': 1600});
            output += placesModalBody.printf(imgUrl2,imgUrl);
        }
        // Activate the modal window with the results
        self.showModal(modalHeader.printf(self.selectedLocation().name,"Google Places user images"),
                            placesModalBodyBegin+output+placesModalBodyEnd);

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

                // Extract the content and remove "gallery elements", which do not work anyway
                let content = $("<div></div>").html(data.query.pages[pageKey].extract);
                content.find('.gallerybox').remove();
                content.find('.gallery').remove();
                content.find( "[id*='gallery']" ).remove();
                content.find( "[id*='Gallery']" ).remove();

                // Activate the modal window with the content
                self.showModal(modalHeader.printf(self.selectedLocation().name,"Wikipedia article"),
                                wikiModalBody.printf(content.html()));

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
                let data = result.response.groups[0].items
                
                let content="";
                $.each(data, function(index){
        
                    let url = data[index].venue.url;
                    let name = data[index].venue.name;
                    if (name.length > 20) name = name.substring(0,18)+"...";

                    let iconUrl = '{0}64{1}'.printf(data[index].venue.categories[0].icon.prefix,
                                                    data[index].venue.categories[0].icon.suffix);

                    content += fsqModalBody.printf(data[index].venue.id,iconUrl,name);
                })

                // Activate the modal window with results
                self.showModal(modalHeader.printf(self.selectedLocation().name,"Foursquare Venues in this area"),
                                fsqModalBodyBegin+content+fsqModalBodyEnd);

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

        // Flickr credentials for json requests
        let flrKey = "f05ce2432c3d3adc2d403eaf67d5d8bd";
        let flrSecret = "d429d1371fddae36";

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
                let output = "";

                for (var i=0;i< data.photos.photo.length;i++) {

                    // Prepare a Flickr image url
                    let tempUrl = "https://farm{0}.staticflickr.com/{1}/{2}_{3}_z.jpg";
                    let fImgUrl = tempUrl.printf(data.photos.photo[i].farm,
                                                    data.photos.photo[i].server,
                                                    data.photos.photo[i].id,
                                                    data.photos.photo[i].secret );


                    // Prepare a url for the corresponding Flickr image page
                    tempUrl = "https://www.flickr.com/photos/{0}/{1}";
                    let fPageUrl = tempUrl.printf(data.photos.photo[i].owner,
                                                data.photos.photo[i].id);

                    let title = data.photos.photo[i].title;
                    if (title.length > 42) title = title.substring(0,40)+" ...";

                    // Add data to the output
                    output += flrModalBody.printf(fPageUrl,fImgUrl,title);
                }

                // Activate the modal window with results
                self.showModal(modalHeader.printf(self.selectedLocation().name,"Flickr images"),
                                flrModalBodyBegin+output+flrModalBodyEnd);
            },

            error: function (jqXHR, textStatus, errorThrown) {
                let errMsg = "Failed to load Flickr data";
                alert(errMsg);
                console.log(errMsg+": "+textStatus);
            }
        });
    };

    // Show a modal window with specified content
    self.showModal = function (header,body) {
        $('#info-lab').html(header);
        $('#info-content').html(body);
        $('#info-modal').modal('show');
    };


    // Initialize the Google Map object and locations
    self.initMap = function() {
        self.map = new google.maps.Map(document.getElementById('map'), {
             center: main_location,
             zoom: 12
            });

        self.service = new google.maps.places.PlacesService(self.map);
        self.infoWindow = new google.maps.InfoWindow();
        self.initPlaces();
        $( "#loc-filter" ).focus();
        console.log("* Map created");
    };
}

// Initialize the application Knockout model
var viewModel = new MapViewModel();
ko.applyBindings(viewModel);
