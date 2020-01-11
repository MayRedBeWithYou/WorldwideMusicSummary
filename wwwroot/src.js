window.onload = function init() {
    var countryList = [];
    var activeCountry;

    const States = {
        Countries: 0,
        Trending: 1,
        Personalized: 2
    }

    var state = States.Trending;

    var trendingTab = document.getElementById("trendingTab");
    var personalTab = document.getElementById("personalTab");

    trendingTab.addEventListener("click", () => {
        if (state == States.Trending) return;
        state = States.Trending;
        console.log("Trending");
        trendingTab.className = "active";
        personalTab.className = "";
        if (activeCountry != null) {
            activeCountry.info.close();
            if (activeCountry.preview != null) activeCountry.preview.pause();
        }

        for (let key in countryList) {
            let country = countryList[key];
            country.polygons.forEach((p) => {
                p.setOptions({ fillColor: country.color, strokeColor: country.color });
            });
            countryList[key].artist = null;
            countryList[key].song = null;
            countryList[key].preview = null;

        }


    });

    personalTab.addEventListener("click", () => {
        if (state == States.Personalized) return;
        state = States.Personalized;
        console.log("Personalized");
        personalTab.className = "active";
        trendingTab.className = "";

        if (activeCountry != null) {
            activeCountry.info.close();
        }

        fetch("Top/Tracks").then(resp => {
            resp.json().then(data => {

                for (let key in countryList) {
                    let country = countryList[key];
                    country.polygons.forEach((p) => {
                        p.setOptions({ fillColor: "#777777", strokeColor: "#777777" });
                    });
                    countryList[key].artist = null;
                    countryList[key].song = null;
                    countryList[key]["preview"] = null;

                }

                console.log(data);
                for (let key in data) {
                    let country = countryList[key];
                    let info = data[key];
                    country.polygons.forEach((p) => {
                        p.setOptions({ fillColor: "#FF0000", strokeColor: "#FF0000" });
                    });
                    countryList[key]["artist"] = info["name"];
                    countryList[key]["song"] = info["song"];
                    countryList[key]["preview"] = new Audio(info["song"]["preview_url"]);
                }

            });
        });


    });


    var welcomeText = document.getElementById("welcomeText");

    fetch("Info/User").then(resp => {
        resp.json().then(data => {
            welcomeText.innerText = "Hello, " + data["display_name"];
        });
    });

    fetch("50m_30p_geo_hd.json", { method: "GET" }).then(resp => {
        if (resp.status == 200) resp.json().then(data => {
            let countries = data.features;
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
                        if (activeCountry != null) {
                            activeCountry.info.close();
                            if (state == States.Personalized && activeCountry["preview"] != null) activeCountry["preview"].pause();
                        }

                        activeCountry = countryList[code];
                        console.log(name);
                        console.log(code);
                        console.log(country);
                        switch (state) {
                            case States.Trending:
                                if (activeCountry["artist"] != null) {
                                    let artistName = activeCountry["trending"]["artist_name"];
                                    console.log("Already fetched...");
                                    console.log(artistName);
                                    info.setContent(`<div>${name}<br>Now trending: <strong>${artistName}</strong></div>`);
                                    info.open(map);
                                }
                                else {
                                    console.log("Fetching...");
                                    fetch('api/Info/Artist?country=' + code).then(resp => {
                                        resp.json().then(data => {
                                            if (data["message"]["body"]["artist_list"][0] == null) {
                                                info.setContent(`<div>${name}<br>No data about this country.</div>`);
                                            }
                                            else {
                                                data = data["message"]["body"]["artist_list"][0]["artist"];
                                                activeCountry["trending"] = data;
                                                let artistName = data["artist_name"];
                                                console.log(artistName);
                                                info.setContent(`<div>${name}<br>Now trending: <strong>${artistName}</strong></div>`);
                                            }
                                            info.open(map);
                                        });
                                    });
                                }
                                break;
                            case States.Countries:
                                info.setContent(`<div>${name}</div>`);
                                info.open(map);
                                break;
                            case States.Personalized:
                                if (activeCountry["artist"] == null) {
                                    info.setContent(`<div>${name}<br>No songs from this country were in your top 50.</div>`);
                                }
                                else {
                                    let artistName = activeCountry["artist"];
                                    let songName = activeCountry["song"]["name"];
                                    let imageUrl = activeCountry["song"]["images"][1]["url"];
                                    let preview = activeCountry["preview"];

                                    let content = document.createElement("div");
                                    content.className = "songData";

                                    let albumDiv = document.createElement("div");
                                    albumDiv.className = "column";

                                    let albumArt = document.createElement("img");
                                    albumArt.src = imageUrl;
                                    albumArt.width = 100;
                                    albumArt.height = 100;
                                    albumArt.style.cursor = "pointer";
                                    albumArt.addEventListener("click", () => {
                                        preview.currentTime = 0;
                                        if (preview.paused)
                                            preview.play();
                                        else preview.pause();
                                    });
                                    albumDiv.appendChild(albumArt);
                                    content.appendChild(albumDiv);

                                    let songInfo = document.createElement("div");
                                    songInfo.className = "column";
                                    songInfo.innerHTML = `${name}<br>${artistName} - <strong>${songName}</strong>`;

                                    content.appendChild(songInfo);

                                    info.setContent(content);
                                    google.maps.event.addListener(info, "closeclick", () => {
                                        preview.pause();
                                        preview.currentTime = 0;
                                        activeCountry = null;
                                    });
                                }
                                info.open(map);
                        }
                    });
                });

                countryList[code] = {
                    name: name,
                    polygons: polygons,
                    color: col,
                    center: center,
                    info: info,
                    trending: null,
                    artist: null,
                    song: null,
                    preview: null,
                };
            });
        });
    });


    function randColor() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
}