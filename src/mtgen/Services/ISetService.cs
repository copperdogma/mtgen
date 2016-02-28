﻿using mtgen.ViewModels;
using System.Collections.Generic;

namespace mtgen.Services
{
    public interface ISetService
    {
        IList<Set> GetSets();
        Set GetSet(string setCode);
        string GetPathForSetFile(string setCode, string fileName);
        IList<Card> GetCardsFromJsonFile(string jsonFilePath);
        IList<Card> GetMainCardsForSet(string setCode);
        IList<Card> GetTokenCardsForSet(string setCode);
        IList<Card> GetOtherCardsForSet(string setCode);
        IList<Card> GetAllCardsForSet(string setCode);
    }
}