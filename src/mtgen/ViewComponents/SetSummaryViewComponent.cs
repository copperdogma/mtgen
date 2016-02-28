using Microsoft.AspNet.Mvc;
using mtgen.ViewModels;
using mtgen.Services;

namespace mtgen.ViewComponents
{
    public class SetSummaryViewComponent : ViewComponent
    {
        private readonly ISetService _setService;

        public SetSummaryViewComponent(ISetService setService)
        {
            _setService = setService;
        }

        public IViewComponentResult Invoke(SetSummary setSummary)
        {
            setSummary.Set = _setService.GetSet(setSummary.Code);

            return View(setSummary);
        }
    }
}
