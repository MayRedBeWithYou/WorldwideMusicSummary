﻿using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace WorldwideMusicSummary.Models
{
    public class Session
    {
        public int Id { get; set; }
        public string UserCookie { get; set; }
        public string Access_token { get; set; }
        public string Refresh_token { get; set; }
        public long Expires_in { get; set; }
        [DataType(DataType.Date)]
        public DateTime Date { get; set; }
    }
}
