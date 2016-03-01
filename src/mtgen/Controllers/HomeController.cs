using Microsoft.AspNet.Mvc;
using mtgen.Services;
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
            var allSets = _setService.GetSets().Where(s => s.ReleaseDate.HasValue);

            var blocksAndSets = allSets.Where(s => !s.IsBlockSet).ToList();

            var blockNames = allSets.Where(s => s.IsBlockSet).Select(s => s.Block).Distinct().ToList();
            foreach (var blockName in blockNames)
            {
                // For the blocks, gather the sets and put them within
                var blockSet = allSets.Where(s => s.Block == blockName).OrderBy(s => s.ReleaseDate).First();
                blockSet.BlockSets = allSets.Where(s => s.Block == blockName)
                    .OrderByDescending(s => s.ReleaseDate).ToList();

                blocksAndSets.Add(blockSet);
            }

            var allSortedSets = blocksAndSets.OrderByDescending(s => s.ReleaseDate).ToList();

            return View(allSortedSets);
        }

        public IActionResult Error()
        {
            return View();
        }
    }
}
