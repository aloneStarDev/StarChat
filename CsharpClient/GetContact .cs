using System;
using System.Collections.Generic;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using CsharpClient.Core;
using Microsoft.VisualBasic.FileIO;
using Newtonsoft.Json;

namespace CsharpClient
{
    public class GetContact:WebSocketRequest
    {
        public GetContact(string id):base(new {id=id},@"getUpdate") => Call=Save;

        private void Save()
        {
            Console.WriteLine(JsonConvert.SerializeObject(Raw));
        }

        public static GetContact Build()
        {
            var wait = 0;
            Console.WriteLine(wait);
            Console.WriteLine("please wait");
            string id = FileManager.CreateInstance().Fetch("id");
            return new GetContact(id);
        }
    }
}