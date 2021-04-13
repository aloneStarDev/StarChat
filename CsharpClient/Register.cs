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
        private Register(string name,string username,string password):base(new {name=name,username=username,password=password},"register") => Call = Save;
        private void Save()
        {
            FileManager fm = FileManager.CreateInstance();
            fm.Store("token",(string)Raw.token);
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