const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 7000;

const UPSTREAM_URL = "https://victorgveloso.github.io/animes-season-addon";

app.use(cors());

// Handle manifest.json specifically
app.get('/manifest.json', async (req, res) => {
    try {
        const response = await axios.get(`${UPSTREAM_URL}/manifest.json`);
        let json = response.data;

        // 1. Overwrite ID and Name
        json.id = "animes-series-season-addon";
        json.name = "Anime series' season";

        // 2. Remove types[0]
        if (json.types && json.types.length > 0) {
            json.types.shift(); // Removes the first element
        }

        // 3. Remove catalogs[3] and catalogs[1]
        // IMPORTANT: Remove higher index first to avoid shifting issues
        if (json.catalogs) {
            if (json.catalogs.length > 3) json.catalogs.splice(3, 1);
            if (json.catalogs.length > 1) json.catalogs.splice(1, 1);
        }

        res.json(json);
    } catch (error) {
        console.error(error);
        res.status(502).send('Bad Gateway');
    }
});

// Proxy everything else
app.use(async (req, res) => {
    try {
        const url = UPSTREAM_URL + req.originalUrl;
        const response = await axios({
            method: req.method,
            url: url,
            responseType: 'stream'
        });

        res.set(response.headers);
        response.data.pipe(res);
    } catch (error) {
        // If upstream 404s, we 404. If network error, 502.
        if (error.response) {
            res.status(error.response.status).send(error.response.statusText);
        } else {
            res.status(502).send('Bad Gateway');
        }
    }
});

app.listen(PORT, () => {
    console.log(`Addon active on port ${PORT}`);
});