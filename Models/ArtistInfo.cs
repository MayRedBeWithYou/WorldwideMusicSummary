using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WorldwideMusicSummary.Models
{
    public class ArtistInfo
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Country { get; set; }
        public int Counter { get; set; }
        public UsersFavouriteSong Song { get; set; }
    }

    public class UsersFavouriteSong
    {
        public string Name { get; set; }
        public List<Image> Images { get; set; }
        public string Preview_url { get; set; }
    }
}
