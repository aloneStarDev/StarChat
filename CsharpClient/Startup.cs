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
            _incomingBuffer = new  ArraySegment<byte>(new byte[100]);
            ws.ReceiveAsync(_incomingBuffer, default).GetAwaiter().OnCompleted(() =>
            {
                string response = Encoding.UTF8.GetString(_incomingBuffer);
                Console.WriteLine(response);
                _incomingBuffer = null;
                GC.Collect();
                OnMessage();
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
                OnMessage();
            });
            
        }

        private void Connect()
        {
            ws = new ClientWebSocket();
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