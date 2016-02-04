using Microsoft.AspNet.Authorization;
using Microsoft.AspNet.Mvc;
using mtgen.Services;

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
            var popularDraws = _storageContext.GetPopularDraws();
            return View(popularDraws);
        }
    }
}
