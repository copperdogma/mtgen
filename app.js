const compression = require('compression');
const express = require('express');
const request = require('request');

// Set up our view engine. We're using Handlebars (express-handlebars).
const expressHbs = require('express-handlebars');
const hbsDateformat = require('handlebars-dateformat');
const xhbsEngine = expressHbs.engine({
    layoutsDir: 'views/layouts/',
    defaultLayout: 'main-layout',
    extname: 'hbs',
    helpers: {
        dateFormat: hbsDateformat
    }
});

// Load and process sets.
const setsArr = require('./public/sets.json');
const allSets = setsArr.map(obj => ({
    ...obj,
    codeLowerCase: obj.code.toLowerCase(),
    prereleaseDateTimestamp: new Date(obj.prereleaseDate),
    hasPrereleaseDate: obj.prereleaseDate !== undefined && obj.prereleaseDate.length > 1 && obj.prereleaseDate.toLocaleLowerCase().trim() != 'n/a' && obj.prereleaseDate.toLocaleLowerCase().trim() != 'none',
    releaseDateTimestamp: new Date(obj.releaseDate),
    setFile: obj.setFile || '/sets.json',
    cardFiles: obj.cardFiles || ["cardsMain.json", "cardsToken.json", "cardsOther.json"],
    packFiles: obj.packFiles || ["packs.json"],
    productFile: obj.productFile || 'products.json',
    isBlockSet: obj.block !== undefined
}));
const setsMap = new Map(allSets.map(set => [set.code, set]));
let blocksAndSets = allSets.filter(s => !s.isBlockSet);
const blockNames = [...new Set(allSets.filter(s => s.block).map(set => set.block))];
blockNames.forEach(blockName => {
    // For the blocks, gather the sets and put them within
    const blockSetSorted = allSets.filter(set => set.block === blockName).sort((a, b) => a.releaseDateTimestamp - b.releaseDateTimestamp).reverse();
    const blockSet = blockSetSorted[0];
    blockSet.blockSets = blockSetSorted;
    blocksAndSets.push(blockSet);
});
blocksAndSets = blocksAndSets.filter(bns => (!bns.isBlockSet || bns.blockSets) && bns.releaseDate !== undefined)
    .sort((a, b) => a.releaseDateTimestamp - b.releaseDateTimestamp).reverse();

const app = express();

app.engine('hbs', xhbsEngine);
app.set('view engine', 'hbs');
app.set('views', 'views');

// Compress all HTTP responses
app.use(compression());

// Status monitor: /status
var healthCheckEndpoint = {
    // This defaults to dev settings.
    protocol: 'http',
    host: 'localhost',
    path: '/',
    port: '3000'
};
if (process.env.NODE_ENV === 'production') {
    healthCheckEndpoint.host = 'mtgen-test.dreamhosters.com';
    healthCheckEndpoint.port = 80;
}
app.use(require('express-status-monitor')({
    title: 'mtgen.net Status',
    path: '/status-machine',
    healthChecks: [healthCheckEndpoint]
}));

// Proxy for use with local-only card data importers.
if (process.env.NODE_ENV === 'development') {
    app.use('/proxy', (req, res) => {
        const url = req.query.u;
        if (!url) {
            return res.status(200).send("Missing 'u' parameter");
        }
        const proxyRequest = request.get(url);
        proxyRequest.on('error', (err) => res.status(200).send(`Server error (HTTP ${err.code}): ${err.message}`));
        proxyRequest.on('response', (response) => {
            if (response.statusCode !== 200) {
                return res.status(200).send(`Response error (HTTP ${err.code}): ${err.message}`);
            }
        });
        req.pipe(proxyRequest).pipe(res);
    });
}

// Home page: listing of all sets
app.get("/", (req, res) => {
    res.render('all-sets', { sets: blocksAndSets });
});

// Set page: generate packs for one particular set
app.get('/:route([A-Za-z0-9]{3})', (req, res) => {
    const route = req.params.route.toLocaleLowerCase();
    const set = setsMap.get(route.toUpperCase());
    if (set === undefined) {
        res.render('error', {
            pageTitle: 'No Such Set - ', errDesc: 'There is no such set.',
            errBody: `<p>Your requested set code <strong>"${route}"</strong> is not a valid Magic: The Gathering set code.</p>`
        });
        return;
    }
    else {
        var setJson;
        try {
            setJson = require(`./public/${route}/set.json`);
        }
        catch (error) {
            console.log(`${'-'.repeat(40)}\nRequested set not found: ./public/${route}/set.json not found: ${error}\n${'-'.repeat(40)}`);
            res.render('error', {
                pageTitle: 'No Such Set (Yet)  - ', errDesc: 'Set does not yet exist.',
                errBody: `<p>Your requested set <strong>"${route}"</strong>: <em>"${set.name}"</em>, which is a valid Magic: The Gathering set but I haven't yet created it.</p><p>If you'd like to see it <a href="mailto:cam.marsollier@gmail.com?subject=mtgen set request: ${route}">let me know</a> and I'll see what I can do!</p>`
            });
            return;
        }

        // Set exists and set.json file found. Render set.
        const combinedSet = { ...set, ...setJson };
        if (combinedSet.updates) {
            combinedSet.updates.map(update => {
                update.updateDateTimestamp = new Date(update.UpdateDate.substring(0, 19)) // Some dates have an extra :00 on the end (oops)
            });
            combinedSet.createdDateTimestamp = combinedSet.generatorCreatedDate;
            combinedSet.updateMoreCount = combinedSet.updates.length - 1;
            combinedSet.hasMultipleUpdates = combinedSet.updates.length > 1;
        }
        res.render('single-set', { ...combinedSet, pageTitle: combinedSet.name + ' - ', pageDesc: combinedSet.name });
    }
});

app.get("/about", (req, res) => { res.render('about', { pageTitle: 'About - ' }); });
app.get("/status", (req, res) => {
    const packageJson = require('./package.json');
    res.render('status', { process, package: packageJson });
});

app.use((req, res, next) => { res.render('error', { pageTitle: 'Page Not Found - ', errDesc: 'Page not found.' }) });

const PORT = process.env.PORT || 3000; // Hosting provider MAY provide process.env.PORT (should be 80);
app.listen(PORT, () => console.log(`App starting: listening to port ${PORT}`));