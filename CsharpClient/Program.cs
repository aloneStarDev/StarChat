using System;
using System.Collections.Generic;
using System.Text;
using CsharpClient.Core;

namespace CsharpClient
{
    class Program
    {
        public static void Menu()
        {
            List<string> menu = new List<string>();
            if(!string.IsNullOrEmpty(new FileManager().Fetch("id")))
                menu.AddRange(new string[]{"Contact > List","Contact > Add"});
            else
                menu.AddRange(new string[]{"Login","Register"});
            menu.Add("Exit");
            Console.WriteLine("\t\t=========================================================");
            Console.WriteLine("\t\t                                                         ");
            foreach (var item in menu)
            {
                Console.WriteLine($"\t\t                   {menu.IndexOf(item)+1}){item}                            ");
            }
            Console.WriteLine("\t\t                                                         ");
            Console.WriteLine("\t\t=========================================================");
        }

        public static void Start()
        {
            int input = 0;
            while (input != 3)
            {
                switch (input)
                {
                    case 0:
                        Menu();
                        break;
                    case 1:
                        Login.Build().Send().Response().Print();
                        break;
                    case 2:
                        Register.Build().Send().Response().Print();
                        break;
                    case 4:
                        Console.WriteLine(new FileManager().Fetch("id"));
                        Console.WriteLine(new FileManager().Fetch("token"));
                        Console.WriteLine(new FileManager().Fetch("username"));
                        Console.WriteLine(new FileManager().Fetch("password"));
                        break;
                }
                Console.WriteLine("Enter Menu:");
                if(!int.TryParse(Console.ReadLine(), out input))
                    Console.WriteLine("Enter a valid number");
            }
        }
        static void Main(string[] args) => Start();
    }
}