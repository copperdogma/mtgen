using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.PlatformAbstractions;
using mtgen.Models;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace mtgen.Services
{
    public class SetService : ISetService
    {
        private readonly IMemoryCache _memoryCache;
        private readonly IApplicationEnvironment _appEnvironment;

        public SetService(IMemoryCache memoryCache, IApplicationEnvironment appEnvironment)
        {
            _memoryCache = memoryCache;
            _appEnvironment = appEnvironment;
        }
        
        public IList<SetStub> GetSetStubs()
        {
            var setStubs = _memoryCache.Get("SetStubs") as IList<SetStub>;
            if (setStubs == null)
            {
                // Load up the set stubs
                var setsJsonPath = _appEnvironment.ApplicationBasePath + "\\wwwroot\\sets.json";
                var setsJson = File.ReadAllText(setsJsonPath);
                setStubs = JsonConvert.DeserializeObject<List<SetStub>>(setsJson);
                SetSetStubs(setStubs);
            }
            return setStubs;
        }

        private void SetSetStubs(IList<SetStub> setStubs)
        {
            _memoryCache.Set("SetStubs", setStubs);
        }

        public SetStub GetSetStub(string setCode)
        {
            return this.GetSetStubs().Where(s => String.Equals(s.Code, setCode, StringComparison.CurrentCultureIgnoreCase)).FirstOrDefault();
        }

        public bool SetExists(string setCode)
        {
            return (this.GetSetStub(setCode) != null);
        }

        public string GetPathForSetFile(string setCode, string fileName)
        {
            return $"\\wwwroot\\{setCode}\\{fileName}";
        }
        public IList<Card> GetCardsFromJsonFile(string jsonFilePath)
        {
            var cardsPath = _appEnvironment.ApplicationBasePath + jsonFilePath;
            var cardsFile = File.ReadAllText(cardsPath);
            var cards = JsonConvert.DeserializeObject<IList<Card>>(cardsFile);
            return cards;
        }

        public IList<Card> GetMainCardsForSet(string setCode)
        {
            return this.GetCardsFromJsonFile(this.GetPathForSetFile(setCode, FilenameConstants.MainCards));
        }
        public IList<Card> GetTokenCardsForSet(string setCode)
        {
            return this.GetCardsFromJsonFile(this.GetPathForSetFile(setCode, FilenameConstants.TokenCards));
        }
        public IList<Card> GetOtherCardsForSet(string setCode)
        {
            return this.GetCardsFromJsonFile(this.GetPathForSetFile(setCode, FilenameConstants.OtherCards));
        }

        public IList<Card> GetAllCardsForSet(string setCode)
        {
            var cards = this.GetMainCardsForSet(setCode).ToList();
            cards.AddRange(this.GetTokenCardsForSet(setCode));
            cards.AddRange(this.GetOtherCardsForSet(setCode));
            return cards;
        }
    }
}
