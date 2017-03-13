using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using mtgen.Services;
using Newtonsoft.Json;

namespace mtgen.Areas.Admin.Controllers
{
    [Authorize]
    [Area("Admin")]
    public class DrawController : Controller
    {
        private readonly IStorageContext _storageContext;

        public DrawController(IStorageContext storageContext)
        {
            _storageContext = storageContext;
        }

        public IActionResult Index()
        {
            var popularDraws = _storageContext.GetPopularDraws(100);
            return View(popularDraws);
        }

        public IActionResult GetDrawAsFormattedJson(string setCode, string drawId)
        {
            var draw = _storageContext.GetDraw(setCode, drawId);
            var drawJson = draw.Result.Results;
            dynamic parsedJson = JsonConvert.DeserializeObject(drawJson);
            var formattedJson = JsonConvert.SerializeObject(parsedJson, Formatting.Indented);

            return Content(formattedJson);
        }
    }
}