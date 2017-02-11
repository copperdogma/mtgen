using Microsoft.AspNet.Mvc;
using mtgen.Services;
using mtgen.ViewModels;
using System.Linq;

namespace mtgen.Controllers
{
    public class HomeController : Controller
    {
        private ISetService _setService;

        public HomeController(ISetService setService)
        {
            _setService = setService;
        }

        public IActionResult Index()
        {
            var groupedBlocksAndSets = _setService.GetGroupedBlocksAndSets();

            var sortedGroupedBlocksAndSets = groupedBlocksAndSets.OrderByDescending(s => s.ReleaseDate).ToList();
            var newestCurrentSet = _setService.GetNewestCurrentSet();

            var allSets = new AllSets(newestCurrentSet, sortedGroupedBlocksAndSets);

            return View(allSets);
        }

        public IActionResult About()
        {
            return View();
        }

        public IActionResult Error()
        {
            return View();
        }
    }
}
