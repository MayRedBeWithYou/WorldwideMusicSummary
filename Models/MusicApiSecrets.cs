using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WorldwideMusicSummary.Models
{
    public class MusicApiSecrets
    {
        public string Client_id { get; set; }

        public string Client_secret { get; set; }

        public string Redirect_uri { get; set; }

        public string Musixmatch_key { get; set; }

        public string Google_key { get; set; }
    }
}
