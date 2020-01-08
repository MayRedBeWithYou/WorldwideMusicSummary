using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using RestSharp;

namespace WorldwideMusicSummary.Controllers
{


    [Route("api/Info")]
    [ApiController]
    public class MusicInfoController : Controller
    {
        string key = "688976bfb8d7057f3692c0d977e8a68f";
        RestClient client = new RestClient("https://api.musixmatch.com/ws/1.1/");

        [Route("Track")]
        [HttpGet]
        public string GetTrendingTrack()
        {
            var request = new RestRequest("chart.tracks.get");
            request.AddQueryParameter("format", "jsonp");
            request.AddQueryParameter("callback", "c");
            request.AddQueryParameter("page", "1");
            request.AddQueryParameter("page_size", "1");
            request.AddQueryParameter("country", "LY");
            request.AddQueryParameter("apikey", key);
            request.AddHeader("Accept", "text/xml");
            var response = client.Get(request);
            string parsed = response.Content.Substring(3, response.Content.Length - 6);
            
            return parsed;
        }

        [Route("Artist")]
        [HttpGet]
        public string GetTrendingArtist()
        {
            var request = new RestRequest("chart.artists.get");
            request.AddQueryParameter("format", "jsonp");
            request.AddQueryParameter("callback", "c");
            request.AddQueryParameter("page", "1");
            request.AddQueryParameter("page_size", "1");
            request.AddQueryParameter("country", "LY");
            request.AddQueryParameter("apikey", key);
            request.AddHeader("Accept", "text/xml");
            var response = client.Get(request);
            string parsed = response.Content.Substring(3, response.Content.Length - 6);

            return parsed;
        }
    }
}