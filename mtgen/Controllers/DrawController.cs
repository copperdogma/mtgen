using Microsoft.AspNetCore.Mvc;
using mtgen.Services;
using System;
using System.Threading.Tasks;

namespace mtgen.Controllers
{
    // A draw consists of a saved array of sets containing cards, plus metadata.
    [Route("api/{setCode}/draws")]
    [ApiController]
    public class DrawController : ControllerBase
    {
        private readonly IStorageContext _storageContext;

        public DrawController(IStorageContext storageContext)
        {
            _storageContext = storageContext;
        }

        // Get a saved draw.
        // GET: api/iko/draws/37jd8
        // Used by the client if the set url looks like xxx?draw=yyyyyy
        // This API call is used separately and asynchronously after the main page is loaded.
        [HttpGet("{drawId}")]
        public async Task<ActionResult> Get(string setCode, string drawId)
        {
            if (drawId == null || drawId.Trim().Length == 0) return new NotFoundResult();

            var draw = await _storageContext.LoadDraw(setCode, drawId);

            if (draw == null) return new NotFoundResult();

            // Returning Content() with an explicit contentType because draw.Results is already json.
            return Content(draw.Results, "application/json");
        }

        // Save a draw. Returns the saved drawId.
        // POST: api/iko/draws
        [HttpPost]
        public async Task<ActionResult> Post(string setCode, [FromBody]System.Text.Json.JsonElement data)
        {
            // See if the user already has a userDrawId. If not, create one for them.
            // This (will be used) to tie a user's draws together so they can see a list of them.
            var userDrawId = HttpContext.Request.Cookies["userDrawId"];
            if (string.IsNullOrWhiteSpace(userDrawId))
            {
                // A GUID to hold the drawId.
                userDrawId = Guid.NewGuid().ToString();

                // Send drawId as a cookie to the client.
                HttpContext.Response.Cookies.Append("userDrawId", userDrawId);
            }

            var drawEntity = new DrawEntity
            {
                SetCode = setCode,
                Results = data.ToString(),
                UserDrawId = userDrawId
            };
            var uniqueId = await _storageContext.SaveDraw(drawEntity);

            // This will return something like: http://localhost:1491/ogw?draw=TvizXlV
            var returnJson = $"{{ \"drawId\": \"{uniqueId}\", \"url\": \"/{setCode}?draw={uniqueId}\" }}";

            return new JsonResult(returnJson);
        }
    }
}