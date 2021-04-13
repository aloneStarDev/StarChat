using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace CsharpClient.Core
{
    public abstract class WebSocketHub
    {
        protected delegate void CallBack(dynamic parameter = null);


        protected Action Done = null;
        protected bool Exit = false;
        protected Action OnConnect = null;
        
        protected ClientWebSocket Ws;
        protected static User Me;

        protected WebSocketHub(string uri)
        {
            Uri = uri;
        }

        protected ArraySegment<byte> _incomingBuffer;
        protected ArraySegment<byte> OutgoingBuffer;
        protected dynamic _update;

        protected abstract void Scene();

        protected virtual void SendAuthenticationToken()
        {
            string id = FileManager.CreateInstance().Fetch("token");
            OutgoingBuffer = new ArraySegment<byte>(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(new {id = id})));
            Ws.SendAsync(OutgoingBuffer, WebSocketMessageType.Text, true, default).GetAwaiter().OnCompleted(() =>
            {
                Console.WriteLine("Connected..");
                Console.WriteLine("token has been Send..");
                Thread.Sleep(500);
                OnMessage();
            });
        }

        protected virtual void OnMessage()
        {
            _incomingBuffer = new  ArraySegment<byte>(new byte[1024]);
            Ws.ReceiveAsync(_incomingBuffer, default).GetAwaiter().OnCompleted(() =>
            {
                try
                {
                    if(Ws.State  == WebSocketState.Closed)
                        return;
                    string response = Encoding.UTF8.GetString(_incomingBuffer);
                    Console.WriteLine("res---->"+response);
                    _update = JsonConvert.DeserializeObject<ExpandoObject>(response);
                    if (_update == null)
                    {
                        return;
                    }
                    if (_update is ExpandoObject)
                    {
                        IDictionary<string, object> updateDictionary = (IDictionary<string, object>) _update;
                        if (updateDictionary.ContainsKey("ok"))
                        {
                            var messages = new List<string>();
                            foreach (var x in _update.msg)
                            {
                                messages.Add(x.message.ToString());
                                if ((int) x.code == 6)
                                {
                                    var privacyPolicy = "your authentication token has expired and you should login again ...\nplease wait to delete previous token";
                                    Console.WriteLine(privacyPolicy);
                                    if (FileManager.CreateInstance().Logout())
                                    {
                                        Program.Main(new[] {""});
                                        Environment.Exit(0);
                                    }
                                    else
                                    {
                                        Console.WriteLine("Problem to delete token.lock");
                                        Console.WriteLine("please Remove Secret Folder Manually..\n and try again");
                                        Environment.Exit(0);
                                    }
                                }
                            }
                            Console.WriteLine("\nfrom Server:");
                            new UserResponse(messages).Response().Print();
                            Thread.Sleep(2000);
                            Done = () =>
                            {
                                Startup.CreateInstance().Start();
                            };
                        }else if (updateDictionary.ContainsKey("user"))
                        {
                            Me = new User(_update);
                            _incomingBuffer = null;
                            GC.Collect();
                            Scene();
                        }
                    }
                }
                catch (JsonException ex)
                {
                    Console.WriteLine("Server Bad Response :"+ex.Message);
                }
            });
        }

        protected string Uri;
        protected virtual void Connect()
        {
            Ws = new ClientWebSocket();
            Ws.ConnectAsync(new Uri(Uri), default).GetAwaiter().OnCompleted(()=>
            {
                if (Ws.State == WebSocketState.Open)
                    OnConnect();
            });
            Thread.Sleep(1000);
            Task.Run(()=>
            {
                if (Ws.State != WebSocketState.Open)
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("Connection Failed");
                }
            });
        }
        
        public virtual void Start()
        {
            OnConnect = SendAuthenticationToken;
            new Thread(() =>Connect()).Start();
            while (Done == null)
                Thread.Sleep(1000);
            Done();
        }
    }
}