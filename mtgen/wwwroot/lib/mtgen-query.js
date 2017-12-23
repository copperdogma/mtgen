/*
MtGenerator Query class v1.0

Author: Cam Marsollier cam.marsollier@gmail.com

30-Jul-2017: Created.
*/

class MtgenQuery {
    constructor(dataApi) {
        // If missing any essentials, abort
        if (dataApi == null) { throw new Error(`Missing dataApi (from mtgen-data.js). Cannot continue.`); }
        this._dataApi = dataApi;

        this.version = "v1.0.0";

        // Add related data that will help querying later on.
        window.addEventListener('data-loaded', async (e) => {
            await this._addAdditionalPackData();
        }, false);
    }

    async _addAdditionalPackData() {
        let querySetPercentAvg;
       //CAMKILL: for (let packKey in this._dataApi.packs) {
        this._dataApi.packs.forEach(async (pack) => {
            // Check the querySets and add percentages if they're missing (missing means they all have an equal chance)
            if (!pack.cards) { return; }

            pack.cards.forEach(cardsDef => {
                if (cardsDef.querySet === undefined) { return; }

                if (cardsDef.querySet.length > 0 && cardsDef.querySet[0].query !== undefined) {
                    if (cardsDef.querySet[0].percent === undefined) {
                        querySetPercentAvg = 100 / cardsDef.querySet.length;
                        cardsDef.querySet.forEach(querySet => {
                            querySet.percent = querySetPercentAvg;
                        });
                    }
                    else {
                        cardsDef.querySet.forEach(querySet => {
                            const percentValue = Number(querySet.percent);
                            // If it's not a number, assume it's a fraction and attempt to convert to percent
                            if (Number.isNaN(percentValue)) {
                                const parts = querySet.percent.split("/");
                                if (parts.length !== 2) {
                                    console.log(`ERROR: bad percent (only decimals or fractions allowed): ${querySet.percent}`);
                                }
                                else {
                                    querySet.percent = (parts[0] / parts[1]) * 100;
                                }
                            }
                            // Otherwise it's a number -- just keep it like that
                            else {
                                querySet.percent = percentValue;
                            }
                        });
                    }
                }
            });
        });

        // TODO: I may be conflating defs and packDefs in various places:( Check the old code. Probably revert the names back.

        // Execute the pack def queries, storing the resultant card set on each def.
        await this._cachePackDefs(this._dataApi.defs);
    }

    async _cachePackDefs(defs) {
        if (defs === undefined) { return defs; }

        //CAMKILL:
        //defs.forEach(async (def) => {
        //    def.cards = await this._executeQuery(this._dataApi.cards, this._dataApi.defs, def.query);
        //    if (def.cards.length < 1) {
        //        console.warn(`WARNING: createPackDefs(): no results from pack definition '${def.defName}': ${def.query}`);
        //    }
        //});

        for (let def of defs.values()) {
            def.cards = await this._executeQuery(this._dataApi.cards, this._dataApi.defs, def.query);
            if (def.cards.length < 1) {
                console.warn(`WARNING: createPackDefs(): no results from pack definition '${def.defName}': ${def.query}`);
            }
        }
    }

    //CAMKILL:
    //async _createPackDefs(defs) {
    //    let packDefs = [];
    //    if (defs === undefined) { return packDefs; }

    //    defs.forEach(async (def) => {
    //        const defSet = await this._executeQuery(this._dataApi.cards, this._dataApi.defs, def.query);
    //        packDefs[def.defName] = defSet;
    //        if (defSet.length < 1) {
    //            console.warn(`WARNING: createPackDefs(): no results from pack definition '${def.defName}': ${def.query}`);
    //        }
    //    });
    //    return packDefs;
    //}

    async generateCardSetsFromPacks(packs) {
        // If missing any essentials, abort
        if (packs == null) { throw new Error(`Missing packs. Cannot continue.`); }

        // Generate the requested sets
        let generatedSets = [];
        const that = this;
        //CAMKILL:
        //packs.forEach(async (pack) => {
        //    // Create X of the desired packs.
        //    for (let i = 0; i < pack.count; i++) {
        //        var fullPack = that._dataApi.packs.get(pack.packName);
        //        if (fullPack === undefined) { throw new Error(`generateCardSetsFromPacks: Missing pack def '${pack.packName}'`); }
        //        const cardSet = await this._generateCardSetFromPack(fullPack);
        //        generatedSets.push(cardSet);
        //    }
        //});
        for(const pack of packs) {
            // Create X of the desired packs.
            for (let i = 0; i < pack.count; i++) {
                var fullPack = that._dataApi.packs.get(pack.packName);
                if (fullPack === undefined) { throw new Error(`generateCardSetsFromPacks: Missing pack def '${pack.packName}'`); }
                const cardSet = await this._generateCardSetFromPack(fullPack);
                cardSet.forEach(set => set.setIndex = i); // So they can be sorted by the originally generated order.
                generatedSets.push(cardSet);
            }
        }

        generatedSets.totalLength = generatedSets.reduce((total, cardSet) => total + cardSet.length, 0);

        return generatedSets;

        // TODO: take this method code from original generateCardSetsFromPacks

        // TODO: copy all query stuff from mtg-generator-lib

        // TODO: redo this; make a new product.currentSettings that this reads from
    }

    async _generateCardSetFromPack(pack) {
        // If missing any essentials, abort
        if (pack == null) { throw new Error(`Missing pack. Cannot continue.`); }

        let cardQueries = [];

        // Go through each card query in the pack and select it according to its query
        pack.cards.forEach(cardDef => {
            if (cardDef.querySet) {
                const totalWeight = cardDef.querySet.reduce((total, query) => total + query.percent, 0);

                // Choose the card query percent; we want decimal numbers because the cards can be specified as such (e.g.: 1/8 chance = 12.5%)
                let percent = Math.random() * totalWeight;
                if (percent > totalWeight) { percent = totalWeight; }

                // Choose the card query that matches that weighted percentage
                let currentWeight = 0;
                const chosenCardDefItem = cardDef.querySet.find(cardDefItem => {
                    currentWeight += cardDefItem.percent;
                    if (currentWeight >= percent) { return true; }
                });
                cardQueries.push(chosenCardDefItem);
            }
            else if (cardDef.query) {
                cardQueries.push(cardDef);
            }
            else {
                console.error(`cardDef doesn't have a queryDef or query property: ${cardDef}`);
            }
        });

        // Basically if the pack was created with usableForDeckBuilding=false then use that, otherwise default to true
        let usableForDeckBuilding = pack.usableForDeckBuilding || true;

        // Execute each card template's query to choose the actual card
        let cardSet = [];
        let cardIndices = [];
        let index = 0;
        for (const cardDef of cardQueries) {
            const isOrderImportant = cardDef.inOrder && cardDef.inOrder === true;
            const possibleCards = await this._executeQuery(this._dataApi.cards, this._dataApi.defs, cardDef.query, isOrderImportant);

            let takeCount = 1;
            const take = cardDef.query.match(/take\[(.+)\]>/i);
            if (take) {
                takeCount = take[1];
            }

            // Shallow clone the cards via .slice().
            let chosenCards;
            if (takeCount == "*") {
                chosenCards = possibleCards.slice();
            }
            else if (cardDef.canBeDuplicate === true) {
                chosenCards = randomCards(cardDef.query, possibleCards, takeCount).slice();
            }
            else {
                chosenCards = randomCards(cardDef.query, possibleCards, takeCount, cardIndices).slice();
            }

            // Apply any setValues
            if (cardDef.setValues) {
                // clone via Object.assign() so we don't modify the original cards
                chosenCards = chosenCards.map(chosenCard => Object.assign({}, chosenCard, cardDef.setValues));
            }

            chosenCards.forEach(card => {
                // Apply usableForDeckBuilding if not already specified
                if (card.usableForDeckBuilding === undefined) {
                    card.usableForDeckBuilding = usableForDeckBuilding;
                }
                cardIndices.push(card.mtgenId);
                card.index = index++; // So they can be sorted by the originally generated order.
                cardSet.push(card);
            });
        }

        cardSet.setName = pack.packName;
        cardSet.setDesc = pack.packDesc;
        cardSet.packVersion = pack.packVersion;

        // Used to ensure things like promos aren't included when you sort all cards by colour
        // NOTE: this isn't really used right now -- I'm leaving it in in case it's useful when we start actually letting the user build decks
        cardSet.includeWithUserCards = pack.includeWithUserCards;
        if (pack.includeWithUserCards !== false) {
            cardSet.includeWithUserCards = true;
        }

        return cardSet;
    }

    //CAMKILL:
    //    // Execute each card template's query to choose the actual card
    //    let cardSet = [];
    //    let cardIndices = [];
    //    cardQueries.forEach(async (cardDef) => {
    //        const isOrderImportant = cardDef.inOrder && cardDef.inOrder === true;
    //        const possibleCards = await this._executeQuery(this._dataApi.cards, this._dataApi.defs, cardDef.query, isOrderImportant);

    //        let takeCount = 1;
    //        const take = cardDef.query.match(/take\[(.+)\]>/i);
    //        if (take) {
    //            takeCount = take[1];
    //        }

    //        // Shallow clone the cards via .slice().
    //        let chosenCards;
    //        if (takeCount == "*") {
    //            chosenCards = possibleCards.slice();
    //        }
    //        else if (cardDef.canBeDuplicate === true) {
    //            chosenCards = randomCards(cardDef.query, possibleCards, takeCount).slice();
    //        }
    //        else {
    //            chosenCards = randomCards(cardDef.query, possibleCards, takeCount, cardIndices).slice();
    //        }

    //        // Apply any setValues
    //        if (cardDef.setValues) {
    //            // clone via Object.assign() so we don't modify the original cards
    //            chosenCards = chosenCards.map(chosenCard => Object.assign({}, chosenCard, cardDef.setValues));
    //        }

    //        chosenCards.forEach(card => {
    //            // Apply usableForDeckBuilding if not already specified
    //            if (card.usableForDeckBuilding === undefined) {
    //                card.usableForDeckBuilding = usableForDeckBuilding;
    //            }
    //            cardIndices.push(card.mtgenId);
    //            cardSet.push(card);
    //        });
    //    });

    //    cardSet.setName = pack.packName;
    //    cardSet.setDesc = pack.packDesc;
    //    cardSet.packVersion = pack.packVersion;

    //    // Used to ensure things like promos aren't included when you sort all cards by colour
    //    // NOTE: this isn't really used right now -- I'm leaving it in in case it's useful when we start actually letting the user build decks
    //    cardSet.includeWithUserCards = pack.includeWithUserCards;
    //    if (pack.includeWithUserCards !== false) {
    //        cardSet.includeWithUserCards = true;
    //    }

    //    return cardSet;
    //}

    // SHOULD NOT BE CALLED EXCEPT BY executeQuery()
    // Returns only the card indices
    async _executeSimpleQuery(fullSet, defs, query, isOrderImportant) {
        //console.log('executeSimpleQuery:' + query);
        let from = query.match(/from\[(.+)\]/i);
        if (!from) {
            console.warn(`ERROR: executeSimpleQuery(): missing 'from' in query: ${query}`);
        }
        else {
            from = from[1];
        }

        let query2 = query.match(/\?(.+)=(.+)/i);

        let result = [];

        // Determine base set to select from
        let sourceSet = [];
        if (from == "*") {
            //CAMKILL:sourceSetCards = fullSet;
            sourceSet = [...fullSet.values()];
        }
        // Select from previously-defined set
        else {
            //CAMKILL:
            //sourceSetCards = defs.get(from);
            //if (sourceSetCards === undefined) {
            //    console.warn(`ERROR: executeSimpleQuery(): def '${from}' does not exist within query: ${query}`);
            //}
            const def = defs.get(from);
            if (def === undefined) {
                console.warn(`ERROR: executeSimpleQuery(): def '${from}' does not exist within query: ${query}`);
            }
            if (def.cards === undefined) {
                console.warn(`ERROR: executeSimpleQuery(): def.cards for '${from}' has not been initialized when executing query: ${query}`);
            }
            sourceSet = def.cards;
        }

        if (sourceSet === undefined) {
            var xxx = 1;
        }
       //CAMKILL: const sourceSet = Object.values(sourceSetCards)
        //try {
        //    var xxxx = [...sourceSetCards.values()];
        //}
        //catch (ex) {
        //    var xxx = ex;
        //    var xx2 = 1;
        //}
        //const sourceSet = [...sourceSetCards.values()];

        // Execute the query on the set
        if (!query2) {
            result = sourceSet.map(card => card.mtgenId);
        }
        else {
            let matchingCards, clause, queryTitles, queryMatchTitles;
            if (query2[2].includes('contains(')) {
                // 'contains' clause, like colour=contains({W}|{G}), i.e.: we're basically letting the user specify a regex within the contains()
                clause = query2[2].replace(/contains\(/g, '').replace(/\)/g, '');
                matchingCards = sourceSet.filter(card => card[query2[1]] && card[query2[1]].match(clause));
                result = matchingCards.map(matchingCard => matchingCard.mtgenId);
            }
            else if (query2[2].includes('(')) {
                // 'in' clause
                // WAS doing greedy matching.. |Smite| was matching "Loxodon Smiter", so ^(****)$ required (^=start of string, $=end of string)
                clause = '^(' + query2[2].replace(/\(/g, '').replace(/\)/g, '') + ')$';

                if (query2[1] == 'title') {
                    queryTitles = clause.replace('\^(', '').replace(')\$', '').split('|');
                    queryMatchTitles = queryTitles.map(queryTitle => MtgenData.createMatchTitle(queryTitle));
                    clause = '^(' + queryMatchTitles.join('|') + ')$';
                    // TODO: wtf? I'm doing a creteMatchTitle() on card['matchTitle']??
                    matchingCards = sourceSet.filter(card => card.hasOwnProperty('matchTitle') && MtgenData.createMatchTitle(card['matchTitle']).match(clause));
                }
                else {
                    clause = clause.toLowerCase();
                    matchingCards = sourceSet.filter(card => card.hasOwnProperty(query2[1]) && card[query2[1]].toString().toLowerCase().match(clause));
                }

                // if it's a title query and the query specified "inOrder:true" then the order of the cards is important; sort by that
                if (query2[1] == 'title' && isOrderImportant === true) {
                    let sortedCards = [];
                    queryMatchTitles.forEach(queryMatchTitle => {
                        const foundCard = matchingCards.find(matchingCard => matchingCard.matchTitle == queryMatchTitle);
                        if (foundCard) {
                            sortedCards.push(foundCard);
                        }
                    });
                    matchingCards = sortedCards;
                }
                result = matchingCards.map(matchingCard => matchingCard.mtgenId);

                // if we're dealing with named cards, check if any items in the list are missing -- we'll call this an error and generate an error card
                if (query2[1] == 'title' && result.length < queryMatchTitles.length) {
                    const foundCardTitles = matchingCards.map(matchingCard => matchingCard.matchTitle);
                    const missingMatchTitles = queryMatchTitles.filter(x => !foundCardTitles.includes(x));
                    missingMatchTitles.forEach(matchTitle =>
                        console.warn(`WARNING: missing card: '${matchTitle}' from query: ${query}`)
                    );
                }
            }
            else {
                // Regular equals
                query2[2] = query2[2].replace(/'/g, '');

                // If we're dealing with named cards, certain characters need to be converted
                matchingCards = [];
                if (query2[1] == 'title') {
                    const matchTitle = MtgenData.createMatchTitle(query2[2]);
                    matchingCards = sourceSet.filter(card => card.hasOwnProperty('matchTitle') && card['matchTitle'] == matchTitle);
                }
                else {
                    if (query2[2] === undefined || query2[2] === '') {
                        matchingCards = sourceSet.filter(card => !card.hasOwnProperty(query2[1]) || card[query2[1]] == query2[2]);
                    }
                    // If it's a boolean query, convert both sides to boolean and test
                    else if (query2[2] === true || query2[2] === 'true' || query2[2] === false || query2[2] === 'false') {
                        const boolQueryValue = JSON.parse(query2[2]);
                        matchingCards = sourceSet.filter(card => {
                            if (card[query2[1]] !== undefined) {
                                if (boolQueryValue === true) {
                                    return (card[query2[1]] === true || card[query2[1]] === 'true');
                                }
                                else {
                                    return (card[query2[1]] === false || card[query2[1]] === 'false');
                                }
                            }
                        });
                    }
                    else {
                        matchingCards = sourceSet.filter(card => card[query2[1]] !== undefined && card[query2[1]] == query2[2]);
                    }
                }
                result = matchingCards.map(matchingCard => matchingCard.mtgenId);
            }
        }

        return result;
    }

    // The pattern should be something like: from[*]?rarity=(c,u,r,mr)+from[*]?type='Land'-from[*]?type=('Marketing','Token')
    // i.e.: a base query then a set of set addition and subtractions
    // fullSet = all card objects
    async _executeQuery(fullSet, defs, query, isOrderImportant) {
        const queries = query.split(/(\+|-)(?=from|take)/); // split on + or - (set operators), but keep the operator

        let operator = '';
        //CAMKILL:let firstRun = true;
        let resultIndices = [];
        for (let [index, query] of queries.entries()) {
            // On the first run though, the initial query should just be the base
            //CAMKILL:if (firstRun === true) {
            if (index === 0) {
                resultIndices = await this._executeSimpleQuery(fullSet, defs, query, isOrderImportant); // returns only indices
                //console.log('executeSimpleQuery count/query:' + resultIndices.length + '/' + query);
                //CAMKILL:firstRun = false;
            }
            else {
                // Now every even array element should be the operator
                if (index % 2 == 1) {
                    operator = query;
                }
                else {
                    const set = await this._executeSimpleQuery(fullSet, defs, query, isOrderImportant); // returns only indices
                    //console.log('executeSimpleQuery count/query:' + set.length + '/' + query);
                    switch (operator) {
                        case "+": resultIndices = resultIndices.concat(set); break;
                        case "-": resultIndices = resultIndices.filter(x => !set.includes(x)); break;
                        default: console.error(`ERROR: expected + or - operator in query '${query}' but instead found '${operator}'`);
                    }
                }
            }
        }

        // Match these indices back up with the actual objects and return that
        const finalResult = resultIndices.map(resultIndex => fullSet.get(resultIndex));

        if (finalResult.length < 1) {
            console.warn(`WARNING: executeQuery(): no results from query: ${query}`);
        }

        return finalResult;
    }

    //CAMKILL:
    //// The pattern should be something like: from[*]?rarity=(c,u,r,mr)+from[*]?type='Land'-from[*]?type=('Marketing','Token')
    //// i.e.: a base query then a set of set addition and subtractions
    //// fullSet = all card objects
    //async _executeQuery(fullSet, defs, query, isOrderImportant) {
    //    const queries = query.split(/(\+|-)(?=from|take)/); // split on + or - (set operators), but keep the operator

    //    let operator = '';
    //    //CAMKILL:let firstRun = true;
    //    let resultIndices = [];
    //    queries.forEach(async (query, index) => {
    //        // On the first run though, the initial query should just be the base
    //       //CAMKILL:if (firstRun === true) {
    //        if (index === 0) {
    //            resultIndices = await this._executeSimpleQuery(fullSet, defs, query, isOrderImportant); // returns only indices
    //            //console.log('executeSimpleQuery count/query:' + resultIndices.length + '/' + query);
    //            //CAMKILL:firstRun = false;
    //            var xxx = 1;
    //        }
    //        else {
    //            // Now every even array element should be the operator
    //            if (index % 2 == 1) {
    //                operator = query;
    //            }
    //            else {
    //                const set = await this._executeSimpleQuery(fullSet, defs, query, isOrderImportant); // returns only indices
    //                //console.log('executeSimpleQuery count/query:' + set.length + '/' + query);
    //                switch (operator) {
    //                    case "+": resultIndices = resultIndices.concat(set); break;
    //                    case "-": resultIndices = resultIndices.filter(x => !set.includes(x)); break;
    //                    default: console.error(`ERROR: expected + or - operator in query '${query}' but instead found '${operator}'`);
    //                }
    //            }
    //        }
    //    });

    //    // Match these indices back up with the actual objects and return that
    //    const finalResult = resultIndices.map(resultIndex => fullSet[resultIndex]);

    //    if (finalResult.length < 1) {
    //        console.warn(`WARNING: executeQuery(): no results from query: ${query}`);
    //    }

    //    return finalResult;
    //}

    // Returns an object containing one array for each unique propName found.
    async _groupByProperty(arr, propName) {
        const out = arr.reduce((final, elem) => {
            const propValue = elem[propName];
            if (!final.hasOwnProperty(propValue)) {
                final[propValue] = [];
            }
            final[propValue].push(elem);
            return final;
        }, {});
        return out;
    }
    
    async sortAllBy(cardList, sortType) {
        switch (sortType.toLowerCase()) {
            case 'nothing': return await this.sortAllByNothing(cardList);
            case 'name':
            case 'title': return this.sortByName(cardList);
            case 'colour': return await this.groupAllByColour(cardList);
            case 'rarity': return await this.groupAllByRarity(cardList);
            case 'cost': return await this.groupAllByCost(cardList);
            case 'type': return await this.groupAllByType(cardList);
            case 'guild': return await this.groupAllByGuild(cardList);
            case 'clan': return await this.groupAllByClan(cardList);
            case 'faction': return await this.groupAllByFaction(cardList);
            default:
                console.warn('Unknown sort type: ' + sortType);
                return this.sortByName(cardList);
        }
    }

    async _convertSetsToArray(arrayOrSets) {
        if (arrayOrSets.length && arrayOrSets[0].length) {
            let sourceCards = [];
            arrayOrSets.forEach(set => sourceCards = sourceCards.concat(set));
            return sourceCards;
        }
        else {
            return arrayOrSets;
        }
    }

    async sortAllByNothing(cardList) {
        cardList.sortOrder = MtgenQuery.sortOrders.none;
        return cardList;
    }

    async sortBy(cardList, sortType) {
        switch (sortType.toLowerCase()) {
            case 'nothing': return await this.sortAllByNothing(cardList);
            case 'name':
            case 'title': return this.sortByName(cardList);
            case 'colour': return await this.sortByColour(cardList);
            case 'rarity': return await this.sortByRarity(cardList);
            case 'cost': return await this.sortByCost(cardList);
            case 'type': return await this.sortByType(cardList);
            case 'guild': return await this.sortByGuild(cardList);
            case 'clan': return await this.sortByClan(cardList);
            case 'faction': return await this.sortByFaction(cardList);
            default:
                console.warn('Unknown sort type: ' + sortType);
                return this.sortByName(cardList);
        }
        return results;
    }

    async sortByName(cardList) {
        return await this._sortByX(cardList, 'matchTitle', MtgenQuery.sortOrders.name);
    }

    async sortByColour(cardList) {
        return await this._sortByX(cardList, 'colour', MtgenQuery.sortOrders.colour);
    }

    async sortByRarity(cardList) {
        return await this._sortByX(cardList, 'rarity', MtgenQuery.sortOrders.rarity);
    }

    async sortByCost(cardList) {
        return await this._sortByX(cardList, 'ccost', MtgenQuery.sortOrders.cost);
    }

    async sortByType(cardList) {
        return await this._sortByX(cardList, 'typeCode', MtgenQuery.sortOrders.type);
    }

    async sortByGuild(cardList) {
        return await this._sortByX(cardList, 'guild', MtgenQuery.sortOrders.guild);
    }

    async sortByClan(cardList) {
        return await this._sortByX(cardList, 'clan', MtgenQuery.sortOrders.clan);
    }

    async sortByFaction(cardList) {
        return await this._sortByX(cardList, 'faction', MtgenQuery.sortOrders.faction);
    }

    async _sortByX(cardList, cardPropertyName, sortOrderEnum) {
        const sourceCards = await this._convertSetsToArray(cardList);
        const cards = sourceCards.sort((a, b) => this._sortBy(cardPropertyName, a, b));
        cards.sortOrder = sortOrderEnum;
        return cards;
    }

    async _groupAllByX(cardList, cardPropertyName, sortObj, getXFromCodeFunction, sortOrderEnum, otherSetOverrideName) {
        let sortedSets = [];

        var sourceCards = await this._convertSetsToArray(cardList);

        // Group cards by the sortBy and create a new card set for each
        let mainCards = sourceCards.filter(card => card.usableForDeckBuilding === true && card.type != 'Basic Land' && !card.token);
        let groupedCardSets = await this._groupByProperty(mainCards, cardPropertyName);
        const cardSets = await this._sortIntoArray(groupedCardSets, sortObj);
        for (let i = 0; i < cardSets.length; i++) {
            let set = await this.sortByName(cardSets[i]);
            const x = getXFromCodeFunction(set[0][cardPropertyName]);
            set.setDesc = x.name;
            sortedSets.push(set);
        }

        const basicLandCards = await this._getBasicLandCards(sourceCards);
        if (basicLandCards.length > 0) {
            sortedSets.push(basicLandCards);
        }

        // Flatten the grouped sets into a flat array of single cards.
        const selectedCards = sortedSets.reduce((allCards, sortedSet) => allCards.concat(sortedSet), []);
        const otherCards = await this._getOtherCards(sourceCards, selectedCards);
        if (otherCards.length > 0) {
            if (otherSetOverrideName) {
                otherCards.setDesc = otherSetOverrideName;
            }
            sortedSets.push(otherCards);
        }

        // Set the parent on each set.
        sortedSets.forEach(s => s.parent = sortedSets);

        sortedSets.sortOrder = sortOrderEnum;

        return sortedSets;
    }

    async groupAllByColour(cardList) {
        return await this._groupAllByX(cardList, 'colour', MtgenData.colours, MtgenData.getColourByCode, MtgenQuery.sortOrders.colour);
    }

    async groupAllByRarity(cardList) {
        return await this._groupAllByX(cardList, 'rarity', MtgenData.rarities, MtgenData.getRarityByCode, MtgenQuery.sortOrders.rarity);
    }

    async groupAllByCost(cardList) {
        let sortedSets = [];

        var sourceCards = await this._convertSetsToArray(cardList);

        // Group cards by the sortBy and create a new card set for each
        let mainCards = sourceCards.filter(card => card.usableForDeckBuilding === true && card.type != 'Basic Land' && !card.token);
        let groupedCardSets = await this._groupByProperty(mainCards, 'ccost');
        const cardSets = Object.keys(groupedCardSets).map(key => groupedCardSets[key]);
        for (let i = 0; i < cardSets.length; i++) {
            let set = await this.sortByName(cardSets[i]);
            set.setDesc = 'Cost ' + set[0].ccost;
            sortedSets.push(set);
        }

        const basicLandCards = await this._getBasicLandCards(sourceCards);
        if (basicLandCards.length > 0) {
            sortedSets.push(basicLandCards);
        }

        // Flatten the grouped sets into a flat array of single cards.
        const selectedCards = sortedSets.reduce((allCards, sortedSet) => allCards.concat(sortedSet), []);
        const otherCards = await this._getOtherCards(sourceCards, selectedCards);
        if (otherCards.length > 0) {
            sortedSets.push(otherCards);
        }

        // Set the parent on each set.
        sortedSets.forEach(s => s.parent = sortedSets);

        sortedSets.sortOrder = MtgenQuery.sortOrders.cost;

        return sortedSets;
    }

    async groupAllByType(cardList) {
        return await this._groupAllByX(cardList, 'typeCode', MtgenData.cardTypes, MtgenData.getCardTypeByCode, MtgenQuery.sortOrders.type);
    }

    async groupAllByGuild(cardList) {
        return await this._groupAllByX(cardList, 'guild', MtgenData.guilds, MtgenData.getGuildByCode, MtgenQuery.sortOrders.guild, "Non-Guild");
    }

    async groupAllByClan(cardList) {
        return await this._groupAllByX(cardList, 'clan', MtgenData.clans, MtgenData.getClanByCode, MtgenQuery.sortOrders.clan, "Non-Clan");
    }

    async groupAllByFaction(cardList) {
        return await this._groupAllByX(cardList, 'faction', MtgenData.factions, MtgenData.getFactionByCode, MtgenQuery.sortOrders.faction, "Non-Faction");
    }

    async _sortIntoArray(groupedCardSets, sortObj) {
        let cardSets = [];
        for (const sortItem in sortObj) {
            const thisSortItem = sortObj[sortItem];
            let set = groupedCardSets[thisSortItem.code];
            if (set) {
                set.sorder = thisSortItem.sorder;
                cardSets.push(set);
            }
        }
        cardSets = cardSets.sort((a, b) => this._sortBy('sorder', a, b));
        return cardSets;
    }

    async _getBasicLandCards(cardList) {
        let cards = cardList.filter(card => card.type == 'Basic Land');
        if (cards.length > 0) {
            cards = cards.sort(async (a, b) => await this._sortBy('matchTitle', a, b));
            cards.setDesc = 'Basic Land';
            cards.sortOrder = MtgenQuery.sortOrders.name;
        }
        return cards;
    }

    async _getOtherCards(allCards, selectedCards) {
        let cards = allCards.filter(x => !selectedCards.includes(x));
        if (cards.length > 0) {
            cards = cards.sort(async (a, b) => await this._sortBy('matchTitle', a, b));
            cards.setDesc = 'Other';
            cards.sortOrder = MtgenQuery.sortOrders.name;
        }
        return cards;
    }

    /* --------- Sorting All Cards --------------------------------------------------------------------------------------------------------------------- */

    static get sortOrders() {
        return {
            none: { sort: 'none' }
            , name: { sort: 'name' }
            , colour: { sort: 'colour' }
            , rarity: { sort: 'rarity' }
            , cost: { sort: 'cost' }
            , type: { sort: 'type' }
            , set: { sort: 'set' }
            , guild: { sort: 'guild' }
            , clan: { sort: 'clan' }
            , faction: { sort: 'faction' }
            , order: { sort: 'order' } // opened order within the set
        };
    }

    _sortBy(prop, a, b) {
        const aProp = a[prop];
        const bProp = b[prop]
        return ((aProp < bProp) ? -1 : ((aProp > bProp) ? 1 : 0));
    }
}