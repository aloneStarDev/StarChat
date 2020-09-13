using System;
using System.Net;
using System.Net.Sockets;
using System.Net.WebSockets;
using System.Text;
using System.Timers;
using CsharpClient.Core;
using Newtonsoft.Json;

namespace CsharpClient
{
    public class Startup
    {
        private int counter = 0;
        private Timer Interval;
        public static Startup CreateInstance() => new Startup();
        
        private ClientWebSocket ws;

        private void OnMessage()
        {
            if (ws.State != WebSocketState.Open)
            {
                Interval = null;
                GC.Collect();
                Connect();
            }
            _incomingBuffer = new  ArraySegment<byte>(new byte[1024]);
            ws.ReceiveAsync(_incomingBuffer, default).GetAwaiter().OnCompleted(() =>
            {
                string response = Encoding.UTF8.GetString(_incomingBuffer);
            });
        }

        private ArraySegment<byte> _incomingBuffer;
        private ArraySegment<byte> _outgoingBuffer;

        private void SendAuthenticationToken()
        {
            string id = FileManager.CreateInstance().Fetch("id");
            _outgoingBuffer = new ArraySegment<byte>(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(new {id = id})));
            ws.SendAsync(_outgoingBuffer, WebSocketMessageType.Text, true, default).GetAwaiter().OnCompleted(() =>
            {
                Console.WriteLine("api token has been send");
                Interval = new Timer
                {
                    Interval = 1000,
                    Enabled = true
                };
                Interval.Elapsed += (sender, args) => { OnMessage(); };
            });
            
        }

        private void Connect()
        {
            ws = new ClientWebSocket(){Options = { KeepAliveInterval = TimeSpan.FromSeconds(5)}};
            ws.ConnectAsync(new Uri(FileManager.Configuration["WebsocketAddress"]), default).GetAwaiter().OnCompleted(()=>
            {
                if (ws.State == WebSocketState.Open)
                    SendAuthenticationToken();
            });
        }
        public void Start()
        {
            Connect();
            Console.Read();
        }
    }
}