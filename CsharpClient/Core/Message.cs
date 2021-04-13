namespace CsharpClient.Core
{
    public class Message
    {
        public string id { get; set; }
        public string From { get; set; }
        public string To { get; set; }
        public string MessageType { get; set; }
        public string Body { get; set; }
        public string Token { get; set; }
        public bool Seen { get; set; } = false;
    }
}