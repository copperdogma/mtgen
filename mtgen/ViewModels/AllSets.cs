using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace mtgen.ViewModels
{
    public class AllSets
    {
        public AllSets(Set newestCurrentSet, IReadOnlyCollection<Set> sortedGroupedBlocksAndSets) {
            NewestCurrentSet = newestCurrentSet;
            SortedGroupedBlocksAndSets = sortedGroupedBlocksAndSets;
        }   

        public Set NewestCurrentSet;
        public IReadOnlyCollection<Set> SortedGroupedBlocksAndSets;
    }
}
