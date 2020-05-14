using Microsoft.WindowsAzure.Storage.Table;
using System;

namespace mtgen.Services
{
    public class DrawEntity : TableEntity
    {
        public DrawEntity(string setCode, string drawId)
        {
            PartitionKey = setCode;
            RowKey = drawId;
        }

        public DrawEntity() { }

        [IgnoreProperty]
        public string DrawId
        {
            get { return RowKey; }
            set { RowKey = value; }
        }

        [IgnoreProperty]
        public string SetCode
        {
            get { return PartitionKey; }
            set { PartitionKey = value; }
        }

        public string Results { get; set; }
        public string UserDrawId { get; set; }
        public long UseCount { get; set; }
        public DateTime LastUsedDateTime { get; set; }
    }
}