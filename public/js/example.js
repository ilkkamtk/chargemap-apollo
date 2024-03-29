(async () => {
  'use strict';

  const apiURL = './graphql';

  // html elements
  const mapSection = document.getElementById('map');
  const infoSection = document.getElementById('info-section');
  const insert = document.getElementById('insert-section');
  const title = document.getElementById('title');
  const address = document.getElementById('address');
  const info = document.getElementById('info');
  const navbtn = document.getElementById('btn');

  // functions to open/close panels
  const closeLow = () => {
    const openPanels = document.querySelectorAll('.low-big');
    for (const element of openPanels) {
      element.classList.replace('low-big', 'low-small');
    }
  };

  const openMap = () => {
    mapSection.classList.replace('top-small', 'top-big');
  };

  const closeMap = () => {
    mapSection.classList.replace('top-big', 'top-small');
  };

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
  const map = L.map('map', {zoomControl: false}).setView([60.24, 24.74], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  const geocodeService = L.esri.Geocoding.geocodeService({
    // API Key to be passed to the ArcGIS Online Geocoding Service
    apikey: 'AAPK65dba25da0c34e3d8d00a9f207095dafmZRVUGDeZ_mL0AkR7Y7yMFcd7oqAP7kPCnVvbaMHV_KRpomgpMTu8OFIox77WzwV',
  });

  // general fetch from stationResolver API
  const fetchGraphql = async (query) => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token'),
      },
      body: JSON.stringify(query),
    };
    try {
      const response = await fetch(apiURL, options);
      const json = await response.json();
      if(!response.ok) {
        return json.errors[0].message;
      }
      return json.data;
    } catch (e) {
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
        closeLow();
        closeMap();
        infoSection.classList.replace('low-small', 'low-big');
        // reset fields
        title.innerHTML = '';
        address.innerHTML = '<i class="fas fa-at"></i>&nbsp;';
        info.innerHTML = '';

        // show info
        const {
          Title,
          Town,
          Address,
          Connections,
          Location,
          id,
        } = feature.properties;
        title.innerHTML = Title;
        address.appendChild(document.createTextNode(`${Town}, ${Address}`));
        Connections.forEach((connection) => {

          checkNull(connection);
          const {
            Quantity,
            ConnectionTypeID,
            CurrentTypeID,
            LevelID,
          } = connection;
          let fast = `, fast charge`;
          if (!LevelID.IsFastChargeCapable) {
            fast = '';
          }
          let acdcIcon = '&#9107';
          try {

            if (CurrentTypeID.Title.includes('AC'))
              acdcIcon = '&#9190;';
          } catch (e) {
            console.log(e);
          }
          info.innerHTML += `
<div class="connection">
<p><i class="fas fa-plug"></i> ${ConnectionTypeID.Title}</p>
<p><span class="icon">${acdcIcon}</span> ${CurrentTypeID.Title}</p>
<p><i class="fas fa-bolt"></i> ${LevelID.Title}, ${LevelID.Comments}${fast}</p>
<p>Connections: ${Quantity}</p>
</div>
`;
        });
        info.innerHTML += `
<div class="buttons">
        <div class="item">
          <button class="button" onclick="modifyStation('${id}')"><i class="fas fa-pen-alt fa-2x"></i></button>
        </div>
        <div class="item">
          <button class="button" onclick="deleteStation('${id}')"><i class="fas fa-trash-alt fa-2x"></i>
          </button>
        </div>
      </div>`;
        // navigate button
        // console.log('browser', navigator.userAgent.includes('Chrome'));
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
      id
      Title
        Town
        AddressLine1
        Location {
          type
          coordinates
        }
        Connections {
          Quantity
          ConnectionTypeID {
            Title
          }
          CurrentTypeID {
            Title
          }
          LevelID {
            Title
            Comments
            IsFastChargeCapable
          }
        }
      }
    }`,
    };
    const data = await fetchGraphql(query);
    // console.log('data', data);
    const stations = data.stations;
    // console.log('stations', stations);
    const features = stations.map((station) => {
      const {Title, Town, Location, AddressLine1, Connections, id} = station;
      return {
        'type': 'Feature',
        'properties': {
          'id': id,
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
  const center = (e) => {
    const marker = L.marker(
        e.latlng).
        addTo(map).
        bindPopup('You are here.').
        openPopup();
    L.circle(e.latlng, e.accuracy).addTo(map);
  };

  // get user location
  map.locate(
      {
        setView: true,
        maxZoom: 13,
        enableHighAccuracy: true,
        watch: true,
      });
  map.on('locationfound', center);

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

  // fetch connectionTypes from stationResolver API
  const fetchConnectionTypeIDs = async (element) => {
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
      element.innerHTML += `<option value="${type.id}">${type.Title}</option>`;
    });
  };

  fetchConnectionTypeIDs(conTypes);

  // fetch levels from stationResolver API
  const fetchLevels = async (element) => {
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
      element.innerHTML += `<option value="${type.id}">${type.Title}</option>`;
    });
  };

  fetchLevels(levTypes);

  const connections = [];

  const addConnToList = (options, element) => {
    const [conT, levT, curT, quant] = options;
    const connection = {
      ConnectionTypeID: conT.value,
      LevelID: levT.value,
      CurrentTypeID: curT.value,
      Quantity: +quant.value,
    };
    connections.push(connection);
    // console.log(connections);
    element.innerHTML += `<article id="conn-${connections.length -
    1}">
    <a href="#" onclick="removeConnection(${connections.length - 1}); return false;"><i class="fas fa-trash-alt fa-2x"></i></a>
    <p><strong>Connection type:</strong> ${conT.options[conT.selectedIndex].text}</p>
    <p><strong>Level:</strong> ${levT.options[levT.selectedIndex].text}</p>
    <p><strong>Current type:</strong> ${curT.options[curT.selectedIndex].text}</p>
    <p><strong>Quantity:</strong> ${quant.value}</p>
    </article>
  `;
  };

  addConnection.addEventListener('click', () => {
    const connectionOptions = [
      conTypes,
      levTypes,
      curTypes,
      quantity,
    ];
    addConnToList(connectionOptions, allConnections);
  });

  const removeConnection = (index) => {
    connections[index] = undefined;
    const element = document.getElementById('conn-' + index);
    element.parentNode.removeChild(element);
    // console.log(connections);
  };

  // fetch current types from stationResolver API
  const fetchCurrentTypeIDs = async (element) => {
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
      element.innerHTML += `<option value="${type.id}">${type.Description}</option>`;
    });
  };

  fetchCurrentTypeIDs(curTypes);

  // hack to prevent click firing twice on mobile
  let lastClick = 0;

  const locToForm = (evt) => {
    // hack to prevent click firing twice on mobile
    // console.log(lastClick, Date.now(), Date.now() - lastClick);
    if (Date.now() - lastClick < 100) {
      // console.log('should stop');
      return;
    }
    lastClick = Date.now();

    loc.value = `${evt.latlng.lng}, ${evt.latlng.lat}`;
    geocodeService.reverse().latlng(evt.latlng).run((error, result) => {
      if (error) {
        return;
      }
      // console.log(result);
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

  const startResizeMap = () => {
    map.on('click', openMap);
    closeLow();
  };

  const stopResizeMap = () => {
    map.off('click', openMap);
  };

  startResizeMap();

  const add = document.querySelector('#add-btn');
  add.addEventListener('click', (evt) => {
    evt.preventDefault();
    stopResizeMap();
    getLocation();
    closeLow();
    closeMap();
    insert.classList.replace('low-small', 'low-big');
  });

  const cancel = document.querySelector('#reset-button');
  cancel.addEventListener('click', (evt) => {
    stopGetLocation();
    startResizeMap();
    closeLow();
    openMap();
  });

  connForm.addEventListener('submit', async (evt) => {
    evt.preventDefault();
    const filteredConnections = connections.filter(conn => conn !== undefined);
    const query = {
      query: `mutation {
  addStation(
    Connections: ${JSON.stringify(filteredConnections).
          replace(/\"([^(\")"]+)\":/g, '$1:')},
    Postcode: "${postcode.value}",
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
    // console.log(result);
    if (result) {
      connections.forEach((conn, index) => {
        removeConnection(index);
      });
      connForm.reset();
      init();
      closeLow();
      openMap();
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

  // login
  const loginBtn = document.querySelector('#login-btn');
  const loginSection = document.querySelector('#login-section');
  const closeLoginBtn = document.querySelector('#close-login');
  const loginForm = document.querySelector('#login-form');

  const openLogin = (evt) => {
    evt.preventDefault();
    closeLow();
    loginSection.classList.replace('low-small', 'low-big');
    closeMap();
  };

  const closeLogin = (evt) => {
    evt.preventDefault();
    closeLow();
    openMap();
  };

  const login = async (evt) => {
    evt.preventDefault();
    // console.log(loginForm.elements);
    let values = {};
    for (let i = 0; i < loginForm.elements.length; i++) {
      if (loginForm.elements[i].tagName === 'INPUT')
        values[loginForm.elements[i].name] = loginForm.elements[i].value;
    }
    const query = {
      query: `{
  login(username: "${values.username}", password: "${values.password}") {
    id
    full_name
    username
    token
  }
}
`,
    };
    try {
      const result = await fetchGraphql(query);
      localStorage.setItem('token', result.login.token);
      closeLogin(evt);
      loginBtn.classList.toggle('hide');
      add.classList.toggle('hide');
    } catch (e) {
      console.log('error', e.message);
    }

  };

  loginBtn.addEventListener('click', openLogin);
  closeLoginBtn.addEventListener('click', closeLogin);
  loginForm.addEventListener('submit', login);

  // check user token
  const checkUser = async () => {
    const query = {
      query: ` {
  user 
  {
    id
    full_name
    username
  }
}
`,
    };
    const result = await fetchGraphql(query);
    // console.log(result);
    if (result.user) {
      loginBtn.classList.toggle('hide');
      add.classList.toggle('hide');
    }
  };

  // check if user is still valid
  checkUser();

  // modify station
  const modifyForm = document.querySelector('#modify-form');
  const modifySection = document.querySelector('#modify-section');
  const modifyConnectionTypeID = document.querySelector(
      '#modify-connection-type');
  const modifyLevel = document.querySelector('#modify-level');
  const modifyCurrentTypeID = document.querySelector('#modify-current-type');
  const modifyAllConnections = document.querySelector(
      '#modify-all-connections');
  const modifyConnectionBtn = document.querySelector('#modify-connection-btn');
  const editConnections = document.querySelector('#edit-connections');
  let mConnections = [];

  const addConnToModifyList = (connection, element) => {
    checkNull(connection);
    element.innerHTML += `<article id="${connection.id}">
    <a href="#" onclick="modifyConnection('${connection.id}'); return false;"><i class="fas fa-pen-alt fa-2x"></i></a>
    <p><strong>Connection type:</strong> ${connection.ConnectionTypeID.Title}</p>
    <p><strong>Level:</strong> ${connection.LevelID.Title}</p>
    <p><strong>Current type:</strong> ${connection.CurrentTypeID.Title}</p>
    <p><strong>Quantity:</strong> ${connection.Quantity}</p>
    </article>
  `;
  };

  const modifyConnection = (id) => {
    editConnections.classList.remove('hide');
    modifyConnectionBtn.dataset.id = id;
    const conn = mConnections.find(obj => {
      return obj.id === id;
    });
    for (const option of modifyForm.elements['modify-connection-type'].options) {
      if (option.value === conn.ConnectionTypeID.id)
        option.selected = true;
    }
    for (const option of modifyForm.elements['modify-current-type'].options) {
      if (option.value === conn.CurrentTypeID.id)
        option.selected = true;
    }
    for (const option of modifyForm.elements['modify-level'].options) {
      if (option.value === conn.LevelID.id)
        option.selected = true;
    }
    modifyForm.elements['quantity'].value = conn.Quantity;
  };

  const modifyStation = async (id) => {
    editConnections.classList.add('hide');
    mConnections = [];
    console.log(id);
    fetchConnectionTypeIDs(modifyConnectionTypeID);
    fetchCurrentTypeIDs(modifyCurrentTypeID);
    fetchLevels(modifyLevel);

    const query = {
      query: `{
        station(id: "${id}") {
          id
          Title
          Town
          AddressLine1
          Postcode
          StateOrProvince
          Connections {
            id
            Quantity
            ConnectionTypeID {
              id
              Title
            }
            CurrentTypeID {
              id
              Title
            }
            LevelID {
              id
              Title
            }
          }
        }
      }`,
    };
    const data = await fetchGraphql(query);
    // console.log('data', data);
    const station = data.station;
    console.log('station', station);
    const inputs = modifyForm.elements;
    console.log('elements', inputs);
    inputs.title.value = station.Title;
    inputs.address.value = station.AddressLine1;
    inputs.postcode.value = station.Postcode;
    inputs.town.value = station.Town;
    inputs.state.value = station.StateOrProvince;
    inputs.id.value = station.id;

    mConnections = station.Connections;

    modifyAllConnections.innerHTML = '';

    station.Connections.forEach(conn => {
      addConnToModifyList(conn, modifyAllConnections);
    });

    closeLow();
    modifySection.classList.replace('low-small', 'low-big');
  };

  const saveModConnection = () => {
    console.log('mc', mConnections);
    const id = modifyConnectionBtn.dataset.id;

    const index = mConnections.findIndex(conn => conn.id === id);

    const newConn = {
      id: id,
      ConnectionTypeID: {},
      CurrentTypeID: {},
      LevelID: {},
      Quantity: 0,
    };

    console.log(modifyForm.elements['modify-connection-type']);

    newConn.ConnectionTypeID.id = modifyForm.elements['modify-connection-type'].value;
    newConn.ConnectionTypeID.Title = modifyForm.elements['modify-connection-type'].options[modifyForm.elements['modify-connection-type'].selectedIndex].innerHTML;

    newConn.CurrentTypeID.id = modifyForm.elements['modify-current-type'].value;
    newConn.CurrentTypeID.Title = modifyForm.elements['modify-current-type'].options[modifyForm.elements['modify-current-type'].selectedIndex].innerHTML;

    newConn.LevelID.id = modifyForm.elements['modify-level'].value;
    newConn.LevelID.Title = modifyForm.elements['modify-level'].options[modifyForm.elements['modify-level'].selectedIndex].innerHTML;

    newConn.Quantity = modifyForm.elements['quantity'].value;

    mConnections[index] = newConn;

    console.log('mc', mConnections);

    modifyAllConnections.innerHTML = '';

    mConnections.forEach(conn => {
      addConnToModifyList(conn, modifyAllConnections);
    });
    editConnections.classList.add('hide');
  };

  const saveModStation = async (evt) => {
    evt.preventDefault();

    const conns = mConnections.map(conn => ({
          id: conn.id,
          Quantity: +conn.Quantity,
          ConnectionTypeID: conn.ConnectionTypeID.id,
          LevelID: conn.LevelID.id,
          CurrentTypeID: conn.CurrentTypeID.id,
        }
    ));

    const station = {
      id: modifyForm.elements.id.value,
      Connections: conns,
      Postcode: modifyForm.elements.postcode.value,
      Title: modifyForm.elements.title.value,
      AddressLine1: modifyForm.elements.address.value,
      StateOrProvince: modifyForm.elements.state.value,
      Town: modifyForm.elements.town.value,
    };

    const query = {
      query: `mutation VariableTest($id: ID!, $Connections: [ConnectionInput], $Postcode: String, $Title: String, $AddressLine1: String, $StateOrProvince: String, $Town: String) {
  modifyStation(
    id: $id,
    Connections: $Connections,
    Postcode: $Postcode,
    Title: $Title,
    AddressLine1: $AddressLine1,
    StateOrProvince: $StateOrProvince,
    Town: $Town,
  )
  {
    AddressLine1
    Town
  }
}
`,
      variables: JSON.stringify(station),
    };
    console.log('query', query);
    try {
      const data = await fetchGraphql(query);
      console.log('data', data);
      closeLow();
      openMap();
      init();
    } catch (e) {
      console.log(e.message);
    }

  };

  modifyConnectionBtn.addEventListener('click', saveModConnection);
  modifyForm.addEventListener('submit', saveModStation);

  // delete station
  const deleteStation = async (id) => {
    const conf = confirm('Are you sure you want to delete this station?');
    if (!conf) return;
    console.log(id);
    const query = {
      query: `mutation
{
  deleteStation(id: "${id}"){
    id
  }
}`,
    };

    console.log('delete query', query);

    try {
      const data = await fetchGraphql(query);
      console.log('data', data);
      closeLow();
      openMap();
      init();
    } catch (e) {
      console.log(e.message);
    }
  };

  // export functions to HTML
  window.removeConnection = removeConnection;
  window.modifyStation = modifyStation;
  window.deleteStation = deleteStation;
  window.modifyConnection = modifyConnection;
})();
