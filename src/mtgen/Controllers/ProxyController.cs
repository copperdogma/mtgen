using Microsoft.AspNet.Mvc;
using System;
using System.Net.Http;
using System.Threading.Tasks;

namespace mtgen.Controllers
{
    public class ProxyController : Controller
    {
        [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        public async Task<string> Index(string u)
        {
            try
            {
                var httpClient = new HttpClient();
                var response = await httpClient.GetAsync(u);

                if (!response.IsSuccessStatusCode)
                {
                    throw new Exception($"Server error (HTTP {response.StatusCode})");
                }

                string result = await response.Content.ReadAsStringAsync();

                return result;
            }
            catch (Exception e)
            {
                return e.Message;
            }
        }
    }
}
