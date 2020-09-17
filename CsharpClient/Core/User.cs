using System;
using System.Collections.Generic;
using Newtonsoft.Json;
namespace CsharpClient.Core
{
    public class User
    {
        public string Username { get; set; }
        public List<string> Contact { get; set; }
        public List<string> Online { get; set; }
        public string Token { get; set; }
        public User(dynamic update)
        {
            Username = (string)update.user.username;
            Contact = new List<string>();
            Online = new List<string>();
            ((List<object>)update.user.contact).ForEach(x=>Contact.Add((string)x));
            ((List<object>)update.online).ForEach(x=>Online.Add((string)x));
        }
    }
}