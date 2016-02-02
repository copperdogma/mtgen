using Microsoft.AspNet.Authorization;
using Microsoft.AspNet.Mvc;

namespace mtgen.Areas.Admin.Controllers
{
    [Authorize]
    [Area("Admin")]
    public class HomeController : Controller
    {
        //CAMKILL: enabling this makes /Admin/Home, /Admin/Home/Index not work at all [Route("[controller]")]
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Error()
        {
            return View();
        }
    }
}
