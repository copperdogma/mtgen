using System;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace mtgen.Controllers
{
    [Route("proxy")]
    public class ProxyController : ControllerBase
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