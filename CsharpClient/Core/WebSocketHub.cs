using System;
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
        protected Action onConnect = null;
        
        protected ClientWebSocket Ws;
        protected User Me;

        protected WebSocketHub(string uri)
        {
            Uri = uri;
        }

        private ArraySegment<byte> _incomingBuffer;
        protected ArraySegment<byte> _outgoingBuffer;
        private dynamic _update;

        protected abstract void Scene();

        protected virtual void SendAuthenticationToken()
        {
            string id = FileManager.CreateInstance().Fetch("token");
            _outgoingBuffer = new ArraySegment<byte>(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(new {id = id})));
            Ws.SendAsync(_outgoingBuffer, WebSocketMessageType.Text, true, default).GetAwaiter().OnCompleted(() =>
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
                    string response = Encoding.UTF8.GetString(_incomingBuffer);
                    Console.WriteLine(response);
                    _update = JsonConvert.DeserializeObject<ExpandoObject>(response);
                    if (_update == null)
                    {
                        OnMessage();
                        return;
                    }
                    Thread.Sleep(2000);
                    Me = new User(_update);
                    _incomingBuffer = null;
                    GC.Collect();
                    Scene();
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
                    onConnect();
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
            onConnect = SendAuthenticationToken;
            new Thread(() =>Connect()).Start();
            while (Done == null)
                Thread.Sleep(5000);
            Done();
        }
    }
}