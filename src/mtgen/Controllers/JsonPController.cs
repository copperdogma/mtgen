using Microsoft.AspNet.Mvc;
using System;
using System.Net.Http;
using System.Threading.Tasks;

// 20150824: created becuase mtgsalvation SEEMED to be blocking direct access to their spoiler ajax, but it cleared up
// This is supposed to be a jsonp implementation of the other ProxyControler, but it's never been tested
// and I don't think you can even hit it (if you need to try it, check the routing config).
namespace mtgen.Controllers
{
    public class JsonPController : Controller
    {
        [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        public async Task<JsonResult> Index(string u)
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

                return new JsonResult(result);
            }
            catch (Exception e)
            {
                return new JsonResult(e.Message);
            }
        }
    }
}