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
                    Console.WriteLine(username); 
                }
                else
                {
                    if (select == i)
                    {
                        Done = () =>
                        {
                            Ws.CloseAsync(WebSocketCloseStatus.NormalClosure, null!, default).GetAwaiter().GetResult();
                            // AddContact.Build();
                        };
                    }
                    else if(select == i-1)
                        Console.WriteLine("logout");
                    else if (select == i-2)
                        Done = () =>{
                            Ws.CloseAsync(WebSocketCloseStatus.NormalClosure, null!, default);
                            Console.ForegroundColor = ConsoleColor.Yellow;
                            Console.WriteLine("\ngoodBye");
                        };
                }
            }
        }
        
        
    }

}