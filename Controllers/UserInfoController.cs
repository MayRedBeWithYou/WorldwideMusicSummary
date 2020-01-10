using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using RestSharp;
using WorldwideMusicSummary.Models;

namespace WorldwideMusicSummary.Controllers
{
    [Route("")]
    [ApiController]
    public class UserInfoController : Controller
    {
        private readonly UserContext _context;
        private readonly IOptions<MusicApiSecrets> _options;
        private string scope = "user-read-private user-read-email playlist-read-private user-top-read";

        public UserInfoController(UserContext context, IOptions<MusicApiSecrets> options)
        {
            _context = context;
            _options = options;
        }

        [Route("Main")]
        [HttpGet("{code}")]
        public async Task<IActionResult> GetAuthorizationToken([FromQuery] string code)
        {
            Session session = _context.Sessions.SingleOrDefault(c => c.UserCookie == Request.Cookies["UserCookie"]);
            if (session == null || session.Access_token == null)
            {
                RestClient client = new RestClient("https://accounts.spotify.com/api/token");
                var request = new RestRequest(Method.POST);
                request.AddHeader("Authorization", "Basic " + Convert.ToBase64String(Encoding.UTF8.GetBytes(new StringBuilder(_options.Value.Client_id + ":" + _options.Value.Client_secret).ToString())));
                request.AddParameter("scope", scope);
                request.AddParameter("grant_type", "authorization_code");
                request.AddParameter("code", code);
                request.AddParameter("redirect_uri", _options.Value.Redirect_uri);
                request.AddHeader("Content-Type", "application/x-www-form-urlencoded");
                var response = client.Execute(request);
                UserAccessTokens accessTokens = JsonConvert.DeserializeObject<UserAccessTokens>(response.Content);

                string userCookie = GenerateRandomString(10);
                Response.Cookies.Append("userCookie", userCookie);

                if (session == null)
                {
                    session = new Session()
                    {
                        UserCookie = userCookie,
                        Access_token = accessTokens.Access_token,
                        Token_type = accessTokens.Token_type,
                        Refresh_token = accessTokens.Refresh_token,
                        Expires_in = accessTokens.Expires_in,
                        Date = DateTime.Now
                    };
                    _context.Sessions.Add(session);
                }
                else
                {
                    session.UserCookie = userCookie;
                    session.Access_token = accessTokens.Access_token;
                    session.Token_type = accessTokens.Token_type;
                    session.Refresh_token = accessTokens.Refresh_token;
                    session.Expires_in = accessTokens.Expires_in;
                    session.Date = DateTime.Now;
                    _context.Sessions.Update(session);
                }
                await _context.SaveChangesAsync();
            }
            return Redirect("home.html");
        }

        [Route("Refresh")]
        [HttpGet]
        public async void GetRefreshedAccessToken()
        {
            Session session = _context.Sessions.Single(c => c.UserCookie == Request.Cookies["UserCookie"]);

            if (session.Date.AddSeconds(session.Expires_in) < DateTime.Now)
            {
                RestClient client = new RestClient("https://accounts.spotify.com/api/token");
                var request = new RestRequest(Method.POST);
                request.AddHeader("Authorization", "Basic " + Convert.ToBase64String(Encoding.UTF8.GetBytes(new StringBuilder(_options.Value.Client_id + ":" + _options.Value.Client_secret).ToString())));
                request.AddParameter("grant_type", "refresh_token");
                request.AddParameter("refresh_token", session.Refresh_token);
                request.AddHeader("Content-Type", "application/x-www-form-urlencoded");
                var response = client.Execute(request);
                UserAccessTokens accessTokens = JsonConvert.DeserializeObject<UserAccessTokens>(response.Content);

                session.Access_token = accessTokens.Access_token;
                session.Token_type = accessTokens.Token_type;
                session.Date = DateTime.Now;
                await _context.SaveChangesAsync();
            }
        }

        [Route("Info/User")]
        [HttpGet]
        public string GetUserInfo()
        {
            Session session = _context.Sessions.Single(c => c.UserCookie == Request.Cookies["UserCookie"]);
            RestClient client = new RestClient("https://api.spotify.com/v1/me");
            RestRequest request = new RestRequest(Method.GET);
            request.AddHeader("Authorization", session.Token_type + " " + session.Access_token);
            request.AddParameter("scope", "user-read-private");
            var response = client.Execute(request);

            return response.Content;
        }

        [Route("Top/Tracks")]
        [HttpGet]
        public string GetUsersTopTracks()
        {
            Session session = _context.Sessions.Single(c => c.UserCookie == Request.Cookies["UserCookie"]);
            RestClient client = new RestClient("https://api.spotify.com/v1/me/top/tracks");
            RestRequest request = new RestRequest(Method.GET);
            request.AddHeader("Authorization", session.Token_type + " " + session.Access_token);
            request.AddQueryParameter("limit", "50");
            request.AddQueryParameter("time_range", "medium_term");
            var response = client.Execute(request);

            TopTracksObject tracksList = JsonConvert.DeserializeObject<TopTracksObject>(response.Content);

            return response.Content;
        }

        public string GenerateRandomString(int length)
        {
            StringBuilder text = new StringBuilder(length);
            string possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            Random random = new Random();
            for (int i = 0; i < length; i++)
            {
                text.Append(possible[random.Next(0, possible.Length - 1)]);
            }
            return text.ToString();
        }
    }
}