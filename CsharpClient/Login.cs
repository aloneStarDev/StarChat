using System;
using System.Collections.Generic;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using CsharpClient.Core;
using Microsoft.VisualBasic.FileIO;
using Newtonsoft.Json;

namespace CsharpClient
{
    public class Login : WebSocketRequest
    {   
        private Login(string username, string password):base(new {username,password},"login") => Call = Save;
        public static Login Build()
        {
            Console.WriteLine("Enter Your Username:");
            var username = Console.ReadLine();
            Console.WriteLine("Enter Your Password:");
            var password = Console.ReadLine();
            return new Login(username, password);
        }
        private void Save()
        {
            FileManager fm = FileManager.CreateInstance();
            if(fm.Store("token",(string)Raw.token))
                Console.WriteLine("Almost Done");
            else
                Console.WriteLine("Fail in Store Api Token");
        }
    }
}