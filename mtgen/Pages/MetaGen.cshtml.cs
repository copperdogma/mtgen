using System.Linq;
using Microsoft.AspNetCore.Mvc.RazorPages;
using mtgen.Services;
using mtgen.Models;

namespace mtgen.Pages
{
    public class MetaGenModel : PageModel
    {
        public ISetService _setService { get; }

        public AllSets AllSets { get; set; }

        public MetaGenModel(ISetService setService)
        {
            _setService = setService;
        }

        public void OnGet()
        {
            var groupedBlocksAndSets = _setService.GetGroupedBlocksAndSets();

            var sortedGroupedBlocksAndSets = groupedBlocksAndSets.OrderByDescending(s => s.ReleaseDate).ToList();
            var newestCurrentSet = _setService.GetNewestCurrentSet();

            AllSets = new AllSets(newestCurrentSet, sortedGroupedBlocksAndSets);
        }
    }
}