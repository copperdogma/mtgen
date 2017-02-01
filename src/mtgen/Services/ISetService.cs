using mtgen.ViewModels;
using System.Collections.Generic;

namespace mtgen.Services
{
    public interface ISetService
    {
        IList<Set> GetSets();
        IList<Set> GetGroupedBlocksAndSets();
        Set GetSet(string setCode);
        string GetPathForSetFile(string setCode, string fileName);
        Set GetMainFileForSet(string setCode);
        IList<Card> GetCardsFromJsonFile(string jsonFilePath);
        IList<Card> GetMainCardsForSet(string setCode);
        IList<Card> GetTokenCardsForSet(string setCode);
        IList<Card> GetOtherCardsForSet(string setCode);
        IList<Card> GetAllCardsForSet(string setCode);
    }
}