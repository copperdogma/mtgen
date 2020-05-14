using System.IO;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using mtgen.Models;
using mtgen.Services;

namespace mtgen.Pages
{
    public class SingleSetModel : PageModel
    {
        private readonly ISetService _setService;
        private readonly IWebHostEnvironment _webHostEnvironment;

        public Set Set { get; set; }

        [BindProperty(SupportsGet = true)]
        public string Draw { get; set; }

        public SingleSetModel(ISetService setService, IWebHostEnvironment webHostEnvironment)
        {
            _setService = setService;
            _webHostEnvironment = webHostEnvironment;
        }

        // GET: { 3-letter set name }
        // There may be a ?draw=xxxxxx querystring param, but we ignore that here;
        //  it's used by the client and asynchronously calls back to LoadDraw() 
        public IActionResult OnGet(string setCode)
        {
            Set = _setService.GetSet(setCode);

            var lowerCaseSetCode = setCode.ToLower();

            if (SetFileExists(lowerCaseSetCode))
            {
                var setMain = _setService.GetMainFileForSet(lowerCaseSetCode);
                Set.StartProductName = setMain.StartProductName;
                Set.CardFiles = setMain.CardFiles;
                Set.PackFiles = setMain.PackFiles;
                Set.Updates = setMain.Updates;

                return new PageResult();
            }
            else if (Set != null)
            {
                TempData["SetCode"] = setCode;
                TempData["SetName"] = Set.Name;
                return new RedirectToPageResult("Errors/SetNotYetCreated");
            }

            TempData["SetCode"] = setCode;

            return new RedirectToPageResult("Errors/NoSuchSet");
        }

        private bool SetFileExists(string setCode)
        {
            var filePath = Path.Combine(_webHostEnvironment.WebRootPath, setCode, "set.json");
            var filePathExists = System.IO.File.Exists(filePath);
            return filePathExists;
        }
    }
}