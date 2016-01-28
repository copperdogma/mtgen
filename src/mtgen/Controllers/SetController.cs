using Microsoft.AspNet.Mvc;
using Microsoft.Extensions.PlatformAbstractions;
using mtgen.Services;
using System;
using System.Threading.Tasks;

namespace mtgen.Controllers
{
    public class SetController : Controller
    {
        private readonly ISetService _setService;
        private readonly IStorageContext _storageContext;
        //private readonly IViewEngine _viewEngine; 20150726: Can't get s to instantiate under MVC6
        private readonly IApplicationEnvironment _appEnvironment;

        public SetController(ISetService setService, IStorageContext storageContext, IApplicationEnvironment appEnvironment)
        {
            _setService = setService;
            _storageContext = storageContext;
            //_viewEngine = viewEngine;
            _appEnvironment = appEnvironment;
        }

        public ActionContext ControllerContext { get; private set; }

        // GET: { 3-letter set name }
        // There may be a ?draw=xxxxxx querystring param, but we ignore that here;
        //  it's used by the client and asynchronously calls back to LoadDraw()
        public ActionResult Index(string setCode)
        {
            var lowerCaseSetCode = setCode.ToLower();
            ViewBag.SetCode = lowerCaseSetCode;
            if (SetViewExists(lowerCaseSetCode))
            {
                return View(lowerCaseSetCode);
            }
            else if (_setService.SetExists(setCode))
            {
                var setStub = _setService.GetSetStub(setCode);
                ViewBag.SetName = setStub.Name;
                return View("ErrorSetNotYetCreated");
            }
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

            var drawEntity = new DrawEntity();
            drawEntity.SetCode = setCode;
            drawEntity.Results = data;
            drawEntity.UserDrawId = userDrawId;

            var uniqueId = await _storageContext.SaveDraw(drawEntity);

            // This will return something like: http://localhost:1491/ogw?draw=TvizXlV
            var returnJson = $"{{ \"drawId\": \"{uniqueId}\", \"url\": \"/{setCode}?draw={uniqueId}\" }}";

            return Json(returnJson);
        }

        // Used by the client if the set url looks like xxx?draw=yyyyyy
        [HttpGet]
        public async Task<IActionResult> LoadDraw(string setCode, string drawId)
        {
            if (drawId == null || drawId.Trim().Length == 0) { return HttpNotFound(); }

            var drawJson = await _storageContext.LoadDraw(setCode, drawId);

            if (drawJson == null) { return HttpNotFound(); }

            return new ObjectResult(drawJson.Results);
        }

        //private bool SetViewExists(string name)
        //{
        //	var path = Server.MapPath("~/Views/" + name.Trim());
        //	var findResult = System.IO.Directory.Exists(path);
        //	return findResult;
        //}

        private bool SetViewExists(string setCode)
        {
            //20150726: Can't get this to instantiate under MVC6
            //var findResult = ViewEngines.Engines.FindView(ControllerContext, name, null);
            //var findResult = _viewEngine.FindView(ControllerContext, name);
            //return (findResult.View != null);

            var viewPath = _appEnvironment.ApplicationBasePath + $"\\Views\\Set\\{setCode}.cshtml";
            var viewPathExists = System.IO.File.Exists(viewPath);
            return viewPathExists;
        }
    }
}