using System.Threading;
using CsharpClient.Core;

namespace CsharpClient
{
    public class Logout:WebSocketHub
    {
        private Logout() : base(FileManager.Configuration["WebsocketAddress"]+"logout")
        {
        }

        public static Logout CreateInstance()
        {
            return new Logout();
        }
        protected override void Scene()
        {
            OnMessage();
        }
    }
}