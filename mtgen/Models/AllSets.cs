using System.Collections.Generic;

namespace mtgen.Models
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
