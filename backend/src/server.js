const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

const config = require('./config');
const DataAccessManager = require('./data/DataAccessManager');

const ItemTypesManager = require('./managers/ItemTypesManager');
const OwnersManager = require('./managers/OwnersManager');
const ItemsManager = require('./managers/ItemsManager');

/**
 * Registers every API route on the given Express instance.
 * @param {import('express').Express} app
 */
function RegisterRoutes(app)
{
    app.get('/health', function (req, res)
    {
        res.status(200).json({ status: 'OK' });
    });

    // #region ITEM TYPES
    app.get('/item-types', ItemTypesManager.GetAll);
    app.get('/item-types/:id', ItemTypesManager.GetById);
    app.post('/item-types', ItemTypesManager.Create);
    app.put('/item-types/:id', ItemTypesManager.Update);
    app.delete('/item-types/:id', ItemTypesManager.Delete);
    // #endregion

    // #region OWNERS
    app.get('/owners', OwnersManager.GetAll);
    app.get('/owners/:id', OwnersManager.GetById);
    app.post('/owners', OwnersManager.Create);
    app.put('/owners/:id', OwnersManager.Update);
    app.delete('/owners/:id', OwnersManager.Delete);
    // #endregion

    // #region ITEMS
    app.get('/items/stats/enriched', ItemsManager.GetEnriched);
    app.get('/items/stats/by-type', ItemsManager.GetStatsByType);
    app.get('/items/stats/by-owner', ItemsManager.GetStatsByOwner);
    app.get('/items/stats/capacity', ItemsManager.GetCapacityReport);
    app.get('/items', ItemsManager.GetAll);
    app.get('/items/:id', ItemsManager.GetById);
    app.post('/items', ItemsManager.Create);
    app.put('/items/:id', ItemsManager.Update);
    app.post('/items/:id/store', ItemsManager.Store);
    app.post('/items/:id/retrieve', ItemsManager.Retrieve);
    app.delete('/items/:id', ItemsManager.Delete);
    // #endregion
}

/**
 * Serves the built frontend (frontend/dist) and, for any GET request
 * that did not match an API route above, returns its index.html. This
 * must be registered after every API route, since Express only falls
 * through to it when nothing earlier already handled the request.
 * @param {import('express').Express} app
 */
function RegisterFrontendFallback(app)
{
    const frontendDistPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
    const indexHtmlPath = path.join(frontendDistPath, 'index.html');

    app.use(express.static(frontendDistPath));

    app.get('*', function (req, res)
    {
        const frontendIsBuilt = fs.existsSync(indexHtmlPath);
        if (frontendIsBuilt === false)
        {
            res.status(404).json({ error: 'Frontend build not found. Run "npm run build" inside the frontend folder first.' });
            return;
        }

        res.sendFile(indexHtmlPath);
    });
}

/**
 * Connects to MongoDB, builds the Express app with its routes, and
 * starts listening for requests.
 */
async function StartServer()
{
    await DataAccessManager.Connect(config.MONGODB_URI, config.MONGODB_DB_NAME);

    const app = express();
    app.use(cors());
    app.use(express.json());

    RegisterRoutes(app);
    RegisterFrontendFallback(app);

    app.listen(config.PORT, function ()
    {
        console.log(`Server listening on http://localhost:${config.PORT}`);
    });
}

StartServer();
