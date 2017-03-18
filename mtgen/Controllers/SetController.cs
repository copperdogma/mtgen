using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using mtgen.Services;
using System;
using System.Threading.Tasks;

namespace mtgen.Controllers
{
    public class SetController : Controller
    {
        private readonly ISetService _setService;
        private readonly IStorageContext _storageContext;
        private readonly IHostingEnvironment _hostingEnvironment;

        public SetController(ISetService setService, IStorageContext storageContext, IHostingEnvironment hostingEnvironment)
        {
            _setService = setService;
            _storageContext = storageContext;
            _hostingEnvironment = hostingEnvironment;
        }

        // GET: { 3-letter set name }
        // There may be a ?draw=xxxxxx querystring param, but we ignore that here;
        //  it's used by the client and asynchronously calls back to LoadDraw()
        public IActionResult Index(string setCode)
        {
            var set = _setService.GetSet(setCode);

            var lowerCaseSetCode = setCode.ToLower();

            if (SetFileExists(lowerCaseSetCode))
            {
                var setMain = _setService.GetMainFileForSet(lowerCaseSetCode);
                set.StartProductName = setMain.StartProductName;
                set.CardFiles = setMain.CardFiles;
                set.PackFiles = setMain.PackFiles;
                set.Updates = setMain.Updates;

                return View("SetView", set);
            }

            // Certain words are reserved (con, aux, etc) so I suffix them with _
            else if (SetFileExists(lowerCaseSetCode + "_"))
            {
                return View(lowerCaseSetCode + "_", set);
            }
            else if (set != null)
            {
                ViewBag.SetCode = setCode;
                ViewBag.SetName = set.Name;
                return View("ErrorSetNotYetCreated");
            }

            ViewBag.SetCode = setCode;
            return View("ErrorNoSuchSet");
        }

        [HttpPost]
        async public Task<JsonResult> SaveDraw(string setCode, string data)
        {
            // See if the user already has a userDrawId. If not, create one for them.
            // This (will be used) to tie a user's draws together so they can see a list of them.
            var userDrawId = HttpContext.Request.Cookies["userDrawId"];
            if (string.IsNullOrWhiteSpace(userDrawId))
            {
                // A GUID to hold the cartId.
                userDrawId = Guid.NewGuid().ToString();

                // Send cart Id as a cookie to the client.
                HttpContext.Response.Cookies.Append("userDrawId", userDrawId);
            }

            var drawEntity = new DrawEntity()
            {
                SetCode = setCode,
                Results = data,
                UserDrawId = userDrawId
            };
            var uniqueId = await _storageContext.SaveDraw(drawEntity);

            // This will return something like: http://localhost:1491/ogw?draw=TvizXlV
            var returnJson = $"{{ \"drawId\": \"{uniqueId}\", \"url\": \"/{setCode}?draw={uniqueId}\" }}";

            return Json(returnJson);
        }

        // Used by the client if the set url looks like xxx?draw=yyyyyy
        [HttpGet]
        //CAMKILL:public async Task<IActionResult> LoadDraw(string setCode, string drawId)
        public async Task<IActionResult> LoadDraw(string setCode, string drawId)
        {
            if (drawId == null || drawId.Trim().Length == 0) { return new NotFoundResult(); }

            var drawJson = await _storageContext.LoadDraw(setCode, drawId);

            if (drawJson == null) { return new NotFoundResult(); }

            //CAMKILL:return new ObjectResult(drawJson.Results);
            return Json(drawJson.Results);
        }

        private bool SetFileExists(string setCode)
        {
            var filePath = $"{_hostingEnvironment.WebRootPath}\\{setCode}\\set.json";
            var filePathExists = System.IO.File.Exists(filePath);
            return filePathExists;
        }
    }
}