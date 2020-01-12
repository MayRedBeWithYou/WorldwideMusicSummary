using Newtonsoft.Json;
using System.Collections.Generic;

namespace WorldwideMusicSummary.Models
{
    public class Artist
    {
        public string id { get; set; }
        public string name { get; set; }
        public List<Image> images { get; set; }
        public string uri { get; set; }
    }

    public class Album
    {
        public List<Artist> artists { get; set; }
        public string id { get; set; }
        public List<Image> images { get; set; }
        public string name { get; set; }
    }

    public class ExternalIds
    {
        public string isrc { get; set; }
    }

    public class Image
    {
        public int height { get; set; }
        public string url { get; set; }
        public int width { get; set; }
    }

    public class Track
    {
        public Album album { get; set; }
        public List<Artist> artists { get; set; }
        public ExternalIds external_ids { get; set; }
        public string id { get; set; }
        public string name { get; set; }
        public int popularity { get; set; }
        public string preview_url { get; set; }
    }

    public class TopTracks
    {
        public List<Track> items { get; set; }
        public int total { get; set; }
        public string previous { get; set; }
        public string next { get; set; }
    }

    public class TrackList
    {
        public List<Track> tracks { get; set; }
    }

    public class ArtistList
    {
        [JsonProperty(PropertyName = "items")]
        public List<Artist> artists { get; set; }
    }

    public class Response
    {
        public ArtistList artists { get; set; }
        public TrackList tracks { get; set; }
    }
}