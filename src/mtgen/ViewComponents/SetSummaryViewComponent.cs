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

        public IViewComponentResult Invoke(SetStubSummary setStubSummary)
        {
            setStubSummary.SetStub = _setService.GetSetStub(setStubSummary.Code);

            return View(setStubSummary);
        }
    }
}
