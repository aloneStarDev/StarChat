using System;
using System.Net.NetworkInformation;
using System.Security.Cryptography;
using System.Text;

namespace CsharpClient.Core
{
    
    public class Crypto
    {
        public static string Hash(string input){
            using (SHA256 sha256Hash = SHA256.Create())  
            {  
                // ComputeHash - returns byte array  
                byte[] bytes = sha256Hash.ComputeHash(Encoding.UTF8.GetBytes(input));  
                
                // Convert byte array to a string   
                StringBuilder builder = new StringBuilder();  
                for (int i = 0; i < bytes.Length; i++)
                {  
                    builder.Append(bytes[i].ToString("x2"));
                }
                return builder.ToString();
            }
        }
        public static void Encrypt(ref byte[] data, string key = "someHashed")
        {
            string salt = "none";
            foreach (NetworkInterface nic in NetworkInterface.GetAllNetworkInterfaces())
                if (nic.NetworkInterfaceType == NetworkInterfaceType.Ethernet)
                    salt = nic.GetPhysicalAddress() + "";
            salt = Hash(salt + key).Substring(0,10);
            for (int i = data.Length - 1; i >= 0; i--)
            {
                Random r = new Random(salt[0]);
                int j = r.Next(10);
                data[i] = (byte)(data[i]-j);
            }
        }

        public static void Decrypt(ref byte[] data, string key = "someHashed")
        {
            string salt = "none";
            foreach (NetworkInterface nic in NetworkInterface.GetAllNetworkInterfaces())
                if (nic.NetworkInterfaceType == NetworkInterfaceType.Ethernet)
                    salt = nic.GetPhysicalAddress() + "";
            salt = Hash(salt + key).Substring(0,10);
            for (int i = data.Length - 1; i >= 0; i--)
            {
                Random r = new Random(salt[0]);
                int j = r.Next(10);
                data[i] = (byte)(data[i]+j);
            }
        }
    }
}