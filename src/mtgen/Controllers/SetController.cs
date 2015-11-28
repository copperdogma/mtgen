using Microsoft.AspNet.Mvc;
using Microsoft.Extensions.PlatformAbstractions;
using mtgen.Services;

namespace mtgen.Controllers
{
    public class SetController : Controller
    {
        private readonly ISetService _setService;
        //private readonly IViewEngine _viewEngine; 20150726: Can't get this to instantiate under MVC6
        private readonly IApplicationEnvironment _appEnvironment;

        public SetController(ISetService setService, IApplicationEnvironment appEnvironment)
        {
            _setService = setService;
            //_viewEngine = viewEngine;
            _appEnvironment = appEnvironment;
        }

        public ActionContext ControllerContext { get; private set; }

        // GET: { 3-letter set name }
        public ActionResult Index(string setCode, string saved)
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

        //[HttpPost]
        //public JsonResult SaveDraw(string data)
        //{
        //	var permanentUrl = "";
        //	var permaGuid = Convert.ToBase64String(Guid.NewGuid().ToByteArray()); // there is always a == at the end
        //	permaGuid = permaGuid.Substring(0, permaGuid.Length - 2);
        //	Session[permaGuid] = data;

        //	// this will return something like: http://localhost:1491/LoadDraw/?saved=ahlaYo3tP069pjTvizXlVg
        //	permanentUrl = Request.Url.ToString().Replace("SaveDraw","LoadDraw") + "?saved=" + permaGuid.ToString();

        //	return Json(permanentUrl, JsonRequestBehavior.AllowGet);
        //}

        //[HttpGet]
        //public JsonResult LoadDraw(string saved)
        //{
        //	// TODO: need to add some sort of counter for every LoadDraw called for a particular saved guid
        //	//	so we know which have been used/used a lot/not used and can be deleted
        //	var savedData = Session[saved];
        //	if (savedData == null)
        //	{
        //		return Json("No data", JsonRequestBehavior.AllowGet);
        //	}

        //	return Json(savedData, JsonRequestBehavior.AllowGet);
        //}

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