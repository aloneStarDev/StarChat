using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Linq;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using CsharpClient.Core;
using Newtonsoft.Json;

namespace CsharpClient
{
    public class Contact : WebSocketHub
    {
        private string username;
        private List<Message> _messages;

        private Contact(string username) : base(FileManager.Configuration["WebsocketAddress"] + "contact/connect")
        {
            OnConnect = ()=>{
                this.Scene();
                this.OnMessage();
            };
            this.username = username;
            _messages = new List<Message>();
        }

        public static Contact Build(string contact) => new Contact(contact);

        private void SendSeen(string id)
        {
            if (Ws.State == WebSocketState.Open)
                Ws.SendAsync(new ArraySegment<byte>(Encoding.ASCII.GetBytes(JsonConvert.SerializeObject(new {seen=id,id=FileManager.CreateInstance().Fetch("token")})))
                    , WebSocketMessageType.Text, true, CancellationToken.None);
        }
        protected override void Scene()
        {
            ConsoleColor cc = Console.ForegroundColor;
            Console.Clear();
            foreach (var each in _messages)
            {
                Console.ForegroundColor = cc;
                if (each.From == Me.Username)
                {
                    Console.CursorLeft = Console.BufferWidth - each.Body.Length;
                    if (each.Seen)
                        Console.ForegroundColor = ConsoleColor.DarkGreen;
                    Console.WriteLine(each.Body);
                }
                else if (each.From == username)
                {
                    Console.CursorLeft = 0;
                    Console.WriteLine(each.Body);
                    if (!each.Seen)
                        SendSeen(each.id);
                }
            }
            SendMessage();
        }

        private void SendMessage()
        {
            Console.Write(":");
            Message outgoing = new Message
            {
                From = Me.Username,
                MessageType = "text",
                To = username,
                Token = new Random(DateTime.Now.Second).Next(999,10000)+"",
                Body = Console.ReadLine()
            };
            _messages.Add(outgoing);
            string id = FileManager.CreateInstance().Fetch("token");
            OutgoingBuffer = new ArraySegment<byte>(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(new
                {id, message = outgoing.Body, username = outgoing.To, token = outgoing.Token})));
            Ws.SendAsync(OutgoingBuffer, WebSocketMessageType.Text, true, default).GetAwaiter().OnCompleted(() =>
            {
                Scene();
            });
            Thread.Sleep(3000);
        }

        protected override void OnMessage()
        {
            _incomingBuffer = new ArraySegment<byte>(new byte[1024]);
            Ws.ReceiveAsync(_incomingBuffer, CancellationToken.None).GetAwaiter().OnCompleted(() =>
            {
                try
                {
                    if (Ws.State == WebSocketState.Closed)
                        return;
                    string response = Encoding.UTF8.GetString(_incomingBuffer);
                    Console.WriteLine("res---->" + response);
                    _update = JsonConvert.DeserializeObject<ExpandoObject>(response);
                    if (_update == null)
                        return;
                    if (_update is ExpandoObject)
                    {
                        IDictionary<string, object> updateDictionary = (IDictionary<string, object>) _update;
                        if (updateDictionary.ContainsKey("messageState"))
                        {
                            switch (updateDictionary["messageState"])
                            {
                                case "saved":
                                    if (updateDictionary.ContainsKey("id"))
                                        _messages.Last().id = (string) _update.id;
                                    break;
                                case "seen":
                                    _messages.Where(x => x.id == (string) _update.id).First().Seen =
                                        (bool) _update.seen;
                                    break;
                                case "incoming":
                                    _messages.Add(new Message
                                    {
                                        Body = _update.body,
                                        From = _update.from,
                                        id = _update.id,
                                        MessageType = "text",
                                        Seen = false,
                                        To = _update.to,
                                        Token = _update.token
                                    });
                                    break;
                            }
                        }
                    }
                    OnMessage();
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Server Bad Response :" + ex.Message);
                }
            });
        }

        public override void Start()
        {
            new Thread(() =>Connect()).Start();
            while (Done == null)
                Thread.Sleep(1000);
            Done();
        }
    }
}