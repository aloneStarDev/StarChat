using System;
using System.Collections.Generic;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using CsharpClient.Core;
using Microsoft.VisualBasic.FileIO;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace CsharpClient
{
    public class Register:WebSocketRequest
    {
        private Register(string name,string username,string password)
        {
            this.Name = name;
            this.Username = username;
            this.Password = password;
        }

        private string Name;
        private string Username;
        private string Password;
        private dynamic _raw;
        
        public override UserResponse Send()
        {
            var output = new List<string>();
            ClientWebSocket ws = null;
            var cancellationToken = new CancellationToken();
            try
            {
                ws =  new ClientWebSocket();
                var awaiter = ws.ConnectAsync(new Uri(this.BaseUrl + "register"), cancellationToken).GetAwaiter();
                awaiter.GetResult();
                Console.WriteLine("connected");
                var text = JsonConvert.SerializeObject(new {name = Name, username = Username, password = Password});
                ArraySegment<byte> parameter = new ArraySegment<byte>(Encoding.UTF8.GetBytes(text));
                ws.SendAsync(parameter, WebSocketMessageType.Text,true, cancellationToken);
                Console.Write("Your Register Request Send to Server Please Wait");
                ArraySegment<byte> response = new ArraySegment<byte>(new byte[1024]);
                Task<WebSocketReceiveResult> wsResult = ws.ReceiveAsync(response,cancellationToken);
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
                    _raw = JsonConvert.DeserializeObject<dynamic>(Encoding.UTF8.GetString(response));
                    foreach (var x in _raw.msg)
                        output.Add(x.message.ToString());
                    if ((bool)_raw.ok)
                    {
                        FileManager fm = new FileManager();
                        fm.Store("id",(string)_raw.userId);
                        fm.Store("token",(string)_raw.token);
                        fm.Store("username",Username);
                        fm.Store("password",Password);
                    }
                }
                ws.CloseAsync(WebSocketCloseStatus.NormalClosure, null!,cancellationToken);
            }
            catch (MalformedLineException exception)
            {
                output.Add(ResponseType.clientErr + "");
            }
            return new UserResponse(output);
        }
        
        public static Register Build()
        {
            Console.WriteLine("Enter Your Name:");
            var name = Console.ReadLine();
            Console.WriteLine("Enter Your Username:");
            var username = Console.ReadLine();
            Console.WriteLine("Enter Your Password:");
            var password = Console.ReadLine();
            return new Register(name,username,password);
        }
    }
}