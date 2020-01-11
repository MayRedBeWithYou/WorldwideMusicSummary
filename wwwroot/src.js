window.onload = function init() {
    var xhttp = new this.XMLHttpRequest();
    var countryList = [];
    var activeCountry;

    const States = {
        Countries: 0,
        Trending: 1,
        Personalized: 2
    }

    var state = States.Trending;

    var welcomeText = document.getElementById("welcomeText");

    fetch("Info/User").then(resp => {
        resp.json().then(data => {
            welcomeText.innerText = "Hello, " + data["display_name"];
        });
    });

    fetch("Top/Tracks").then(resp => {
        resp.json().then(data => {
            var fav = document.getElementById("fav");
            let name = data['PL']['song']['name'];
            let artist = data['PL']['name'];
            fav.innerHTML = `Your favourite song: ${artist} - <strong>${name}</strong>`
            var playButton = document.createElement("audio");
            playButton.src = data['PL']['song']['preview_url'];
            playButton.controls = 'controls';
            playButton.type = 'audio/mpeg';
            document.getElementById('menuPanel').appendChild(playButton);
            console.log(data);
        });
    });

    var trendingButton = document.getElementById("trendingButton");
    trendingButton.addEventListener("click", function () {
        console.log(state);
        switch (state) {
            case States.Countries:
                state = States.Trending;
                trendingButton.innerText = "Hide trending artists";
                break;

            case States.Trending:
                trendingButton.innerText = "Show trending artists";
                state = States.Countries;
                break;
        }
    });
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
                let code = country.properties.ISO_A2;
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
                        if (activeCountry != null) activeCountry.info.close();
                        activeCountry = countryList[name];
                        console.log(name);
                        console.log(code);
                        console.log(country);
                        switch (state) {
                            case States.Trending:
                                if (activeCountry.artist != null) {
                                    let artist_name = activeCountry["artist"]["artist_name"];
                                    console.log("Already fetched...");
                                    console.log(artist_name);
                                    info.setContent(`<div>${name}<br>Now trending: <strong>${artist_name}</strong></div>`);
                                    info.open(map);
                                }
                                else {
                                    console.log("Fetching...");
                                    fetch('api/Info/Artist?country=' + code).then(resp => {
                                        resp.json().then(data => {
                                            if (data["message"]["body"]["artist_list"][0] == null) {
                                                info.setContent(`<div>${name}<br>No data about this country.</div>`);
                                                info.open(map);
                                            }
                                            else {
                                                data = data["message"]["body"]["artist_list"][0]["artist"];
                                                activeCountry["artist"] = data;
                                                let artist_name = data["artist_name"];
                                                console.log(artist_name);
                                                info.setContent(`<div>${name}<br>Now trending: <strong>${artist_name}</strong></div>`);
                                                info.open(map);
                                            }                                            
                                        });
                                    });
                                }
                                break;
                            case States.Countries:
                                info.setContent(`<div>${name}</div>`);
                                info.open(map);
                                break;
                        }
                    });
                });

                countryList[name] = {
                    stats: null,
                    polygons: polygons,
                    color: col,
                    center: center,
                    info: info,
                    code: code,
                    artist: null,
                };
            });
        }
    };

    xhttp.open("GET", "50m_30p_geo_hd.json", true);
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