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
        private Login(string username, string password):base(new {username=username,password= password},"login") => Call = Save;
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
            fm.Store("id",(string)Raw.userId);
            fm.Store("token",(string)Raw.token);
            fm.Store("username",(string)Parameter.username);
            fm.Store("password",(string)Parameter.password);
        }
    }
}