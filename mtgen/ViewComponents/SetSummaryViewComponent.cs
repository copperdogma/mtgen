using mtgen.ViewModels;
using mtgen.Services;
using Microsoft.AspNetCore.Mvc;

namespace mtgen.ViewComponents
{
    public class SetSummaryViewComponent : ViewComponent
    {
        private readonly ISetService _setService;

        public SetSummaryViewComponent(ISetService setService)
        {
            _setService = setService;
        }

        public IViewComponentResult Invoke(Set set)
        {
            return View(set);
        }
    }
}