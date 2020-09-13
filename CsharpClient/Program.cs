using System;
using System.Collections.Generic;
using System.Text;
using CsharpClient.Core;

namespace CsharpClient
{
    class Program
    {
        private static bool _isLogin;

        public static void Menu()
        {
            List<string> menu = new List<string>();
            menu.AddRange(new string[] {"Login", "Register"});
            menu.Add("Exit");
            Console.WriteLine("\t\t=========================================================");
            Console.WriteLine("\t\t                                                         ");
            foreach (var item in menu)
                Console.WriteLine($"\t\t                   {menu.IndexOf(item) + 1}){item}  ");
            Console.WriteLine("\t\t                                                         ");
            Console.WriteLine("\t\t=========================================================");
        }

        public static void Start()
        {
            int input = 0;
            while (input != 3 && !_isLogin)
            {
                if (input == 0)
                    Menu();
                try
                {
                    switch (input)
                    {
                        case 1:
                            Login.Build().Send().Response().Print();
                            _isLogin = !string.IsNullOrEmpty(FileManager.CreateInstance().Fetch("id"));
                            break;
                        case 2:
                            Register.Build().Send().Response().Print();
                            _isLogin = !string.IsNullOrEmpty(FileManager.CreateInstance().Fetch("id"));
                            break;
                    }
                }
                catch (Exception e)
                {
                    Console.WriteLine(e.Message);
                }
                Console.WriteLine("Enter Menu:");
                if (!int.TryParse(Console.ReadLine(), out input))
                    Console.WriteLine("Enter a valid number");
            }
            if(_isLogin)
                Startup.CreateInstance().Start();
        }

        static void Main(string[] args)
        {
            _isLogin = !string.IsNullOrEmpty(FileManager.CreateInstance().Fetch("id"));
            Start();
        }
    }
}