using mtgen.Models;
using System.Collections.Generic;

namespace mtgen.Services
{
    public interface ISetService
    {
        IList<Set> GetSets();
        Set GetNewestCurrentSet();
        IList<Set> GetGroupedBlocksAndSets();
        Set GetSet(string setCode);
        Set GetMainFileForSet(string setCode);
        IList<Card> GetCardsFromJsonFile(string setCode, string filename);
        IList<Card> GetMainCardsForSet(string setCode);
        IList<Card> GetTokenCardsForSet(string setCode);
        IList<Card> GetOtherCardsForSet(string setCode);
        IList<Card> GetAllCardsForSet(string setCode);
    }
}