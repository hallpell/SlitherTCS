const { onRequest } = require("firebase-functions/v2/https");

const TARGETS = {
    ml4k: "https://machinelearningforkids.co.uk",
};

exports.proxy = onRequest(
    { cors: ["https://slithertcs.com"], maxInstances: 10 },
    async (req, res) => {
	// req.path looks like "/ml4k/api/scratch/KEY/classify"
	const [, name, ...rest] = req.path.split("/");
	const base = TARGETS[name];
	if (!base) {
	    res.status(403).send("Not allowed");
	    return;
	}

	const query = req.url.includes("?") ?
	      req.url.slice(req.url.indexOf("?")) : "";
	const hasBody = !["GET", "HEAD"].includes(req.method);

	const resp = await fetch(base + "/" + rest.join("/") + query, {
	    method: req.method,
	    headers: { "Content-Type": req.get("Content-Type") ||
		       "application/json" },
	    body: hasBody ? req.rawBody : undefined,
	});
	
	res
	    .status(resp.status)
	    .set("Content-Type", resp.headers.get("Content-Type") ||
		 "application/json")
	    .send(Buffer.from(await resp.arrayBuffer()));
    }
);
