window.onload = function init() {
    var xhttp = new this.XMLHttpRequest();
    var countryList = [];
    var activeCountry;
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            let countries = JSON.parse(this.responseText).features;
            countryList = [];
            countries.forEach(function (country) {
                let name = country.properties.NAME_EN;
                let part = country.geometry.coordinates;
                var col = randColor();
                let polygons = [];
                let count = 0;
                let center = { lat: 0, lng: 0 }
                if (name == "Antarctica") return;
                if (country.geometry.type == "Polygon") {
                    part.forEach(function (coords) {
                        let newCoords = [];
                        coords.forEach(function (c) {
                            let cc = { lat: c[1], lng: c[0] };
                            newCoords.push(cc);
                            center.lat += cc.lat;
                            center.lng += cc.lng;
                            count++;
                        });
                        let poly = new google.maps.Polygon({
                            paths: newCoords,
                            strokeColor: col,
                            strokeOpacity: 0.8,
                            strokeWeight: 2,
                            fillColor: col,
                            fillOpacity: 0.35,
                            geodesic: true,
                        });
                        polygons.push(poly);
                        poly.setMap(map);
                    });
                }
                else {
                    let maxCoords = 0;
                    part.forEach(function (island) {
                        island.forEach((coords) => {
                            if (maxCoords < coords.length) maxCoords = coords.length;
                        });
                    });

                    part.forEach(function (island) {
                        island.forEach((coords) => {
                            if (maxCoords < coords.length) maxCoords = coords.length;
                        });
                        island.forEach(function (coords, i) {
                            let newCoords = [];
                            coords.forEach(function (c) {
                                let cc = { lat: c[1], lng: c[0] };
                                newCoords.push(cc);
                                if (coords.length != maxCoords) return;
                                center.lat += cc.lat;
                                center.lng += cc.lng;
                                count++;
                            });
                            let poly = new google.maps.Polygon({
                                paths: newCoords,
                                strokeColor: col,
                                strokeOpacity: 0.8,
                                strokeWeight: 2,
                                fillColor: col,
                                fillOpacity: 0.35,
                                geodesic: true,
                            });
                            polygons.push(poly);
                            poly.setMap(map);
                        });
                    });

                }

                //polygons.forEach(function (polygon, i) {
                //    google.maps.event.addListener(polygon, "mouseover", function () {
                //        polygons.forEach((p, tmp) => {
                //            p.setOptions({ fillColor: "#FF0000" });
                //        });
                //    });

                //    google.maps.event.addListener(polygon, "mouseout", function () {
                //        polygons.forEach((p, tmp) => {
                //            p.setOptions({ fillColor: col });
                //        });
                //    });
                //});            

                center.lng /= count;
                center.lat /= count;
                let info = new google.maps.InfoWindow({
                    content: `<div>${name}</div>`,
                    position: center,
                })
                polygons.forEach(function (polygon) {
                    google.maps.event.addListener(polygon, "click", function () {
                        if (activeCountry != undefined) activeCountry.info.close();
                        activeCountry = countryList[name];
                        info.open(map);
                    });
                });

                countryList[name] = {
                    stats: null,
                    polygons: polygons,
                    color: col,
                    center: center,
                    info: info
                };
            });
        }
    };

    xhttp.open("GET", "50m_30p_geo.json", true);
    xhttp.send();

    function randColor() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
}