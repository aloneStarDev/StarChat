using System;
using System.Collections.Generic;
using System.Text;

namespace CsharpClient.Core
{
    public abstract class WebSocketRequest
    {
        protected string BaseUrl = @"ws://127.0.0.1:8000/";
        public abstract UserResponse Send();
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
            Console.WriteLine(Msg);
        }
    }
}