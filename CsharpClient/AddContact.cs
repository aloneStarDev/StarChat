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
    public class AddContact:WebSocketRequest
    {

        public AddContact(string username, string id):base(new {username=username,id=id},@"contact/add") => Call=Save;

        private void Save() =>
            Console.WriteLine($"store in progress : {FileManager.CreateInstance().AddContact((string) Parameter.username)}");
        
        public static AddContact Build()
        {
            Console.WriteLine("Enter Username To Search:");
            string username = Console.ReadLine();
            string id = FileManager.CreateInstance().Fetch("id");
            return new AddContact(username,id);
        }
    }
}