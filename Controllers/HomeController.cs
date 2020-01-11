using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using WorldwideMusicSummary.Models;

namespace WorldwideMusicSummary.Controllers
{
    [Route("")]
    [ApiController]
    public class HomeController : Controller
    {
        private readonly IOptions<MusicApiSecrets> _options;

        public string LoginUrl => "https://accounts.spotify.com/authorize?client_id=" + _options.Value.Client_id
            + "&scope=" + Uri.EscapeUriString("user-read-private user-read-email playlist-read-private user-top-read")
            + "&response_type=code&redirect_uri=" + Uri.EscapeUriString(_options.Value.Redirect_uri);

        public string GoogleUri => "https://maps.googleapis.com/maps/api/js?key=" + _options.Value.Google_key + "&callback=initMap";

        public HomeController(IOptions<MusicApiSecrets> options)
        {
            _options = options;
        }

        [HttpGet]
        public ActionResult Login()
        {
            return View("LoginPage", LoginUrl);
        }

        [Route("home")]
        [HttpGet]
        public ActionResult Home()
        {
            return View("Homepage", GoogleUri);
        }
    }
}
