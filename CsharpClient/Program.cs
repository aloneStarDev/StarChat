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
            if (_isLogin)
                menu.AddRange(new string[] {"Contact", "Logout"});
            else
                menu.AddRange(new string[] {"Login", "Register"});
            menu.Add("Exit");
            Console.WriteLine("\t\t=========================================================");
            Console.WriteLine("\t\t                                                         ");
            foreach (var item in menu)
            {
                Console.WriteLine(
                    $"\t\t                   {menu.IndexOf(item) + 1}){item}                            ");
            }

            Console.WriteLine("\t\t                                                         ");
            Console.WriteLine("\t\t=========================================================");
        }

        public static void Start()
        {
            int input = 0;
            while (input != 3)
            {
                if (input == 0)
                    Menu();
                try
                {
                    if (!_isLogin)
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
                    else
                        switch (input)
                        {
                            case 1:
                                Console.Clear();
                                Console.WriteLine("Contact >>");
                                Console.WriteLine("\t\t1)List");
                                Console.WriteLine("\t\t2)Add");
                                int contactInput = 0;
                                if (!int.TryParse(Console.ReadLine(), out contactInput))
                                {
                                    Console.WriteLine("Enter a valid Number");
                                    continue;
                                }
                                switch (contactInput)
                                {
                                    case 1:
                                        GetContact.Build().Send().Response().Print();
                                        List<string> contacts = FileManager.CreateInstance().ContactList();
                                        if(contacts.Count == 0)
                                            Console.WriteLine("Not Found Any Contact");
                                        else
                                            contacts.ForEach(x => Console.WriteLine(x));
                                        break;
                                    case 2:
                                        AddContact.Build().Send().Response().Print();
                                        break;
                                }
                                break;
                            case 2:
                                
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
        }

        static void Main(string[] args)
        {
            _isLogin = !string.IsNullOrEmpty(FileManager.CreateInstance().Fetch("id"));
            Start();
        }
    }
}