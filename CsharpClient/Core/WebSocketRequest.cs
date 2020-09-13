using System;
using System.Collections.Generic;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.VisualBasic.FileIO;
using Newtonsoft.Json;

namespace CsharpClient.Core
{
    public class WebSocketRequest
    {
        protected WebSocketRequest(dynamic parameter,string address)
        {
            Parameter = parameter;
            Address = address;
        }
        protected string BaseUrl = FileManager.Configuration["WebsocketAddress"];
        protected string Address;
        protected dynamic Parameter;
        protected string Waite = "";
        protected dynamic Raw;
        protected CallBack Call;
        public delegate void CallBack();

        public UserResponse Send()
        {
            var output = new List<string>();
            ClientWebSocket ws = null;
            var cancellationToken = new CancellationToken();
            try
            {
                ws = new ClientWebSocket();
                var awaiter = ws.ConnectAsync(new Uri(this.BaseUrl + Address), cancellationToken).GetAwaiter();
                awaiter.GetResult();
                Console.WriteLine("connected");
                var text = JsonConvert.SerializeObject(Parameter);
                ArraySegment<byte> parameter = new ArraySegment<byte>(Encoding.UTF8.GetBytes(text));
                ws.SendAsync(parameter, WebSocketMessageType.Text, true, cancellationToken);
                Console.Write($"Your {Waite} Request Send to Server Please Wait");
                ArraySegment<byte> response = new ArraySegment<byte>(new byte[1024]);
                Task<WebSocketReceiveResult> wsResult = ws.ReceiveAsync(response, cancellationToken);
                new Task(() =>
                {
                    while (!wsResult.IsCompletedSuccessfully)
                    {
                        Console.Write(".");
                        Thread.Sleep(1000);
                    }
                }).Start();
                if (wsResult.GetAwaiter().GetResult().MessageType == WebSocketMessageType.Text)
                {
                    Raw = JsonConvert.DeserializeObject<dynamic>(Encoding.UTF8.GetString(response));
                    foreach (var x in Raw.msg)
                        output.Add(x.message.ToString());
                    if ((bool) Raw.ok && Call != null)
                            Call();
                }
                ws.CloseAsync(WebSocketCloseStatus.NormalClosure, null!, cancellationToken);
            }
            catch (MalformedLineException exception)
            {
                output.Add(ResponseType.clientErr + "");
            }

            return new UserResponse(output);
        }
    }

    public class UserResponse
    {
        private ICollection<string> _responses;

        public UserResponse(ICollection<string> responses)
        {
            _responses = responses;
        }

        public Printable Response()
        {
            StringBuilder sb = new StringBuilder();
            sb.Append(Environment.NewLine);
            foreach (var response in _responses)
            {
                sb.Append(response + "");
                sb.Append(Environment.NewLine);
            }

            return new Printable(sb.ToString());
        }
    }

    public class Printable
    {
        public string Msg { get; set; }

        public Printable(String msg)
        {
            Msg = msg;
        }
        public void Print()
        {
            ConsoleColor cc = Console.ForegroundColor;
            if (Msg.ToLower().Contains("successful"))
                Console.ForegroundColor = ConsoleColor.DarkGreen;
            Console.WriteLine(Msg);
            Console.ForegroundColor = cc;
        }
    }
}