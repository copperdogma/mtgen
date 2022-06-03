using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
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
        private readonly ILogger<DrawController> _logger;
        private const string USER_DRAW_ID_KEY = "userDrawId";

        public DrawController(IStorageContext storageContext, ILogger<DrawController> logger)
        {
            _storageContext = storageContext;
            _logger = logger;
        }

        // Get a saved draw.
        // GET: api/iko/draws/37jd8
        // Used by the client if the set url looks like xxx?draw=yyyyyy
        // This API call is used separately and asynchronously after the main page is loaded.
        [HttpGet("{drawId}")]
        public async Task<ActionResult> GetDraw(string setCode, string drawId)
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
        public async Task<ActionResult> SaveDraw(string setCode, [FromBody] System.Text.Json.JsonElement data)
        {
            _logger.LogWarning("Test log: creating draw");

            // See if the user already has a userDrawId. If not, create one for them.
            // This (will be used) to tie a user's draws together so they can see a list of them.
            var userDrawId = HttpContext.Request.Cookies[USER_DRAW_ID_KEY];
            if (string.IsNullOrWhiteSpace(userDrawId))
            {
                // A GUID to hold the drawId.
                userDrawId = Guid.NewGuid().ToString();

                // Send drawId as a cookie to the client.
                HttpContext.Response.Cookies.Append(USER_DRAW_ID_KEY, userDrawId);
            }

            var drawEntity = new DrawEntity
            {
                SetCode = setCode,
                Results = data.ToString(),
                UserDrawId = userDrawId
            };
            var uniqueId = await _storageContext.SaveDraw(drawEntity);

            // This will return something like: http://localhost:1491/ogw?draw=TvizXlV
            // This will be picked up and used by the Save Draw modules in mtg-generator.js
            var returnJson = new { drawId = uniqueId, url = $"/{setCode}?draw={uniqueId}" };

            return Ok(returnJson);
        }
    }
}