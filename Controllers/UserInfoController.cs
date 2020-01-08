using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using RestSharp;

namespace WorldwideMusicSummary.Controllers
{
    [Route("")]
    [ApiController]
    public class UserInfoController : Controller
    {
        string client_id = "cae005557504459cb66c997fb0aa84f4";
        string client_secret = "853cf78ce33f4caa8386cce4028c836b";
        //string redirect_uri = "https%3A%2F%2Flocalhost%3A5001%2FMain";
        string redirect_uri = "https://localhost:5001/Main";
        string scope = "user-read-private user-read-email playlist-read-private";
        string stateKey = "spotify_auth_state";

        // RestClient client = new RestClient("https://accounts.spotify.com/authorize?client_id=cae005557504459cb66c997fb0aa84f4&scopes=playlist-read-private&response_type=code&redirect_uri=https%3A%2F%2Flocalhost%3A5001%2FMain");

        string clientToken;

        [HttpGet("{main, code}")]
        public ActionResult GetAuthorizationToken(string code)
        {
            if(string.IsNullOrEmpty(clientToken))
            {

                RestClient client = new RestClient("https://accounts.spotify.com/api/token");
                var request = new RestRequest(Method.POST);
                request.AddUrlSegment("Authorization", "Basic " + (new StringBuilder(client_id + ':' + client_secret).ToString()));
                request.AddParameter("grant_type", "authorization_code");
                request.AddUrlSegment("code", code);
                request.AddUrlSegment("redirect_uri", redirect_uri);
                //request.AddUrlSegment("state", GenerateRandomString(6));
                request.AddHeader("Content-Type", "application/x-www-form-urlencoded");
                //var response = client.Get(request);
                IRestResponse response = client.Execute(request);
                string parsed = response.Content;

            }
            return Redirect("home.html");
            //return Json(response.Content);
        }

        public string GenerateRandomString(int length) 
        {
           StringBuilder text = new StringBuilder(length);
           string possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            Random random = new Random();
           for (int i = 0; i<length; i++) 
            {
                text.Append(possible[random.Next(0, possible.Length-1)]);
            }
            return text.ToString();
        }
    }
}