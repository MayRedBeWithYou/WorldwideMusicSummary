window.onload = function init() {
    var countryList = [];
    var activeCountry;

    const States = {
        Countries: 0,
        Trending: 1,
        Tracks: 2,
        Artists: 3
    }

    var state = States.Trending;

    var trendingTab = document.getElementById("trendingTab");
    var personalTab = document.getElementById("personalTab");

    var trackButton = document.getElementById("trackRadioButton");
    var artistButton = document.getElementById("artistRadioButton");

    var refreshButton = document.getElementById("refreshTrending");
    refreshButton.addEventListener("click", () => refreshTopTrending());

    trackButton.addEventListener("change", () => updatePersonalView(States.Tracks));
    artistButton.addEventListener("change", () => updatePersonalView(States.Artists));

    refreshTopTrending();

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

        refreshTopTrending();

        for (let key in countryList) {
            let country = countryList[key];
            country.polygons.forEach((p) => {
                p.setOptions({ fillColor: country.color, strokeColor: country.color });
            });
        }
    });

    personalTab.addEventListener("click", () => {
        if (state == States.Tracks || state == States.Artists) return;
        if (trackButton.checked) state = States.Tracks;
        else state = States.Artists;
        console.log("Personalized");
        personalTab.className = "active";
        trendingTab.className = "";

        updatePersonalView();
    });

    var welcomeText = document.getElementById("welcomeText");

    fetch("Info/User").then(resp => {
        resp.json().then(data => {
            welcomeText.innerText = "Hello, " + data["display_name"];
            console.log(data["images"]);
            document.getElementById("profilePicture").src = data["images"][0]["url"];
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
                            if (activeCountry["preview"] != null) activeCountry["preview"].pause();
                        }

                        activeCountry = countryList[code];
                        console.log(name);
                        console.log(code);
                        console.log(country);
                        console.log(activeCountry);
                        switch (state) {
                            case States.Trending:
                                if (activeCountry["trending"] != null) {
                                    console.log("Already fetched...");
                                    activeCountry["preview"] = new Audio(activeCountry["trending"]["songUrl"]);
                                    setTrendingInfo(info);
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
                                                let artist = data["message"]["body"]["artist_list"][0]["artist"]["artist_name"];
                                                console.log(artist);
                                                let artistQuery = encodeURI(artist);
                                                console.log(artistQuery);
                                                fetch('Top/Track?artist=' + artistQuery).then(resp => {
                                                    resp.json().then(data => {
                                                        console.log(data);
                                                        activeCountry["trending"] = {
                                                            artist: data["artists"][0]["name"],
                                                            song: data["name"],
                                                            image: data["album"]["images"][1]["url"],
                                                            songUrl: data["preview_url"]
                                                        }
                                                        activeCountry["preview"] = new Audio(data["preview_url"]);
                                                        setTrendingInfo(info);

                                                        google.maps.event.addListener(info, "closeclick", () => {
                                                            activeCountry["preview"].pause();
                                                            activeCountry["preview"].currentTime = 0;
                                                            activeCountry = null;
                                                        });
                                                        info.open(map);
                                                    });
                                                });
                                            }
                                        }).catch(e => {
                                            info.setContent(`<div>${name}<br>No data about this country.</div>`);
                                            info.open(map);
                                        });
                                    });
                                }
                                break;
                            case States.Countries:
                                info.setContent(`<div>${name}</div>`);
                                info.open(map);
                                break;
                            case States.Tracks:
                            case States.Artists:
                                if (activeCountry["personal"] == null) {
                                    info.setContent(`<div>${name}<br>No songs from this country were in your top 50.</div>`);
                                }
                                else {
                                    let artistName = activeCountry["personal"]["artist"];
                                    let songName = activeCountry["personal"]["song"]["name"];
                                    let imageUrl = activeCountry["personal"]["song"]["images"][1]["url"];
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
                    personal: null,
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

    function refreshTopTrending() {
        fetch('api/Info/Artist?country=WX&limit=5').then(resp => {
            resp.json().then(data => {
                data = data["message"]["body"]["artist_list"];
                let topList = document.getElementById("trendingList");
                topList.innerHTML = "<h3>Top trending artists:</h3>";
                console.log(data);
                for (let i = 0; i < data.length; i++) {
                    let info = document.createElement("h4");
                    info.innerText = `${i + 1}. ${data[i]["artist"]["artist_name"]}`;
                    topList.appendChild(info);
                }
            });
        });
    }

    function setTrendingInfo(info) {
        let artistName = activeCountry["trending"]["artist"];
        let songName = activeCountry["trending"]["song"];
        let imageUrl = activeCountry["trending"]["image"];
        let preview = activeCountry["preview"];
        let country = activeCountry["name"]

        console.log(artistName);

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
        songInfo.innerHTML = `${country}<br>${artistName} - <strong>${songName}</strong>`;

        content.appendChild(songInfo);

        info.setContent(content);
    }

    function updatePersonalView(newState) {
        if (newState != undefined) state = newState;
        if (activeCountry != null) {
            activeCountry.info.close();
            if (activeCountry.preview != null) activeCountry.preview.pause();
        }

        let url = "Top/Tracks";
        if (state == States.Artists) url = "Top/Artists";
        fetch(url).then(resp => {
            resp.json().then(data => {
                for (let key in countryList) {
                    let country = countryList[key];
                    country.polygons.forEach((p) => {
                        p.setOptions({ fillColor: "#777777", strokeColor: "#777777" });
                    });
                    countryList[key]["personal"] = null;
                }

                console.log(data);
                for (let key in data) {
                    let country = countryList[key];
                    let top = data[key];
                    country.polygons.forEach((p) => {
                        p.setOptions({ fillColor: "#FF0000", strokeColor: "#FF0000" });
                    });
                    countryList[key]["personal"] = {
                        artist: top["name"],
                        song: top["song"],
                        songUrl: new Audio(top["song"]["preview_url"])
                    };
                    countryList[key]["preview"] = countryList[key]["personal"]["songUrl"];
                }
            });
        });
    }
}