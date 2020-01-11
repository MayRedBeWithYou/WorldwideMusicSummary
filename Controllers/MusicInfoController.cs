using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using RestSharp;
using WorldwideMusicSummary.Models;

namespace WorldwideMusicSummary.Controllers
{
    [Route("api/Info")]
    [ApiController]
    public class MusicInfoController : Controller
    {
        RestClient client = new RestClient("https://api.musixmatch.com/ws/1.1/");

        private readonly IOptions<MusicApiSecrets> _options;

        public MusicInfoController(IOptions<MusicApiSecrets> options)
        {
            _options = options;
        }

        [Route("Track")]
        [HttpGet]
        public string GetTrendingTrack([FromQuery] string country = "PL")
        {
            var request = new RestRequest("chart.tracks.get");
            request.AddQueryParameter("format", "jsonp");
            request.AddQueryParameter("callback", "c");
            request.AddQueryParameter("page", "1");
            request.AddQueryParameter("page_size", "1");
            request.AddQueryParameter("country", country);
            request.AddQueryParameter("apikey", _options.Value.Musixmatch_key);
            var response = client.Get(request);
            string parsed = response.Content.Substring(3, response.Content.Length - 6);

            return parsed;
        }

        [Route("Artist")]
        [HttpGet]
        public string GetTrendingArtist([FromQuery] string country = "PL")
        {
            var request = new RestRequest("chart.artists.get");
            request.AddQueryParameter("format", "jsonp");
            request.AddQueryParameter("callback", "c");
            request.AddQueryParameter("page", "1");
            request.AddQueryParameter("page_size", "1");
            request.AddQueryParameter("country", country);
            request.AddQueryParameter("apikey", _options.Value.Musixmatch_key);
            var response = client.Get(request);
            string parsed = response.Content.Substring(2, response.Content.Length - 4);

            return parsed;
        }
    }
}