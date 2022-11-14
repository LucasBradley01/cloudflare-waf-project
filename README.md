# CloudFlare WAF Project

## Notion Article

The article for this project can be found in Notion [here](https://www.notion.so/fingerprintjs/How-to-automatically-block-bad-bots-to-your-site-with-Cloudflare-de572b55816b44bf9793664b83d142d8). 

## Notes on Implementation

The source code for the backend which uses CloudFlare WAF to block bots is in `index.js`. Currently, data is ingested using a POST command at the route `/login`. However, it would be better to use a webhook.

# Basic Backend Process

## Ingest Event Data

There are two ways to ingest the event data to block unwanted bots. The recommended way is using [web hooks](https://dev.fingerprint.com/docs/webhooks). Alternatively the requestId can be sent to the backend and then the event data can be accessed using [Fingerprint Server API](https://dev.fingerprint.com/docs/server-api).

Once you have the event data, you can check the botd, data, bot, result field to determine if the visitor is an unwanted bot. The IP is extracted from the botd, data, ip field and used in the WAF Rule.

## Using CloudFlare WAF API

In order use CloudFlare WAF API, first get permissions to read and edit the Zone’s Firewall Services. 

## Create a CloudFlare Token

1. Go [here](https://dash.cloudflare.com/profile/api-tokens).
2. Select the `Create Token` button.
3. Select the `Create Customer Token` button.
4. In permissions add the following Rules.
    1. Zone, Firewall Services, Read.
    2. Zone, Firewall Services, Write.
5. Select the `Continue to Summary` button.
6. Select the `Create Token` button.

## Create a WAF Filter
A CloudFlare WAF Filter requires an expressions. In this case you can create the expressions “ip.src eq <bot IP>” where <bot IP> is the IP extracted from the Server API event data. More information on creating a CloudFlare WAF Filter can be found [here](https://developers.cloudflare.com/firewall/api/cf-filters/post/).

If there is already a WAF filter with an equal expression, then it will return an error code of 10102.

## Create a WAF Rule

A CloudFlare WAF Rule requires a a filter ID and an action. The filter ID is extracted from the previously created filter rule. The action is hard coded as “block” to block all the HTTP traffic selected by the filter. More information on creating a CloudFlare WAF Rule can be found [here](https://developers.cloudflare.com/firewall/api/cf-firewall-rules/post/).

Should the CloudFlare WAF Rule creation fail, it is important to [delete the previously created filter](https://developers.cloudflare.com/firewall/api/cf-filters/delete/).

## Delete the WAF Rule

CloudFlare does not support timed WAF rules. Keep track of WAF rules on the backend, and delete them using their rule ID and add the following to delete the filter with it `?delete_filter_if_unused=true`. Documentation on the delete API call is [here](https://developers.cloudflare.com/firewall/api/cf-firewall-rules/delete/).
