using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using mtgen.Areas.Admin.ViewModels;
using System.Security.Claims;
using System.Threading.Tasks;

namespace mtgen.Areas.Admin.Controllers
{
    [Area("Admin")]
    public class AccountController : Controller
    {
        //
        // GET: /Admin/Login
        [HttpGet]
        [Route("Admin/Login")]
        public IActionResult Login(string returnUrl = null)
        {
            ViewData["ReturnUrl"] = returnUrl;
            return View();
        }

        //
        // POST: /Admin/Login
        [HttpPost]
        [Route("Admin/Login")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Login(LoginViewModel model, string returnUrl = null)
        {
            ViewData["ReturnUrl"] = returnUrl;
            if (ModelState.IsValid)
            {
                // This doesn't count login failures towards account lockout
                // To enable password failures to trigger account lockout, set lockoutOnFailure: true
                if (model.Email == "cam.marsollier@gmail.com" && model.Password == "Thenight9")
                {
                    var claims = new[] { new Claim("name", model.Email), new Claim(ClaimTypes.Role, "Admin") };
                    var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);

                    await HttpContext.Authentication.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(identity));

                    if (string.IsNullOrWhiteSpace(returnUrl))
                    {
                        return RedirectToAction("Index","Admin");
                    }
                    return RedirectToLocal(returnUrl);
                }

                ModelState.AddModelError(string.Empty, "Invalid login attempt.");
                return View(model);
            }

            // If we got this far, something failed, redisplay form
            return View(model);
        }

        private IActionResult RedirectToLocal(string returnUrl)
        {
            if (Url.IsLocalUrl(returnUrl))
            {
                return Redirect(returnUrl);
            }
            else
            {
                return RedirectToAction(nameof(HomeController.Index), "Index");
            }
        }

        //
        // [GET|POST]: /Admin/Logout
        [Route("Admin/Logout")]
        public IActionResult Logout()
        {
            HttpContext.Authentication.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Redirect("/");
        }
    }
}