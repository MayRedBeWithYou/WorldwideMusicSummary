using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
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
        private string client_id = "cae005557504459cb66c997fb0aa84f4";
        private string client_secret = "853cf78ce33f4caa8386cce4028c836b";
        private string redirect_uri = "https://localhost:5001/Main";

        public UserInfoController(UserContext context)
        {
            _context = context;
        }

        [HttpGet("{main, code}")]
        public async Task<IActionResult> GetAuthorizationToken(string code)
        {
            Session session = _context.Sessions.SingleOrDefault(c => c.UserCookie == Request.Cookies["UserCookie"]);
            if (session == null || session.Access_token == null)
            {
                RestClient client = new RestClient("https://accounts.spotify.com/api/token");
                var request = new RestRequest(Method.POST);
                request.AddHeader("Authorization", "Basic " + Convert.ToBase64String(Encoding.UTF8.GetBytes(new StringBuilder(client_id + ":" + client_secret).ToString())));
                request.AddParameter("grant_type", "authorization_code");
                request.AddParameter("code", code);
                request.AddParameter("redirect_uri", redirect_uri);
                request.AddHeader("Content-Type", "application/x-www-form-urlencoded");
                IRestResponse response = client.Execute(request);
                Dictionary<string, object> values = JsonConvert.DeserializeObject<Dictionary<string, object>>(response.Content);
                string access_token = (string)values["access_token"];
                string refresh_token = (string)values["refresh_token"];
                string scopeKey = (string)values["scope"];
                long expires_in = (long)values["expires_in"];

                string userCookie = GenerateRandomString(10);
                Response.Cookies.Append("userCookie", userCookie);

                if (session == null)
                {
                    session = new Session()
                    {
                        UserCookie = userCookie,
                        Access_token = access_token,
                        Refresh_token = refresh_token,
                        Expires_in = expires_in,
                        Date = DateTime.Now
                    };
                    _context.Sessions.Add(session);
                }
                else
                {
                    session.UserCookie = userCookie;
                    session.Access_token = access_token;
                    session.Refresh_token = refresh_token;
                    session.Expires_in = expires_in;
                    session.Date = DateTime.Now;
                    _context.Sessions.Update(session);
                }
                await _context.SaveChangesAsync();
            }
            return Redirect("~/home.html");
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
                request.AddHeader("Authorization", "Basic " + Convert.ToBase64String(Encoding.UTF8.GetBytes(new StringBuilder(client_id + ":" + client_secret).ToString())));
                request.AddParameter("grant_type", "refresh_token");
                request.AddParameter("refresh_token", session.Refresh_token);
                request.AddHeader("Content-Type", "application/x-www-form-urlencoded");
                IRestResponse response = client.Execute(request);
                Dictionary<string, object> values = JsonConvert.DeserializeObject<Dictionary<string, object>>(response.Content);

                session.Access_token = (string)values["access_token"];
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
            request.AddHeader("Authorization", "Bearer " + session.Access_token);
            request.AddParameter("scope", "user-read-private");
            var response = client.Execute(request);
            response = client.Execute(request);
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