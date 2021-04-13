using System;
using System.Collections.Generic;
using System.Dynamic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using CsharpClient.Core;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Timer = System.Timers.Timer;

namespace CsharpClient
{
    public class Startup:WebSocketHub
    {
        private Startup() : base(FileManager.Configuration["WebsocketAddress"]){}
        public static Startup CreateInstance() => new Startup();

        protected override void Scene()
        {
            Console.Clear();
            Console.Write("Contact:");
            ConsoleColor cc = Console.ForegroundColor;
            int i = 0;
            foreach (var contact in Me.Contact)
            {
                i++;
                if (Me.Online.Contains(contact))
                    Console.ForegroundColor = ConsoleColor.DarkGreen;
                Console.Write($"\t{i}){contact}");
                Console.ForegroundColor = cc;
            }
            Console.WriteLine($"\n{++i})exit\t\t{++i})logout\t{++i})addContact");
            OnMessage();
            var input = Console.ReadLine();
            int select = 0;
            if (!int.TryParse(input, out select) || select > i)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("please Enter a valid option..");
                Thread.Sleep(1000);
                Console.ForegroundColor = cc;
                Scene();
            }
            else
            {
                if (select <= Me.Contact.Count)
                {
                    var username = Me.Contact[select - 1];
                    Console.WriteLine("Connecting to "+username+"...");
                    Done = () =>
                    {
                        Ws.CloseOutputAsync(WebSocketCloseStatus.EndpointUnavailable, String.Empty,CancellationToken.None);
                        Console.Clear();
                        Task.Run(()=>{
                            Console.Write("please wait");
                            for(int i=0;i<3;i++){
                                Console.Write(".");
                                Thread.Sleep(1000);
                            }
                        });
                        Thread.Sleep(3000);
                        Contact.Build(username).Start();
                    };
                }
                else
                {
                    if (select == i)
                    {
                        Done = () =>
                        {
                            Console.Clear();
                            Console.WriteLine("pleaseWait..");
                            Ws.CloseOutputAsync(WebSocketCloseStatus.EndpointUnavailable, String.Empty,CancellationToken.None);
                            AddContact.Build().Start();
                        };
                    }
                    else if (select == i - 1)
                        Done = () =>
                        {
                            Console.Clear();
                            Ws.CloseOutputAsync(WebSocketCloseStatus.EndpointUnavailable, String.Empty,CancellationToken.None);
                            Logout.CreateInstance().Start();
                        };
                    else if (select == i-2)
                        Done = () =>{
                            Ws.CloseAsync(WebSocketCloseStatus.NormalClosure, null!, CancellationToken.None);
                            Console.ForegroundColor = ConsoleColor.Yellow;
                            Console.WriteLine("\ngoodBye");
                        };
                }
            }
        }
        
        
    }

}