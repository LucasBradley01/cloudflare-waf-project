// Collect necessary libraries
const express = require('express');
const path = require('path');
const fetch = require('node-fetch');

// Initialize express app
const app = express();
app.use(express.json());
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Initialze REST API
app.get('/', (req, res) => res.status(200).sendFile(path.join(__dirname, './frontend/index.html')));
app.get('/animate.js', (req, res) => res.status(200).sendFile(path.join(__dirname, './frontend/animate.js')));
app.get('/style.css', (req, res) => res.status(200).sendFile(path.join(__dirname, './frontend/style.css')));
app.post('/login', async (req, res) => {
    
    // Get the data from the server api
    let rawEventsResult = await fetch("https://api.fpjs.io/events/" + req.body.requestId, {
        method: 'GET',
        headers: {
            "Auth-API-Key": "3xWrXmkeq5aKRKQelbLg"
        },
        redirect: 'follow'
    });
    let jsonEventsResult = await rawEventsResult.json();

    // Check if the response was successful
    if (jsonEventsResult.error) {
        res.status(400).send(JSON.stringify({
            result: 400,
            description: jsonEventsResult.error.message,
            error: jsonEventsResult
        }));
        return;
    }

    // Check if the visitorId they give matches the visitorId returned by the server api
    if (jsonEventsResult.products.identification.data.visitorId !== req.body.visitorId) {
        res.status(400).send(JSON.stringify({
            result: 400,
            description: "visitorId and requestId do not match"
        }));
        return;
    }

    // Check if the requestor is a bot
    if (!req.body.bot) { // jsonEventsResult.products.botd.data.bot.result !== "bad"
        res.status(200);
        res.send(JSON.stringify({
            result: 200,
            description: 'Ok'
        }));
        return;
    }

    // Create a filter to be used for blocking this ip
    let rawCreateFilterResult = await fetch("https://api.cloudflare.com/client/v4/zones/28f4cfd3041c170b9613d52b51d6b47e/filters", {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "X-Auth-Email": "lucasbradley4859@gmail.com",
            "Authorization": "Bearer V54IDqR-eeJsy6ZhBAAcIE8s5agZVPv2-bZbe-YX"
        },
        body: JSON.stringify([{
            "expression": "(ip.src eq " + jsonEventsResult.products.botd.data.ip + ")"
        }]),
        redirect: 'follow'
    });
    let jsonCreateFilterResult = await rawCreateFilterResult.json();    

    // Check if the filters were successfully created
    if (rawCreateFilterResult.status !== 200) {
        if (jsonCreateFilterResult.errors[0].code === 10102) {
            res.status(200).send(JSON.stringify({
                result: 200,
                description: 'User already blocked',
                error: jsonCreateFilterResult
            }));
            return;
        }
        
        res.status(500).send(JSON.stringify({
            result: 500,
            description: 'Internal server error',
            error: jsonCreateFilterResult
        }));
        return;
    }

    // Get the id of the newly created filters
    let rawCreateRuleResult = await fetch("https://api.cloudflare.com/client/v4/zones/28f4cfd3041c170b9613d52b51d6b47e/firewall/rules", {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "X-Auth-Email": "lucasbradley4859@gmail.com",
            "Authorization": "Bearer V54IDqR-eeJsy6ZhBAAcIE8s5agZVPv2-bZbe-YX"
        },
        body: JSON.stringify([{
            "filter": {
                "id": jsonCreateFilterResult.result[0].id
            },
            "action": "block",
            "description": "block-" + req.body.visitorId + "-ip"
        }]),
        redirect: 'follow'
    })
    let jsonCreateRuleResult = await rawCreateRuleResult.json();

    // Check if the rule was successfully created
    if (rawCreateRuleResult.status !== 200) {                
        let rawFilterDeleteResult = await fetch("https://api.cloudflare.com/client/v4/zones/28f4cfd3041c170b9613d52b51d6b47e/filters/" + jsonCreateFilterResult.result[0].id, {
            method: 'DELETE',
            headers: {
              "X-Auth-Email": "lucasbradley4859@gmail.com",
              "Content-Type": "application/json",
              "Authorization": "Bearer V54IDqR-eeJsy6ZhBAAcIE8s5agZVPv2-bZbe-YX"
            },
            redirect: 'follow'
        });
        let jsonFilterDeleteResult = await rawFilterDeleteResult.json();

        res.status(500).send(JSON.stringify({
            result: 500,
            description: 'Internal server error',
            error: rawCreateRuleResult,
            operation: jsonFilterDeleteResult
        }));
        return;
    }

    // The "login" request was successful
    res.status(200).send(JSON.stringify({
        result: 200,
        description: 'Bot blocked'
    }));

    // Wait for a minute to delete the rule. For PoC purposes only
    await new Promise(resolve => setTimeout(resolve, 60000));

    // The follow parameeter ensures the filter is deleted with the rule: ?delete_filter_if_unused=true
    let rawDeleteResult = await fetch("https://api.cloudflare.com/client/v4/zones/28f4cfd3041c170b9613d52b51d6b47e/firewall/rules/" + jsonCreateRuleResult.result[0].id + "?delete_filter_if_unused=true", {
        method: 'DELETE',
        headers: {
            "Content-Type": "application/json",
            "X-Auth-Email": "lucasbradley4859@gmail.com",
            "Authorization": "Bearer V54IDqR-eeJsy6ZhBAAcIE8s5agZVPv2-bZbe-YX"
        },
        redirect: 'follow'
    });
    let jsonDeleteResult = await rawDeleteResult.json();

});

//const client = redis.createClient();
const port = process.env.PORT || 3000;
app.listen(port, (err) => {
    if (err) console.log(err);
    console.log(`Listening on port ${port}...`)
});
