
// sets up my mapbox access token so they can track my usage of their basemap services
mapboxgl.accessToken = 'pk.eyJ1IjoibWlsaW1hcHMiLCJhIjoiY2p1bXhxcHdqMHYzajRlczhsMnN6cGx6ciJ9.dRiK8JSG4Q0kReMYqNveUg';


//dark-v9
// zoom and center to show only the parts of Gowanus that are part of the tour
var map = new mapboxgl.Map({
  container: 'mapContainer',
  style: 'mapbox://styles/mapbox/light-v10',
  center: [-73.99, 40.679],
  zoom: 15.5,
});

// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());


// a helper function for looking up colors and descriptions for NYC land use codes
var LandUseLookup = (code) => {
  switch (code) {
    case 1:
      return {
        color: '#ffffb3',
        description: '1 & 2 Family',
      };
    case 2:
      return {
        color: '#fdb462',
        description: 'Multifamily Walk-up',
      };
    case 3:
      return {
        color: '#fccde5',
        description: 'Multifamily Elevator',
      };
    case 4:
      return {
        color: '#fb8072',
        description: 'Mixed Res. & Commercial',
      };
    case 5:
      return {
        color: '#8dd3c7',
        description: 'Commercial & Office',
      };
    case 6:
      return {
        color: '#bebada',
        description: 'Industrial & Manufacturing',
      };
    case 7:
      return {
        color: '#dac0e8',
        description: 'Transportation & Utility',
      };
    case 8:
      return {
        color: '#80b1d3',
        description: 'Public Facilities & Institutions',
      };
    case 9:
      return {
        color: '#b3de69',
        description: 'Open Space & Outdoor Recreation',
      };
    case 10:
      return {
        color: '#d9d9d9',
        description: 'Parking Facilities',
      };
    case 11:
      return {
        color: '#5f5f60',
        description: 'Vacant Land',
      };
    case 12:
      return {
        color: '#5f5f60',
        description: 'Other',
      };
    default:
      return {
        color: '#5f5f60',
        description: 'Other',
      };
  }
};

// use jquery to programmatically create a Legend
// for numbers 1 - 11, get the land use color and description
for (var i=1; i<12; i++) {
  // lookup the landuse info for the current iteration
  const landuseInfo = LandUseLookup(i);

  // this is a simple jQuery template, it will append a div to the legend with the color and description
  $('.legend').append(`
    <div>
      <div class="legend-color-box" style="background-color:${landuseInfo.color};"></div>
      ${landuseInfo.description}
    </div>
  `)
}

// we can't add our own sources and layers until the base style is finished loading
map.on('style.load', function() {

  // let's hack the basemap style a bit
  // you can use map.getStyle() in the console to inspect the basemap layers
  map.setPaintProperty('water', 'fill-color', '#a4bee8')

  // this sets up the geojson as a source in the map, which I can use to add visual layers
  map.addSource('pluto-gowanus', {
    type: 'geojson',
    data: './data/pluto-gowanus.geojson',
  });

  // add a custom-styled layer for tax lots
  map.addLayer({
    id: 'gowanus-lots-fill',
    type: 'fill',
    source: 'pluto-gowanus',
    paint: {
      'fill-opacity': 0.7,
      'fill-color': {
        type: 'categorical',
        property: 'landuse',
        stops: [
            [
              '01',
              LandUseLookup(1).color,
            ],
            [
              "02",
              LandUseLookup(2).color,
            ],
            [
              "03",
              LandUseLookup(3).color,
            ],
            [
              "04",
              LandUseLookup(4).color,
            ],
            [
              "05",
              LandUseLookup(5).color,
            ],
            [
              "06",
              LandUseLookup(6).color,
            ],
            [
              "07",
              LandUseLookup(7).color,
            ],
            [
              "08",
              LandUseLookup(8).color,
            ],
            [
              "09",
              LandUseLookup(9).color,
            ],
            [
              "10",
              LandUseLookup(10).color,
            ],
            [
              "11",
              LandUseLookup(11).color,
            ],
          ]
        }
    }
  }, 'waterway-label')

  // add an outline to the tax lots which is only visible after zoom level 14.8
  map.addLayer({
    id: 'gowanus-lots-line',
    type: 'line',
    source: 'pluto-gowanus',
    paint: {
      'line-opacity': 0.7,
      'line-color': 'gray',
      'line-opacity': {
        stops: [[14, 0], [14.8, 1]], // zoom-dependent opacity, the lines will fade in between zoom level 14 and 14.8
      }
    }
  });

  // add an empty data source, which we will use to highlight the lot the user is hovering over
  map.addSource('highlight-feature', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: []
    }
  })

  // add a layer for the highlighted lot
  map.addLayer({
    id: 'highlight-line',
    type: 'line',
    source: 'highlight-feature',
    paint: {
      'line-width': 3,
      'line-opacity': 0.9,
      'line-color': 'black',
    }
  });

  // when the mouse moves, do stuff!
  map.on('mousemove', function (e) {
    // query for the features under the mouse, but only in the lots layer
    var features = map.queryRenderedFeatures(e.point, {
        layers: ['gowanus-lots-fill'],
    });

    // get the first feature from the array of returned features.
    var lot = features[0]

    if (lot) {  // if there's a lot under the mouse, do stuff
      map.getCanvas().style.cursor = 'pointer';  // make the cursor a pointer

      // lookup the corresponding description for the land use code
      var landuseDescription = LandUseLookup(parseInt(lot.properties.landuse)).description;
      var bblFormat = toString(lot.properties.bbl);

      // use jquery to display the address, bbl, land use description to the sidebar
      $('#address').text(lot.properties.address);
      $('#bbl').text(lot.properties.bbl);
      $('#landuse').text(landuseDescription);

      // set this lot's polygon feature as the data for the highlight source
      map.getSource('highlight-feature').setData(lot.geometry);
    } else {
      map.getCanvas().style.cursor = 'default'; // make the cursor default

      // reset the highlight source to an empty featurecollection
      map.getSource('highlight-feature').setData({
        type: 'FeatureCollection',
        features: []
      });
    }
  })
})

tourSites.forEach(function(fundayData) {
  var thissiteColor = 'steelblue';
  if (fundayData.type === 'required') thissiteColor = '#d95f0e';
  if (fundayData.type === 'optional') thissiteColor = '#8c96c6';

  new mapboxgl.Marker({
    color: thissiteColor,
  })
    .setLngLat([fundayData.lon, fundayData.lat])
    .setPopup(new mapboxgl.Popup({ offset: 40 })
      .setText(`Site ${fundayData.site} is located at ${fundayData.name}, ${fundayData.address}.`))
    .addTo(map);
})


map.addSource('route', {
  type: 'geojson',
  data: './data/route.geojson',
});

map.addLayer({
  id: 'route-line',
  type: 'line',
  source: 'route',
  paint: {
    'line-width': 5,
    'line-opacity': 0.9,
    'line-color': '#d95f0e',
  }
})
