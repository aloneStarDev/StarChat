using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.NetworkInformation;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace CsharpClient.Core
{
    public class FileManager
    {
        private void CheckDir()
        {
            if (!Directory.Exists("Secret"))
                Directory.CreateDirectory("Secret");
        }

        public bool Store(string key, string value)
        {
            try
            {
                CheckDir();
                var path = "Secret" + Path.DirectorySeparatorChar + "token.lock";
                if (!File.Exists(path))
                    File.Create(path).Close();
                FileStream fs = File.Open(path, FileMode.Append);
                BufferedStream bs = new BufferedStream(fs);
                StringBuilder sb = new StringBuilder();
                sb.Append(key);
                sb.Append(":");
                sb.Append(value);
                sb.Append("#");
                byte[] buffer = Encoding.UTF8.GetBytes(sb.ToString());
                Crypto.Encrypt(ref buffer);
                bs.Write(buffer);
                bs.Close();
                fs.Close();
                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
    }
        public string Fetch(string key)
        {
            string value = "";
            CheckDir();
            var path = "Secret" + Path.DirectorySeparatorChar + "token.lock";
            if(!File.Exists(path))
                File.Create(path).Close();
            FileStream fs = File.Open(path, FileMode.Open);
            BufferedStream bs = new BufferedStream(fs);
            byte[] buffer = new byte[bs.Length];
            bs.Read(buffer);
            Crypto.Decrypt(ref buffer);
            List<string> lines = Encoding.UTF8.GetString(buffer).Split("#").ToList();
            foreach (var line in lines)
            {
                if (!string.IsNullOrWhiteSpace(line))
                {
                    string k = line.Split(":")[0];
                    if (k.Equals(key))
                    {
                        value = line.Split(":")[1];
                        break;
                    }
                }
            }
            bs.Close();
            fs.Close();
            return value;
        }
    }
}