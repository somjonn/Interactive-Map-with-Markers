let savedMarkers;
let markersLayer;
let map;
let lastDeletedMarker;

function addMarker(latlng, comment) {
    const existingMarker = findMarkerByLatLng(latlng);
    if (existingMarker) {
        return;
    }

    const newMarker = L.marker(latlng).addTo(markersLayer);

    let popupContent = `Latitude: ${latlng.lat.toFixed(6)}, Longitude: ${latlng.lng.toFixed(6)}`;
    if (comment) {
        popupContent += `<br>Comment: ${comment}`;
    }
    newMarker.bindPopup(popupContent);

    addToCoordinatesList(latlng, comment);

    newMarker.on('mouseover', function () {
        newMarker.openPopup();
    });

    newMarker.on('mouseout', function () {
        newMarker.closePopup();
    });

    savedMarkers.push({ latlng: latlng, comment: comment });
    localStorage.setItem('markers', JSON.stringify(savedMarkers));
}

function findMarkerByLatLng(latlng) {
    let foundMarker = null;
    markersLayer.eachLayer(function (layer) {
        const layerLatLng = layer.getLatLng();
        if (layerLatLng.lat === latlng.lat && layerLatLng.lng === latlng.lng) {
            foundMarker = layer;
        }
    });
    return foundMarker;
}

function addToCoordinatesList(latlng, comment) {
    const coordinatesList = document.getElementById('coordinatesList');
    const listItem = document.createElement('li');
    listItem.textContent = `Latitude: ${latlng.lat.toFixed(6)}, Longitude: ${latlng.lng.toFixed(6)}`;

    if (comment) {
        listItem.textContent += `, Comment: ${comment}`;
    }

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete Marker';
    deleteButton.onclick = function () {
        lastDeletedMarker = { latlng: latlng, comment: comment };
        markersLayer.eachLayer(function (layer) {
            const layerLatLng = layer.getLatLng();
            if (layerLatLng.lat === latlng.lat && layerLatLng.lng === latlng.lng) {
                markersLayer.removeLayer(layer);
                removeFromLocalStorage(latlng);
                removeFromCoordinatesList(latlng);
            }
        });
    };
    listItem.appendChild(deleteButton);

    coordinatesList.appendChild(listItem);
}

function removeFromCoordinatesList(latlng) {
    const coordinatesList = document.getElementById('coordinatesList');
    const items = coordinatesList.getElementsByTagName('li');
    for (let i = 0; i < items.length; i++) {
        const listItemText = items[i].textContent;
        if (listItemText.includes(`Latitude: ${latlng.lat.toFixed(6)}, Longitude: ${latlng.lng.toFixed(6)}`)) {
            coordinatesList.removeChild(items[i]);
            break;
        }
    }
}

function removeFromLocalStorage(latlng) {
    savedMarkers = savedMarkers.filter(function (marker) {
        return marker.latlng.lat !== latlng.lat || marker.latlng.lng !== latlng.lng;
    });
    localStorage.setItem('markers', JSON.stringify(savedMarkers));
}

function restoreLastDeletedMarker() {
    if (lastDeletedMarker) {
        addMarker(lastDeletedMarker.latlng, lastDeletedMarker.comment);
        lastDeletedMarker = null;
    } else {
        alert("No markers to restore.");
    }
}

document.addEventListener("DOMContentLoaded", function () {
    map = L.map('map').setView([55.934, 12.300], 5);
    markersLayer = L.layerGroup().addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap Contributors'
    }).addTo(map);

    savedMarkers = JSON.parse(localStorage.getItem('markers')) || [];

    savedMarkers.forEach(function (markerData) {
        addMarker(markerData.latlng, markerData.comment);
    });

    map.on('click', function (e) {
        const comment = prompt("Enter a comment:");
        addMarker(e.latlng, comment);
    });
});

function searchByCoordinates() {
    const latInput = document.getElementById('latInput').value;
    const lngInput = document.getElementById('lngInput').value;

    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);

    if (!isNaN(lat) && !isNaN(lng)) {
        let found = false;
        markersLayer.eachLayer(function (layer) {
            const layerLatLng = layer.getLatLng();
            if (layerLatLng.lat === lat && layerLatLng.lng === lng) {
                found = true;
                map.panTo([lat, lng]);
                layer.openPopup();
            }
        });

        if (!found) {
            const addMarkerResponse = confirm("Do you want to add a marker at the given coordinates?");
            if (addMarkerResponse) {
                const comment = prompt("Enter a comment:");
                addMarker({ lat: lat, lng: lng }, comment);
            } else {
                alert("Marker not found on the map.");
            }
        }
    } else {
        alert("Invalid coordinates.");
    }
}

function clearLocalStorage() {
    localStorage.removeItem('markers');
    savedMarkers = [];
    markersLayer.clearLayers();

    const coordinatesList = document.getElementById('coordinatesList');
    coordinatesList.innerHTML = '';
}
