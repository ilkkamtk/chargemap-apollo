(async () => {
  'use strict';

  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('./sw.js');
    }
    catch (e) {
      console.log(e);
    }
  }

  const apiURL = './graphql';

  // html elements
  const mapSection = document.getElementById('map');
  const infoSection = document.getElementById('info-section');
  const insert = document.getElementById('insert');
  const title = document.getElementById('title');
  const address = document.getElementById('address');
  const info = document.getElementById('info');
  const navbtn = document.getElementById('btn');

  // array for charge icons so that extra icons can be removed
  const layers = [];

  // some properties are null, try to fix them
  const checkNull = (obj) => {
    for (let [key, value] of Object.entries(obj)) {
      if (value === null) {
        obj[key] = '<i class="fas fa-question-circle"></i>';
      }
    }
    return obj;
  };

  // charge station icon

  const fontAwesomeIcon = L.divIcon({
    html: '<i class="fas fa-charging-station fa-2x">',
    className: 'myDivIcon',
  });

  // add map
  const map = L.map('map').setView([60.24, 24.74], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  const geocodeService = L.esri.Geocoding.geocodeService();

  // general fetch from graphql API
  const fetchGraphql = async (query) => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(query),
    };
    try {
      const response = await fetch(apiURL, options);
      const json = await response.json();
      return json.data;
    }
    catch (e) {
      console.log(e);
      return false;
    }
  };

  // show icons on map and set popupopen event to show station info
  const onEachFeature = (feature, layer) => {
    layers.push(layer);
    // does this feature have a property named popupContent?
    if (feature.properties && feature.properties.popupContent) {
      layer.bindPopup(feature.properties.popupContent).on('popupopen', () => {
        mapSection.classList.replace('top-big', 'top-small');
        infoSection.classList.replace('low-small', 'low-big');
        insert.classList.replace('low-big', 'low-small');
        // reset fields
        title.innerHTML = '';
        address.innerHTML = '<i class="fas fa-at"></i>&nbsp;';
        info.innerHTML = '';

        // show info
        const {Title, Town, Address, Connections, Location} = feature.properties;
        title.innerHTML = Title;
        address.appendChild(document.createTextNode(`${Town}, ${Address}`));
        Connections.forEach((connection) => {

          checkNull(connection);
          const {Quantity, ConnectionType, CurrentType, LevelType} = connection;
          let fast = `, fast charge`;
          if (!LevelType.IsFastChargeCapable) {
            fast = '';
          }
          let acdcIcon = '&#9107';
          try {

            if (CurrentType.Title.includes('AC'))
              acdcIcon = '&#9190;';
          }
          catch (e) {
            console.log(e);
          }
          info.innerHTML += `
<div class="connection">
<p><i class="fas fa-plug"></i> ${ConnectionType.Title}</p>
<p><span class="icon">${acdcIcon}</span> ${CurrentType.Title}</p>
<p><i class="fas fa-bolt"></i> ${LevelType.Title}, ${LevelType.Comments}${fast}</p>
<p>Connections: ${Quantity}</p>
</div>
`;
        });
        // navigate button
        console.log('browser', navigator.userAgent.includes('Chrome'));
        if (!navigator.userAgent.includes('Chrome')) {
          navbtn.href = `http://maps.apple.com/?daddr=${Location.coordinates[1]},${Location.coordinates[0]}&dirflg=d`;
        } else {
          navbtn.href = `https://www.google.com/maps/dir/?api=1&destination=${Location.coordinates[1]},${Location.coordinates[0]}&travelmode=driving&dir_action=navigate`;
        }
      });
      layer.setIcon(fontAwesomeIcon);
    }
  };

  // start other functions when
  // map on move + zoom
  map.on('moveend', function() {
    init();
  });

  const init = async () => {
    infoSection.scrollTop = 0;
    const bounds = JSON.stringify(map.getBounds()).
    replace(new RegExp('"', 'g'), '');
    const query = {
      query: `{
      stations(bounds: ${bounds}) {
      Title
        Town
        AddressLine1
        Location {
          type
          coordinates
        }
        Connections {
          Quantity
          ConnectionType {
            Title
          }
          CurrentType {
            Title
          }
          LevelType {
            Title
            Comments
            IsFastChargeCapable
          }
        }
      }
    }`,
    };
    const data = await fetchGraphql(query);
    console.log('data', data);
    if (data) {
      const dbInsert = await stationsToIdb(data);
    }
    const dbRead = await readStations();
    console.log(dbRead.result[0].stations);
    const stations = dbRead.result[0].stations;
    const features = stations.map((station) => {
      const {Title, Town, Location, AddressLine1, Connections} = station;
      return {
        'type': 'Feature',
        'properties': {
          'Title': Title,
          'Town': Town,
          'Address': AddressLine1,
          'Connections': Connections,
          'popupContent': Title,
          'show_on_map': true,
          'Location': Location,
        },
        'geometry': Location,
      };
    });
    layers.forEach(layer => {
      map.removeLayer(layer);
    });

    layers.length = 0;

    L.geoJSON(features, {
      onEachFeature: onEachFeature,
    }).addTo(map);
  };

  // if user position not found
  const reject = (e) => {
    console.log(e);
  };

  // options for getCurrentPosition
  const options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0,
  };

  // add user position
  const center = (position) => {
    const marker = L.marker(
        [position.coords.latitude, position.coords.longitude]).
    addTo(map).
    bindPopup('You are here.').
    openPopup();
    map.panTo(marker.getLatLng());
  };

  // get user location
  navigator.geolocation.getCurrentPosition(center, reject, options);

  // add new station *********************************
  const connForm = document.getElementById('conn-form');
  const conTypes = document.getElementById('connection-type');
  const levTypes = document.getElementById('level');
  const curTypes = document.getElementById('current-type');
  const allConnections = document.getElementById('all-connections');
  const addConnection = document.getElementById('add-connection');
  const quantity = document.querySelector('input[name=quantity]');
  const loc = document.querySelector('input[name=location]');
  const addr = document.querySelector('input[name=address]');
  const stTitle = document.querySelector('input[name=title]');
  const postcode = document.querySelector('input[name=postcode]');
  const town = document.querySelector('input[name=town]');
  const state = document.querySelector('input[name=state]');

  // fetch connectionTypes from graphql API
  const fetchConnectionTypes = async () => {
    const query = {
      query: `{
      connectiontypes {
        id
        Title
      }
    }`,
    };

    const data = await fetchGraphql(query);
    data.connectiontypes.forEach((type) => {
      conTypes.innerHTML += `<option value="${type.id}">${type.Title}</option>`;
    });
  };

  fetchConnectionTypes();

  // fetch levels from graphql API
  const fetchLevels = async () => {
    const query = {
      query: `{
      leveltypes {
        id
        Title
      }
    }`,
    };

    const data = await fetchGraphql(query);
    data.leveltypes.forEach((type) => {
      levTypes.innerHTML += `<option value="${type.id}">${type.Title}</option>`;
    });
  };

  fetchLevels();

  const connections = [];

  const addConnToList = () => {
    const connection = {
      ConnectionTypeID: conTypes.value,
      LevelID: levTypes.value,
      CurrentTypeID: curTypes.value,
      Quantity: parseInt(quantity.value),
    };
    connections.push(connection);
    console.log(connections);
    allConnections.innerHTML += `<article id="conn-${connections.length -
    1}">
    <a href="#" onclick="removeConnection(${connections.length - 1}); return false;"><i class="fas fa-window-close fa-2x"></i></a>
    <p><strong>Connection type:</strong> ${conTypes.options[conTypes.selectedIndex].text}</p>
    <p><strong>Level:</strong> ${levTypes.options[levTypes.selectedIndex].text}</p>
    <p><strong>Current type:</strong> ${curTypes.options[curTypes.selectedIndex].text}</p>
    <p><strong>Quantity:</strong> ${quantity.value}</p>
    </article>
  `;
  };

  addConnection.addEventListener('click', addConnToList);

  const removeConnection = (index) => {
    connections[index] = undefined;
    const element = document.getElementById('conn-' + index);
    element.parentNode.removeChild(element);
    console.log(connections);
  };

  // fetch current types from graphql API
  const fetchCurrentTypes = async () => {
    const query = {
      query: `{
    currenttypes {
      id
      Description
    }
  }`,
    };

    const data = await fetchGraphql(query);
    data.currenttypes.forEach((type) => {
      curTypes.innerHTML += `<option value="${type.id}">${type.Description}</option>`;
    });
  };

  fetchCurrentTypes();

  const locToForm = (evt) => {
    console.log(evt.latlng);
    loc.value = `${evt.latlng.lng}, ${evt.latlng.lat}`;
    geocodeService.reverse().latlng(evt.latlng).run((error, result) => {
      if (error) {
        return;
      }
      console.log(result);
      addr.value = result.address.Address;
      postcode.value = result.address.Postal;
      town.value = result.address.City;
      state.value = result.address.Subregion;
    });
  };

  const getLocation = () => {
    map.on('click', locToForm);
  };

  const stopGetLocation = () => {
    map.off('click', locToForm);
  };

  const bigMap = () => {
    mapSection.classList.replace('top-small', 'top-big');
  };

  const startResizeMap = () => {
    map.on('click', bigMap);
    infoSection.classList.replace('low-big', 'low-small');
  };

  const stopResizeMap = () => {
    map.off('click', bigMap);
  };

  startResizeMap();

  const add = document.querySelector('header a');
  add.addEventListener('click', (evt) => {
    evt.preventDefault();
    stopResizeMap();
    getLocation();
    infoSection.classList.replace('low-big', 'low-small');
    insert.classList.replace('low-small', 'low-big');
    mapSection.classList.replace('top-big', 'top-small');
  });

  const cancel = document.querySelector('#reset');
  cancel.addEventListener('click', (evt) => {
    stopGetLocation();
    startResizeMap();
    insert.classList.replace('low-big', 'low-small');
    mapSection.classList.replace('top-small', 'top-big');

  });

  connForm.addEventListener('submit', async (evt) => {
    evt.preventDefault();
    const filteredConnections = connections.filter(conn => conn !== undefined);
    const query = {
      query: `mutation {
  addStation(
    Connections: ${JSON.stringify(filteredConnections).
      replace(/\"([^(\")"]+)\":/g, '$1:')},
    Postcode: "02600",
    Title: "${stTitle.value}",
    AddressLine1: "${addr.value}",
    StateOrProvince: "${state.value}",
    Town: "${town.value}",
    Location: {
      coordinates: [${loc.value}]
    }
  )
  {
    AddressLine1
    Town
  }
}
`,
    };
    const result = await fetchGraphql(query);
    console.log(result);
    if (result) {
      connections.forEach((conn, index) => {
        removeConnection(index);
      });
      connForm.reset();
      init();
    } else {
      alert('hä');
    }
  });

  // indexedDB stuff
  const indexedDB = window.indexedDB || window.mozIndexedDB ||
      window.webkitIndexedDB || window.msIndexedDB;
  const request = indexedDB.open('stationDB', 1);
  let db;
  request.onsuccess = (event) => {
    db = request.result;
  };

  request.onupgradeneeded = () => {
    let db = request.result;
    db.createObjectStore('stationList', {autoIncrement: true});
  };

  const stationsToIdb = (data) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['stationList'], 'readwrite');

      transaction.oncomplete = (event) => {
        console.log('stationsToIdb transaction complete', event);
        resolve(true);
      };

      transaction.onerror = (event) => {
        reject('stationsToIdb transaction error');
      };

      // create an object store on the transaction
      const objectStore = transaction.objectStore('stationList');

      // add our newItem object to the object store
      const objectStoreRequest = objectStore.put(data, 0);

      objectStoreRequest.onsuccess = (event) => {
        // report the success of the request (this does not mean the item
        // has been stored successfully in the DB - for that you need transaction.oncomplete)
        console.log('stationsToIdb success', event);
      };
    });
  };

  const readStations = () => {
    return new Promise((resolve, reject) => {
      // open a read/write db transaction, ready for retrieving the data
      const transaction = db.transaction(['stationList'], 'readwrite');

      transaction.oncomplete = (event) => {
        console.log('readStations transaction complete');
        resolve(objectStoreRequest);
      };

      transaction.onerror = (event) => {
        reject('readStations transaction error');
      };

      // create an object store on the transaction
      const objectStore = transaction.objectStore('stationList');
      console.log(objectStore);

      // Make a request to get a record by key from the object store
      const objectStoreRequest = objectStore.getAll();

      objectStoreRequest.onsuccess = (event) => {
        console.log('osr', objectStoreRequest);
      };
    });
  };
})();




