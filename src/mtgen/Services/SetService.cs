using Microsoft.AspNet.Hosting;
using Microsoft.Extensions.Caching.Memory;
using mtgen.ViewModels;
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
        private readonly IHostingEnvironment _hostingEnvironment;

        private const string SETS_KEY = "SetsKey";
        private const string BLOCKS_AND_SETS_KEY = "BlocksAndSetsKey";

        public SetService(IMemoryCache memoryCache, IHostingEnvironment hostingEnvironment)
        {
            _memoryCache = memoryCache;
            _hostingEnvironment = hostingEnvironment;
        }

        public IList<Set> GetSets()
        {
            var sets = _memoryCache.Get(SETS_KEY) as IList<Set>;
            if (sets == null)
            {
                // Load up the sets
                var setsJsonPath = _hostingEnvironment.MapPath("sets.json");
                var setsJson = File.ReadAllText(setsJsonPath);
                sets = JsonConvert.DeserializeObject<List<Set>>(setsJson);
                SetSets(sets);
            }
            return sets;
        }

        private void SetSets(IList<Set> sets)
        {
            _memoryCache.Set(SETS_KEY, sets);
        }

        public IList<Set> GetGroupedBlocksAndSets()
        {
            var blocksAndSets = _memoryCache.Get(BLOCKS_AND_SETS_KEY) as IList<Set>;
            if (blocksAndSets == null)
            {
                var allSets = GetSets().Where(s => s.ReleaseDate.HasValue);

                blocksAndSets = allSets.Where(s => !s.IsBlockSet).ToList();

                var blockNames = allSets.Where(s => s.IsBlockSet).Select(s => s.Block).Distinct().ToList();
                foreach (var blockName in blockNames)
                {
                    // For the blocks, gather the sets and put them within
                    var blockSet = allSets.Where(s => s.Block == blockName).OrderBy(s => s.ReleaseDate).First();
                    blockSet.BlockSets = allSets.Where(s => s.Block == blockName)
                        .OrderByDescending(s => s.ReleaseDate).ToList();

                    blocksAndSets.Add(blockSet);
                }
                SetBlocksAndSets(blocksAndSets);
            }

            return blocksAndSets;
        }

        private void SetBlocksAndSets(IList<Set> blocksAndSets)
        {
            _memoryCache.Set(BLOCKS_AND_SETS_KEY, blocksAndSets);
        }

        public Set GetSet(string setCode)
        {
            return GetSets().Where(s => string.Equals(s.Code, setCode, StringComparison.CurrentCultureIgnoreCase)).FirstOrDefault();
        }

        public string GetPathForSetFile(string setCode, string fileName)
        {
            return $"{setCode}\\{fileName}";
        }

        public IList<Card> GetCardsFromJsonFile(string jsonFilePath)
        {
            var cardsPath = _hostingEnvironment.MapPath(jsonFilePath);
            if (!File.Exists(cardsPath)) return new List<Card>();

            var cardsFile = File.ReadAllText(cardsPath);
            var cards = JsonConvert.DeserializeObject<IList<Card>>(cardsFile);
            return cards;
        }

        public IList<Card> GetMainCardsForSet(string setCode)
        {
            return GetCardsFromJsonFile(GetPathForSetFile(setCode, FilenameConstants.MainCards));
        }
        public IList<Card> GetTokenCardsForSet(string setCode)
        {
            return GetCardsFromJsonFile(GetPathForSetFile(setCode, FilenameConstants.TokenCards));
        }
        public IList<Card> GetOtherCardsForSet(string setCode)
        {
            return GetCardsFromJsonFile(GetPathForSetFile(setCode, FilenameConstants.OtherCards));
        }

        public IList<Card> GetAllCardsForSet(string setCode)
        {
            var lowerCaseSetCode = setCode.ToLower();
            var cards = GetMainCardsForSet(lowerCaseSetCode).ToList();
            cards.AddRange(GetTokenCardsForSet(lowerCaseSetCode));
            cards.AddRange(GetOtherCardsForSet(lowerCaseSetCode));
            return cards;
        }
    }
}
