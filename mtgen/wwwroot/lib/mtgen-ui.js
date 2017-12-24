/*
MtGenerator UI class v1.0

Author: Cam Marsollier cam.marsollier@gmail.com

22-Jul-2017: Created.
*/

class MtgenUI {
    constructor(dataApi, queryApi) {
        // If missing any essentials, abort
        if (dataApi == null) { throw new Error(`Missing dataApi (from mtgen-data.js). Cannot continue.`); }
        this._dataApi = dataApi;

        if (queryApi == null) { throw new Error(`Missing queryApi (from mtgen-query.js). Cannot continue.`); }
        this._queryApi = queryApi;

        this._mainEl = document.querySelector('main'); // The main element within which all content will be rendered.

        this.version = "v1.0.0";

        // Display card loading counts as they load
        document.querySelector('#card-count .total').textContent = dataApi.setCardCount;
        const currentCardCountEl = document.querySelector('#card-count .current');
        window.addEventListener('playableCardLoaded', e => currentCardCountEl.textContent = e.detail.setCardsLoadedCount, false);
    }

    async renderUI() {
        this._mainEl.innerHTML =
            `<section id='products'></section>
             <section id='product-content'></section>
             <div class='back-to-top'><a class='button top' href='#'>Back to top</a></div>`;

        this._productsEl = this._mainEl.querySelector('#products');
        this._productContentEl = this._mainEl.querySelector('#product-content');
        this._currentProductContentEl; // will be filled by _renderCurrentProduct()

        this._renderProductTabs(this._dataApi.products);
        this._renderProductContentPlaceholders(this._dataApi.products);
        this._renderCurrentProduct();

        //// Render the initial views
        //my.initViews.forEach(view => view.render());

        //// Render the Product views
        //Object.values(this.ProductViews).forEach(view => view.renderType());

        //// If there is only one Product view, hide it the tab button (we need to render it so it will auto-execute the main Product)
        //if (Object.keys(this.ProductViews).length < 2) {
        //    document.querySelector('#products>a.button').style.display = 'none';
        //}

        //// If specified, auto-showTab the startup product from the Draw (if there is one),
        //// if not check if one is specified in the normal startup data.
        //if (my.hasDraw() && my.draw.productName && this.ProductViews[my.draw.productName] !== undefined) {
        //    this.ProductViews[my.draw.productName].showTab();
        //}
        //else if (my.startProductName) {
        //    this.ProductViews[my.startProductName].showTab();
        //}
        this._mainEl.addEventListener('click', async e => {
            if (e.target.classList.contains('button')) {
                await this._handleButtonClick(e, e.target);
            }
        });
    }

    async _handleButtonClick(e,el) {
        if (el.classList.contains(`sort-all`)) {
            await this._handleSortAllByButtonClick(el, el.dataset.sort);
            e.preventDefault();
        }
        else if (el.classList.contains(`sort-set`)) {
            const setEl = el.closest('section[data-setid]');
            await this._handleSortSetByButtonClick(el, el.dataset.sort, setEl.dataset.setid);
            e.preventDefault();
        }
    }

    async _handleSortAllByButtonClick(el, sortName) {
        const sortedResults = await this._queryApi.sortAllBy(this._dataApi.currentProduct.originalResults, sortName);
        this._dataApi.currentProduct.results = sortedResults;
        this._renderCurrentProductResults();
    }

    async _handleSortSetByButtonClick(el, sortName, setId) {
        const sortedSet = await this._queryApi.sortBy(this._dataApi.currentProduct.results[setId], sortName);
        this._dataApi.currentProduct.results[setId] = sortedSet;

        // Re-render and replace only this set's section.
        var el = this._currentProductContentEl.querySelector(`section[data-setid="${setId}"]`);
        el.innerHTML = this._renderCardSet(this._dataApi.currentProduct.results[setId], setId);
    }

    async _getSortAllByClassNames() { return Object.keys(MtgenQuery.sortOrders); }

    async _renderProductTabs(products) {
        if (products.length === 0) { return; }

        // Render one tab per product
        const productTabsHtml = [...products.values()].reduce((htmlOut, product) => {
            if (product.isVisible == undefined || product.isVisible == true) {
                return htmlOut += `<a data-product-name='${product.productName}' href='#' id='show-product-${product.productName}' class='button'>${product.productDesc}</a>`;
            }
        }, '');

        this._productsEl.innerHTML = productTabsHtml;

        // Switch products when user clicks product tab
        this._productsEl.addEventListener('click', e => {
            if (e.target.dataset.productName) {
                this._dataApi.currentProductName = e.target.dataset.productName;
                this._renderCurrentProduct();
            }
        });
    }

    async _renderProductContentPlaceholders(products) {
        if (products.length === 0) { return; }

        const productContentHtml = [...products.values()].reduce((htmlOut, product) => {
            if (product.isVisible == undefined || product.isVisible == true) {
                return htmlOut += `<section class='product-${product.productName}'><section class='options'></section><section class='result'></section></section>`;
            }
        }, '');

        this._productContentEl.innerHTML = productContentHtml;
    }

    async _renderCurrentProduct() {
        //TODO: change this to SetCurrentProduct which may call render.. or changing the current product will raise an event, and when the product changes this renders it
        // Highlight active tab
        Array.from(this._productsEl.querySelectorAll('.button')).forEach(n => n.classList.remove('active'));
        this._productsEl.querySelector('#show-product-' + this._dataApi.currentProductName).classList.add('active');

        // Highlight active content
        Array.from(this._productContentEl.querySelectorAll('#product-content > section')).forEach(n => n.classList.remove('active'));
        this._currentProductContentEl = this._productContentEl.querySelector('.product-' + this._dataApi.currentProductName);
        this._currentProductContentEl.classList.add('active');

        // TODO: combine the saved deck options and the default options...
        this._renderCurrentProductOptions();

        // If there are no options, auto-generate the product results.
        // TODO: if the set is fixed (not generated) and it's already generated, don't do it again
        if (this._dataApi.currentProduct.options === undefined) {
            // TODO: compare this XLN to prod; missing Basic Land and Other prod is Other (18) whereas this one is Other (1)
            // TODO: green "Growing Rites of Itlimoc".. wrong. It's a double-faced card, but it's not rendering as one
            this._dataApi.currentProduct.originalResults = await this._queryApi.generateCardSetsFromPacks(this._dataApi.currentProduct.currentSettings.packs);
            // TODO: this is the simple case where there is only one pack generated; not sure how it did it with multiple packs
            const sortedResults = await this._queryApi.sortAllBy(this._dataApi.currentProduct.originalResults, this._dataApi.currentProduct.initialSort);
            this._dataApi.currentProduct.results = sortedResults;
            // also need meta data stats... but should that be determined by the set (are there Guilds?) or the properties of all cards (does any card have a Guild?)
            // -- original just showed those that match the card output, so if no guilds in that pack, no guild sort/group
            // how much of this meta analysis does this generateCardSetsFromPacks do?
            // how was this done before?
            // what if generating the result arrays, each card was stamped with resultIndex, order? then we could just re-group/sort them
            this._renderCurrentProductResults();
        }

        //my.mainView.currentView = this;

        //Array.from(this.el.querySelectorAll('#product-content > section')).forEach(n => n.classList.remove('active'));
        //this.el.querySelector('#product-content .' + this.productName).classList.add('active');

        //// Render the options if not already done, hide old tab, show new tab
        //if (!this.isInitialized) {
        //    this.isInitialized = true;
        //    this.renderOptions();
        //}
    }

    async _renderCurrentProductOptions() {
        if (this._dataApi.currentProduct.options === undefined) { return; }

        const boosterInputs = this._dataApi.currentProduct.options.presets[0].packs.reduce((htmlOut, optionPack, index) => {
            const optionValues = this._dataApi.currentProduct.packs.reduce((htmlOut, pack) =>
                htmlOut += `<option value='${pack.packName}' ${pack.packName === optionPack.defaultPackName ? 'selected' : ''}>${pack.packDesc}</option>`,
                '');

            htmlOut +=
                `<div class='booster-input'>
                <input id='booster-count-${index + 1}' type='number' min='0' max='99' value='${optionPack.count}'>
                <select id='booster-${index + 1}' data-count-el='booster-count-${index + 1}'>
                    ${optionValues}
                </select>
                <button class='remove-input' title='Remove Booster'>-</button>
             </div>`
            return htmlOut;
        }, '');

        const optionsHtml =
            `<div class='presets'></div>
             <div class='packs'>
                 <section id='boosters'>
                     ${boosterInputs}
                 </div>
                 <input id='generate' type='submit' value='Generate my sets!'>
             </div>`;

        this._currentProductContentEl.querySelector('section.options').innerHTML = optionsHtml;
    }

    // All results should be rendered through this function
    _displayResults(productName, html) {
        //CAMKILL:
        //window.dispatchEvent(new Event('menusInitialized'));
        //this.contentElem.querySelector('#product-content .' + productName + ' .result').innerHTML = html;
        //setTimeout(() => window.dispatchEvent(new Event('layoutChanged')), 500);
        this._productContentEl.querySelector(`.product-${productName} .result`).innerHTML = html;
    }

    async _renderCurrentProductResults() {
        const product = this._dataApi.currentProduct;
        const packDesc = (product.packs.length && product.packs.length === 1) ? product.packs[0].packDesc : undefined;
        const title = packDesc || product.setDesc || 'All Cards';

        let allCardsHtml = this._renderCardsTitle(title, product.originalResults.totalLength)
            + this._renderTopMenu(product.results, 'all')
            + this._renderTopJumpMenu(product.results)
            + '<div>';
        // If this product is grouped, render the groups (sets)
        if (product.results.length && product.results[0].length) {
            product.results.forEach((result, index) => {
                allCardsHtml += this._renderCardSet(result, index, product.results);
            });
        }
        // Otherwise it's just a single array of cards (probably with a top-level sort of Name)
        else {
            allCardsHtml += `<section id='${this._friendlyUrl(product.productDesc)}-0' class='set' data-setid='0'>${this._renderCards(product.results)}</section>`;
        }
        allCardsHtml += '</div>';
        this._displayResults(product.productName, allCardsHtml);
    }

    _renderCardSet(cardSet, setIndex) {
        return `<section id='${this._friendlyUrl(cardSet.setDesc)}-${setIndex}' class='set' data-setid='${setIndex}'>`
            + this._renderCardsTitle(cardSet.setDesc, cardSet.length)
            + this._renderTopMenu(cardSet, 'set')
            + this._renderCards(cardSet)
            + `</section >`;
    }

    // General rendering functions
    _renderCardsTitle(title, cardCount) { return `<h2>${title} <span class='card-count'>(${cardCount})<a href="#" class="button top">[ Top ]</a></span></h2>`; }

    _renderTopMenu(results, allOrSet) {
        let menuItems = [];
        menuItems.push(this._renderTopMenuItem(MtgenQuery.sortOrders.name.sort, results, allOrSet));
        menuItems.push(this._renderTopMenuItem(MtgenQuery.sortOrders.colour.sort, results, allOrSet));
        menuItems.push(this._renderTopMenuItem(MtgenQuery.sortOrders.rarity.sort, results, allOrSet));
        menuItems.push(this._renderTopMenuItem(MtgenQuery.sortOrders.cost.sort, results, allOrSet));
        menuItems.push(this._renderTopMenuItem(MtgenQuery.sortOrders.type.sort, results, allOrSet));
        if (this._dataApi.cardsMetaData.hasGuilds) {
            menuItems.push(this._renderTopMenuItem(MtgenQuery.sortOrders.guild.sort, results, allOrSet));
        }
        if (this._dataApi.cardsMetaData.hasClans) {
            menuItems.push(this._renderTopMenuItem(MtgenQuery.sortOrders.clan.sort, results, allOrSet));
        }
        if (this._dataApi.cardsMetaData.hasFactions) {
            menuItems.push(this._renderTopMenuItem(MtgenQuery.sortOrders.faction.sort, results, allOrSet));
        }

        menuItems.push(`<a href='#exporter' class='button export' data-export='${allOrSet}'>Export</a>`);

        return `<section class='menu'><label>Sort ${allOrSet} by</label>${menuItems.join('')}</section>`;
    }

    _renderTopMenuItem(sortItemName, cardList, allOrSet) {
        // For sets, if the parent sort is by X, don't render the sort option for X.
        if (allOrSet === 'set' && sortItemName === cardList.parent.sortOrder.sort) {
            return '';
        }
        const activeClass = (sortItemName === cardList.sortOrder.sort) ? 'active ' : '';
        return `<a href='#' class='button ${activeClass}sort-${allOrSet}' data-sort='${sortItemName}'>${this._uppercaseFirstLetter(sortItemName)}</a>`;
    }

    _uppercaseFirstLetter(string) { return string.charAt(0).toUpperCase() + string.slice(1); }

    _renderTopJumpMenu(results) {
        if (results.length === undefined || results[0].length === undefined) { return ''; } // Jump menu not needed if there are no sub-groupings (ie sorted by name)
        const menuItems = results.reduce((menuItems, result, index) => {
            return menuItems.concat(`<a class='jump' href='#${this._friendlyUrl(result.setDesc)}-${index}'>${result.setDesc}<span class='card-count'> (${result.length})</span></a>`);
        }, []);
        return `<section class="menu jump">${menuItems.join('')}</section>`;
    }

    _renderCards(cards) {
        const htmlOut = cards.map(card => {
            let foilClass = '', doubleFaceClass = '', aStart = '', aEnd = '';
            let title = card.title;

            let cardImageHtml = this._renderCardImage(card);
            if (card.cardBack !== undefined) {
                cardImageHtml += this._renderCardImage(card.cardBack);
                title += '/' + card.cardBack.title;
                doubleFaceClass = ' doubleface';
            }
            else if (card.cardFront !== undefined) {
                cardImageHtml += this._renderCardImage(card.cardFront);
                title += '/' + card.cardFront.title;
                doubleFaceClass = ' doubleface';
            }
            const deckClass = card.inDeck === true ? ' moved-to-deck' : '';

            if (card.foil) {
                foilClass = ' foil';
                title += ' - Foil';
            }
            if (card.hasOwnProperty("src_large")) {
                aStart = "<a href='" + card.src_large + "' title='" + title + "'>";
                aEnd = "</a>";
            }

            const includedReason = (card.includedReason !== undefined) ? '<em class="reason">(' + card.includedReason + ')</em>' : '';
            return `<span class="card${foilClass}${doubleFaceClass}${deckClass}" data-mtgenid="${card.mtgenId}" title="${title}">${aStart}${cardImageHtml}<em class="title">${title}</em>${includedReason}${aEnd}</span>`;
        });
        return htmlOut.join('');
    }

    _renderCardImage(card) {
        const foilClass = card.foil ? ' foil' : '';
        const title = card.title + (card.foil ? ' - Foil' : '');

        const htmlOut = `<img data-usable-for-deck-building="${card.usableForDeckBuilding}" src="${card.src}" alt="${title}" title="${title}" width="${(card.width || 265)}" height="${(card.height || 370)}" />`;

        return htmlOut;
    }

    // Support functions --------------------------------------------------------------------------------------------------------------------------------

    // from: http://guegue.net/friendlyURL_JS
    _friendlyUrl(str, max) {
        if (str === undefined) return str;
        if (max === undefined) max = 32;
        let a_chars = new Array(
            new Array("a", /[áàâãªÁÀÂÃ]/g),
            new Array("e", /[éèêÉÈÊ]/g),
            new Array("i", /[íìîÍÌÎ]/g),
            new Array("o", /[òóôõºÓÒÔÕ]/g),
            new Array("u", /[úùûÚÙÛ]/g),
            new Array("c", /[çÇ]/g),
            new Array("n", /[Ññ]/g)
        );
        // Replace vowel with accent without them
        for (let i = 0; i < a_chars.length; i++) {
            str = str.replace(a_chars[i][1], a_chars[i][0]);
        }
        // first replace whitespace by -, second remove repeated - by just one, third turn in low case the chars,
        // fourth delete all chars which are not between a-z or 0-9, fifth trim the string and
        // the last step truncate the string to 32 chars 
        return str.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9\-]/g, '').replace(/\-{2,}/g, '-').replace(/(^\s*)|(\s*$)/g, '').substr(0, max);
    }
}