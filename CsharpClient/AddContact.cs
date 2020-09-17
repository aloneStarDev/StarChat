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
    public class AddContact:WebSocketHub
    {
        private string username;
        private AddContact(string username):base(FileManager.Configuration["WebsocketAddress"]+"contact/add")
        {
            this.username = username;
        }
        public static AddContact Build()
        {
            Console.WriteLine("Enter Username To Search:");
            string username = Console.ReadLine();
            return new AddContact(username);
        }
        protected override void Scene()
        {
            
        }

        protected override void SendAuthenticationToken()
        {
            string id = FileManager.CreateInstance().Fetch("token");
            _outgoingBuffer = new ArraySegment<byte>(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(new {id,username})));
            Ws.SendAsync(_outgoingBuffer, WebSocketMessageType.Text, true, default).GetAwaiter().OnCompleted(() =>
            {
                Console.WriteLine("Connected..");
                Console.WriteLine("token has been Send..");
                Thread.Sleep(500);
                OnMessage();
            });
        }
    }
}